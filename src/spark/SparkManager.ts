import Anthropic from '@anthropic-ai/sdk';
import EmbedHelper from '../discord/private/EmbedHelper.ts';
import PolyHelperError from '../private/error.ts';
import {
  ActionRowBuilder,
  AttachmentBuilder,
  type BaseMessageOptions,
  ButtonBuilder,
  ButtonStyle,
  type Message,
  type SendableChannels
} from 'discord.js';
import {
  analyzeProfile,
  downloadProfile,
  getNoFixReason,
  getSparkURL,
  parseAnalysis,
  removeProfile,
  saveProfile,
  writeFixBrief
} from '../utils/sparkUtils.ts';
import { toError } from '../utils/miscUtils.ts';
import type Application from '../Application.ts';
import type {
  ScanSparkLogMetadata,
  ScanSparkLogResult,
  SparkJob,
  SparkProfile,
  SparkReportKind
} from '../types/spark.ts';

class SparkManager {
  private readonly running = new Set<string>();
  constructor(readonly application: Application) {}

  static reportTitles: Record<SparkReportKind, string> = { analysis: 'Spark Analysis', fix: 'Fix Brief' };
  static reportColors: Record<SparkReportKind, 'Green' | 'Blue'> = { analysis: 'Green', fix: 'Blue' };

  async scanSparkLog({
    sparkId,
    baselineId = null,
    supportNotes,
    channelId,
    channelUrl,
    requester
  }: ScanSparkLogMetadata): Promise<ScanSparkLogResult> {
    const config = this.application.config.sparkAnalysis;
    if (!config.enabled) throw new PolyHelperError('Spark analysis is disabled');
    if (baselineId === sparkId) throw new PolyHelperError('Pick two different spark profiles to compare');
    const runningKey = baselineId ? `${baselineId}:${sparkId}` : sparkId;
    if (this.running.has(runningKey)) throw new PolyHelperError('That spark profile is already being analyzed');

    const [analysisChannel, fixChannel] = await Promise.all([
      this.application.discord.getChannel('sparkAnalysis'),
      this.application.discord.getChannel('sparkFixes')
    ]);

    this.running.add(runningKey);
    const [profile, baseline] = await Promise.allSettled([
      this.fetchProfile(sparkId),
      baselineId ? this.fetchProfile(baselineId) : Promise.resolve(null)
    ]);
    if (profile.status === 'rejected' || baseline.status === 'rejected') {
      this.running.delete(runningKey);
      await this.removeProfiles([
        profile.status === 'fulfilled' ? profile.value : null,
        baseline.status === 'fulfilled' ? baseline.value : null
      ]);
      throw profile.status === 'rejected' ? profile.reason : (baseline as PromiseRejectedResult).reason;
    }

    const job: SparkJob = {
      client: new Anthropic({ apiKey: config.anthropicApiKey }),
      config,
      ...profile.value,
      baseline: baseline.value,
      supportNotes,
      channelId,
      channelUrl,
      requester
    };
    const [analysisMessage, fixMessage] = await this.sendPendingMessages(job, analysisChannel, fixChannel).catch(
      async (error) => {
        this.running.delete(runningKey);
        await this.removeProfiles([job, job.baseline]);
        throw error;
      }
    );

    this.runJob(job, analysisMessage, fixMessage).finally(() => this.running.delete(runningKey));
    return { analysisMessage, fixMessage };
  }

  private async fetchProfile(sparkId: string): Promise<SparkProfile> {
    const profilePath = await saveProfile(sparkId, await downloadProfile(sparkId));
    return { sparkId, profilePath };
  }

  private async removeProfiles(profiles: (SparkProfile | null)[]) {
    for (const profile of profiles) {
      if (!profile) continue;
      await removeProfile(profile.profilePath).catch((error) => this.application.logError(toError(error)));
    }
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
      await this.removeProfiles([job, job.baseline]);
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
      await this.application.logError(toError(error), [
        { name: 'Spark Profile', value: getSparkURL(job.sparkId) },
        { name: 'Report', value: SparkManager.reportTitles[kind] }
      ]);
      await this.editSafely(message, this.getFailedMessage(job, kind, error, analysisMessage));
      return undefined;
    }
  }

  private async editSafely(message: Message, options: BaseMessageOptions) {
    await message.edit(options).catch((error) => this.application.logError(toError(error)));
  }

  private getBaseEmbed(job: SparkJob, kind: SparkReportKind): EmbedHelper {
    const embed = new EmbedHelper()
      .setTitle(`${SparkManager.reportTitles[kind]}: ${job.sparkId}`)
      .setURL(getSparkURL(job.sparkId))
      .setColor(SparkManager.reportColors[kind])
      .setFields(
        { name: 'Requested By', value: `<@${job.requester}>`, inline: true },
        { name: 'Requested In', value: `<#${job.channelId}>`, inline: true }
      );
    if (job.baseline) {
      embed.addFields({ name: 'Compared With', value: getSparkURL(job.baseline.sparkId), inline: true });
    }
    return embed;
  }

  private getButtons(job: SparkJob, analysisMessage?: Message): BaseMessageOptions['components'] {
    const buttons = [
      new ButtonBuilder().setLabel('Spark Profile').setStyle(ButtonStyle.Link).setURL(getSparkURL(job.sparkId))
    ];
    if (job.baseline) {
      buttons.push(
        new ButtonBuilder()
          .setLabel('Baseline Profile')
          .setStyle(ButtonStyle.Link)
          .setURL(getSparkURL(job.baseline.sparkId))
      );
    }
    buttons.push(new ButtonBuilder().setLabel('Requested In').setStyle(ButtonStyle.Link).setURL(job.channelUrl));
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
    const truncated = report.length > EmbedHelper.embedDescriptionLimit;
    const embed = this.getBaseEmbed(job, kind)
      .setDescription(
        truncated
          ? `${report.slice(0, EmbedHelper.embedDescriptionLimit - 100)}\n\n*Truncated. The full report is attached.*`
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
        this.getBaseEmbed(job, kind)
          .setColor('Red')
          .setDescription(`❌ ${SparkManager.reportTitles[kind]} failed: ${reason}`)
      ],
      components: this.getButtons(job, analysisMessage)
    };
  }
}

export default SparkManager;
