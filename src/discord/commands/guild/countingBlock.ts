import DiscordCommand from '../../private/interactions/commands/DiscordCommand.ts';
import DiscordCommandMetadata from '../../private/interactions/commands/DiscordCommandMetadata.ts';
import EmbedHelper from '../../private/EmbedHelper.ts';
import PolyHelperError from '../../../private/error.ts';
import { CommandPermission, InteractionFlags, type InteractionWithGuild } from '../../../types/discord.ts';
import { hasRole } from '../../../utils/discordUtils.ts';
import { isGuildMember } from '@sapphire/discord.js-utilities';
import { toError } from '../../../utils/miscUtils.ts';
import type { ChatInputCommandInteraction } from 'discord.js';

class CountingBlockCommand extends DiscordCommand {
  override readonly metadata: DiscordCommandMetadata = new DiscordCommandMetadata()
    .setName('counting-block')
    .setDescription('Block a user from counting')
    .addUserOption((option) => option.setName('user').setDescription('The user to block').setRequired(true))
    .addStringOption((option) => option.setName('reason').setDescription('The reason to log'));
  override flags: readonly InteractionFlags[] = [InteractionFlags.GuildCommand];
  override permission: CommandPermission = CommandPermission.Moderator;

  override async execute(interaction: InteractionWithGuild<ChatInputCommandInteraction>) {
    const member = interaction.options.getMember('user');
    if (!isGuildMember(member)) throw new PolyHelperError('Could not find that user');
    if (await hasRole(member, this.discord.application.config.discord.roles.noCounting)) {
      throw new PolyHelperError('User already has counting blacklist');
    }

    const reason = interaction.options.getString('reason') || 'No reason provided';
    const embed = new EmbedHelper()
      .setColor('Red')
      .setTitle('Blocked from Counting')
      .addFields({ name: 'Reason', value: reason })
      .setFooter({ text: `${member.displayName} (${member.id})`, iconURL: member.displayAvatarURL() });

    try {
      await member.roles.add(
        this.discord.application.config.discord.roles.noCounting,
        `User blocked from counting by @${interaction.user.username} (${interaction.user.id})`
      );
    } catch (error) {
      await this.discord.handleError(toError(error), interaction);
      return await interaction.followUp({ content: 'Failed to block user from counting' });
    }

    await interaction.followUp({ content: `${member.toString()} has been blocked from counting`, embeds: [embed] });

    const botLogs = await this.discord.getChannel('botLogs');
    if (!botLogs) return;
    await botLogs.send({
      content: `${member.toString()} has been blocked from counting`,
      embeds: [
        embed.setAuthor({
          name: `${interaction.user.displayName} (${interaction.user.id})`,
          iconURL: interaction.user.displayAvatarURL()
        })
      ]
    });
  }
}

export default CountingBlockCommand;
