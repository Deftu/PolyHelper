import DiscordCommand from '../../private/commands/DiscordCommand.ts';
import DiscordCommandDataBuilder from '../../private/commands/DiscordCommandDataBuilder.ts';
import EmbedHelper from '../../private/EmbedHelper.ts';
import PolyHelperError from '../../../private/error.ts';
import {
  type ChatInputCommandInteractionWithGuild,
  CommandPermission,
  InteractionFlags
} from '../../../types/discord.ts';
import { hasRole } from '../../../utils/discordUtils.ts';
import { isGuildMember } from '@sapphire/discord.js-utilities';
import { toError } from '../../../utils/miscUtils.ts';

class CountingBlockCommand extends DiscordCommand {
  override readonly data = new DiscordCommandDataBuilder()
    .setName('counting-unblock')
    .setDescription('Unblock a user from counting')
    .addUserOption((option) => option.setName('user').setDescription('The user to unblock').setRequired(true))
    .addStringOption((option) => option.setName('reason').setDescription('The reason to log'));
  override flags: readonly InteractionFlags[] = [InteractionFlags.GuildCommand];
  override permission: CommandPermission = CommandPermission.Moderator;

  override async execute(interaction: ChatInputCommandInteractionWithGuild) {
    const member = interaction.options.getMember('user');
    if (!isGuildMember(member)) throw new PolyHelperError('Could not find that user');
    if (!(await hasRole(member, this.discord.application.config.discord.roles.noCounting))) {
      throw new PolyHelperError("User isn't counting blacklisted");
    }

    const reason = interaction.options.getString('reason') || 'No reason provided';
    const embed = new EmbedHelper()
      .setColor('Green')
      .setTitle('Unblocked from Counting')
      .addFields({ name: 'Reason', value: reason })
      .setFooter({ text: `${member.displayName} (${member.id})`, iconURL: member.displayAvatarURL() });

    try {
      await member.roles.remove(
        this.discord.application.config.discord.roles.noCounting,
        `User unblocked from counting by @${interaction.user.username} (${interaction.user.id})`
      );
    } catch (error) {
      await this.discord.handleError(toError(error), interaction);
      await interaction.followUp({ content: 'Failed to unblock user from counting' });
      return;
    }

    await interaction.followUp({ content: `${member.toString()} has been unblocked from counting`, embeds: [embed] });

    const botLogs = await this.discord.getChannel('botLogs');
    if (!botLogs) return;
    await botLogs.send({
      content: `${member.toString()} has been unblocked from counting`,
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
