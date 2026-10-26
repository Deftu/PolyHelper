import DiscordCommand from '../../private/interactions/commands/DiscordCommand.ts';
import DiscordCommandMetadata from '../../private/interactions/commands/DiscordCommandMetadata.ts';
import EmbedHelper from '../../private/EmbedHelper.ts';
import PolyHelperError from '../../../private/error.ts';
import { InteractionFlag, InteractionPermission, type InteractionWithGuild } from '../../../types/discord.ts';
import { hasRole } from '../../../utils/discordUtils.ts';
import { isGuildMember } from '@sapphire/discord.js-utilities';
import { toError } from '../../../utils/miscUtils.ts';
import type { ChatInputCommandInteraction } from 'discord.js';

class GiveawayBlockCommand extends DiscordCommand {
  override readonly metadata: DiscordCommandMetadata = new DiscordCommandMetadata()
    .setName('giveaway-block')
    .setDescription('Block a user from giveaways')
    .addUserOption((option) => option.setName('user').setDescription('The user to block').setRequired(true))
    .addStringOption((option) => option.setName('reason').setDescription('The reason to log'))
    .setFlags(InteractionFlag.RequiresGuild)
    .setPermission(InteractionPermission.Moderator);

  override async execute(interaction: InteractionWithGuild<ChatInputCommandInteraction>) {
    const member = interaction.options.getMember('user');
    if (!isGuildMember(member)) throw new PolyHelperError('Could not find that user');
    if (await hasRole(member, this.discord.application.config.discord.roles.noGiveaway)) {
      throw new PolyHelperError('User already has giveaway blacklist');
    }

    const embed = new EmbedHelper()
      .setColor('Red')
      .setTitle('Blocked from Giveaways')
      .addFields({ name: 'Reason', value: this.getReason(interaction), format: 'Block' })
      .setFooter({ text: `${member.displayName} (${member.id})`, iconURL: member.displayAvatarURL() });

    try {
      await member.roles.add(
        this.discord.application.config.discord.roles.noGiveaway,
        `User blocked from giveaways by @${interaction.user.username} (${interaction.user.id})`
      );
    } catch (error) {
      await this.discord.handleError(toError(error), interaction);
      return await interaction.followUp({ content: 'Failed to block user from giveaways' });
    }

    await interaction.followUp({ content: `${member.toString()} has been blocked from giveawys`, embeds: [embed] });

    const botLogs = await this.discord.getChannel('botLogs');
    if (!botLogs) return;
    await botLogs.send({
      content: `${member.toString()} has been blocked from giveawawys`,
      embeds: [
        embed.setAuthor({
          name: `${interaction.user.displayName} (${interaction.user.id})`,
          iconURL: interaction.user.displayAvatarURL()
        })
      ]
    });
  }
}

export default GiveawayBlockCommand;
