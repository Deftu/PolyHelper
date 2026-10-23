import Anthropic from '@anthropic-ai/sdk';
import DiscordCommand from '../../private/interactions/commands/DiscordCommand.ts';
import DiscordCommandMetadata from '../../private/interactions/commands/DiscordCommandMetadata.ts';
import EmbedHelper from '../../private/EmbedHelper.ts';
import PolyHelperError from '../../../private/error.ts';
import {
  ActionRowBuilder,
  AttachmentBuilder,
  type BaseMessageOptions,
  ButtonBuilder,
  ButtonStyle,
  type ChatInputCommandInteraction,
  type Message,
  type SendableChannels
} from 'discord.js';
import {
  InteractionFlag,
  InteractionPermission,
  InteractionResponse,
  type InteractionWithGuild
} from '../../../types/discord.ts';
import {
  analyzeProfile,
  downloadProfile,
  findSparkId,
  getNoFixReason,
  getSparkURL,
  parseAnalysis,
  removeProfile,
  saveProfile,
  writeFixBrief
} from '../../../utils/sparkUtils.ts';
import { toError } from '../../../utils/miscUtils.ts';
import type { SparkJob, SparkReportKind } from '../../../types/spark.ts';

const embedDescriptionLimit = 4096;
const reportTitles: Record<SparkReportKind, string> = { analysis: 'Spark Analysis', fix: 'Fix Brief' };
const reportColors: Record<SparkReportKind, 'Green' | 'Blue'> = { analysis: 'Green', fix: 'Blue' };

class SparkCommand extends DiscordCommand {
  override readonly metadata: DiscordCommandMetadata = new DiscordCommandMetadata()
    .setName('spark')
    .setDescription('Analyze a spark profile with Claude and write a fix brief')
    .addStringOption((option) =>
      option.setName('link').setDescription('The spark.lucko.me link to analyze').setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('notes')
        .setDescription('What the user is seeing, e.g. FPS drops when opening their inventory')
        .setMaxLength(1000)
    )
    .setFlags(InteractionFlag.GuildCommand)
    .setPermission(InteractionPermission.Support)
    .setResponse(InteractionResponse.Ephemeral)
    .setCleanErrorTitle('analyze this spark profile');
  private readonly running = new Set<string>();

  override async execute(interaction: InteractionWithGuild<ChatInputCommandInteraction>) {
    const config = this.discord.application.config.sparkAnalysis;
    if (!config.enabled) throw new PolyHelperError('Spark analysis is disabled');

    const sparkId = findSparkId(interaction.options.getString('link', true));
    if (!sparkId) throw new PolyHelperError("That isn't a spark.lucko.me link");
    if (this.running.has(sparkId)) throw new PolyHelperError('That spark profile is already being analyzed');

    const [analysisChannel, fixChannel] = await Promise.all([
      this.discord.getChannel('sparkAnalysis'),
      this.discord.getChannel('sparkFixes')
    ]);

    this.running.add(sparkId);
    const profilePath = await downloadProfile(sparkId)
      .then((data) => saveProfile(sparkId, data))
      .catch((error) => {
        this.running.delete(sparkId);
        throw error;
      });
    const job: SparkJob = {
      client: new Anthropic({ apiKey: config.anthropicApiKey }),
      config,
      sparkId,
      profilePath,
      supportNotes: interaction.options.getString('notes'),
      channelId: interaction.channel.id,
      channelUrl: interaction.channel.url,
      requester: interaction.user.id
    };
    const [analysisMessage, fixMessage] = await this.sendPendingMessages(job, analysisChannel, fixChannel).catch(
      async (error) => {
        this.running.delete(sparkId);
        await removeProfile(profilePath).catch((e) => this.discord.application.logError(toError(e)));
        throw error;
      }
    );

    this.runJob(job, analysisMessage, fixMessage).finally(() => this.running.delete(sparkId));
    await interaction.followUp({
      embeds: [
        new EmbedHelper()
          .setTitle('Analyzing Spark Profile')
          .setURL(getSparkURL(sparkId))
          .setDescription(`Analysis: ${analysisMessage.url}\nProposed fix: ${fixMessage.url}`)
      ]
    });
  }

  private async sendPendingMessages(
    job: SparkJob,
    analysisChannel: SendableChannels,
    fixChannel: SendableChannels
  ): Promise<[Message, Message]> {
    const analysisMessage = await analysisChannel.send(this.getPendingMessage(job, 'analysis', '⏳ Working on it...'));
    const fixMessage = await fixChannel.send(
      this.getPendingMessage(job, 'fix', '⏳ Waiting for the analysis...', analysisMessage)
    );
    return [analysisMessage, fixMessage];
  }

  private async runJob(job: SparkJob, analysisMessage: Message, fixMessage: Message) {
    try {
      const analysis = await this.runReport(job, 'analysis', analysisMessage, async () => {
        const result = parseAnalysis(await analyzeProfile(job));
        await analysisMessage.edit(this.getReportMessage(job, 'analysis', result.report));
        return result;
      });
      if (!analysis) {
        return await this.editSafely(
          fixMessage,
          this.getSkippedMessage(job, 'The analysis failed, so no fix was attempted.', analysisMessage)
        );
      }
      if (!analysis.handoff?.possible) {
        const reason = analysis.handoff?.reason ?? 'The analysis did not find a mod to fix.';
        return await this.editSafely(fixMessage, this.getSkippedMessage(job, reason, analysisMessage));
      }

      await this.editSafely(fixMessage, this.getPendingMessage(job, 'fix', '⏳ Working on it...', analysisMessage));
      await this.runReport(
        job,
        'fix',
        fixMessage,
        async () => {
          const report = await writeFixBrief(job, analysis);
          const noFixReason = getNoFixReason(report);
          await fixMessage.edit(
            noFixReason
              ? this.getSkippedMessage(job, noFixReason, analysisMessage)
              : this.getReportMessage(job, 'fix', report, analysisMessage)
          );
        },
        analysisMessage
      );
    } finally {
      await removeProfile(job.profilePath).catch((error) => this.discord.application.logError(toError(error)));
    }
  }

  private async runReport<T>(
    job: SparkJob,
    kind: SparkReportKind,
    message: Message,
    run: () => Promise<T>,
    analysisMessage?: Message
  ): Promise<T | undefined> {
    try {
      return await run();
    } catch (error) {
      await this.discord.application.logError(toError(error), [
        { name: 'Spark Profile', value: getSparkURL(job.sparkId) },
        { name: 'Report', value: reportTitles[kind] }
      ]);
      await this.editSafely(message, this.getFailedMessage(job, kind, error, analysisMessage));
      return undefined;
    }
  }

  private async editSafely(message: Message, options: BaseMessageOptions) {
    await message.edit(options).catch((error) => this.discord.application.logError(toError(error)));
  }

  private getBaseEmbed(job: SparkJob, kind: SparkReportKind): EmbedHelper {
    return new EmbedHelper()
      .setTitle(`${reportTitles[kind]}: ${job.sparkId}`)
      .setURL(getSparkURL(job.sparkId))
      .setColor(reportColors[kind])
      .setFields(
        { name: 'Requested By', value: `<@${job.requester}>`, inline: true },
        { name: 'Requested In', value: `<#${job.channelId}>`, inline: true }
      );
  }

  private getButtons(job: SparkJob, analysisMessage?: Message): BaseMessageOptions['components'] {
    const buttons = [
      new ButtonBuilder().setLabel('Spark Profile').setStyle(ButtonStyle.Link).setURL(getSparkURL(job.sparkId)),
      new ButtonBuilder().setLabel('Requested In').setStyle(ButtonStyle.Link).setURL(job.channelUrl)
    ];
    if (analysisMessage) {
      buttons.push(new ButtonBuilder().setLabel('Analysis').setStyle(ButtonStyle.Link).setURL(analysisMessage.url));
    }
    return [new ActionRowBuilder<ButtonBuilder>().addComponents(buttons)];
  }

  private getPendingMessage(
    job: SparkJob,
    kind: SparkReportKind,
    status: string,
    analysisMessage?: Message
  ): BaseMessageOptions {
    const embed = this.getBaseEmbed(job, kind).setDescription(status);
    if (job.supportNotes) embed.addFields({ name: 'Notes', value: job.supportNotes });
    return { embeds: [embed], components: this.getButtons(job, analysisMessage) };
  }

  private getReportMessage(
    job: SparkJob,
    kind: SparkReportKind,
    report: string,
    analysisMessage?: Message
  ): BaseMessageOptions {
    const truncated = report.length > embedDescriptionLimit;
    const embed = this.getBaseEmbed(job, kind)
      .setDescription(
        truncated
          ? `${report.slice(0, embedDescriptionLimit - 100)}\n\n*Truncated. The full report is attached.*`
          : report
      )
      .setAIFooter();
    if (job.supportNotes) embed.addFields({ name: 'Notes', value: job.supportNotes });
    return {
      embeds: [embed],
      files: truncated ? [new AttachmentBuilder(Buffer.from(report), { name: `${kind}-${job.sparkId}.md` })] : [],
      components: this.getButtons(job, analysisMessage)
    };
  }

  private getSkippedMessage(job: SparkJob, reason: string, analysisMessage?: Message): BaseMessageOptions {
    return {
      embeds: [this.getBaseEmbed(job, 'fix').setColor('Gray').setDescription(`No fix brief. ${reason}`).setAIFooter()],
      components: this.getButtons(job, analysisMessage)
    };
  }

  private getFailedMessage(
    job: SparkJob,
    kind: SparkReportKind,
    error: unknown,
    analysisMessage?: Message
  ): BaseMessageOptions {
    const reason = error instanceof PolyHelperError ? error.message : 'This error has been reported to the devs';
    return {
      embeds: [
        this.getBaseEmbed(job, kind).setColor('Red').setDescription(`❌ ${reportTitles[kind]} failed: ${reason}`)
      ],
      components: this.getButtons(job, analysisMessage)
    };
  }
}

export default SparkCommand;
