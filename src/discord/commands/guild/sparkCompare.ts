import DiscordCommand from '../../private/interactions/commands/DiscordCommand.ts';
import DiscordCommandMetadata from '../../private/interactions/commands/DiscordCommandMetadata.ts';
import EmbedHelper from '../../private/EmbedHelper.ts';
import PolyHelperError from '../../../private/error.ts';
import {
  InteractionFlag,
  InteractionPermission,
  InteractionResponse,
  type InteractionWithGuild
} from '../../../types/discord.ts';
import { findSparkId, getSparkURL } from '../../../utils/sparkUtils.ts';
import type { ChatInputCommandInteraction } from 'discord.js';

class SparkCompareCommand extends DiscordCommand {
  override readonly metadata: DiscordCommandMetadata = new DiscordCommandMetadata()
    .setName('spark-compare')
    .setDescription('Compare two spark profiles with Claude and write a fix brief')
    .addStringOption((option) =>
      option
        .setName('baseline')
        .setDescription('The spark.lucko.me link to compare against, e.g. without mods or before an update')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option.setName('link').setDescription('The spark.lucko.me link with the problem').setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('notes')
        .setDescription('What differs between the two, e.g. same world, second one has PolyBlur')
        .setMaxLength(1000)
    )
    .setFlags(InteractionFlag.RequiresGuild)
    .setPermission(InteractionPermission.Support)
    .setResponse(InteractionResponse.Ephemeral)
    .setCleanErrorTitle('compare these spark profiles');

  override async execute(interaction: InteractionWithGuild<ChatInputCommandInteraction>) {
    const config = this.discord.application.config.sparkAnalysis;
    if (!config.enabled) throw new PolyHelperError('Spark analysis is disabled');

    const baselineId = findSparkId(interaction.options.getString('baseline', true));
    if (!baselineId) throw new PolyHelperError("The baseline isn't a spark.lucko.me link");
    const sparkId = findSparkId(interaction.options.getString('link', true));
    if (!sparkId) throw new PolyHelperError("The link isn't a spark.lucko.me link");

    const { analysisMessage, fixMessage } = await this.discord.application.spark.scanSparkLog({
      sparkId,
      baselineId,
      supportNotes: interaction.options.getString('notes'),
      channelId: interaction.channel.id,
      channelUrl: interaction.channel.url,
      requester: interaction.user.id
    });
    await interaction.followUp({
      embeds: [
        new EmbedHelper()
          .setTitle('Comparing Spark Profiles')
          .setURL(getSparkURL(sparkId))
          .setDescription(
            `Baseline: ${getSparkURL(baselineId)}\nAnalysis: ${analysisMessage.url}\nProposed fix: ${fixMessage.url}`
          )
      ]
    });
  }
}

export default SparkCompareCommand;
