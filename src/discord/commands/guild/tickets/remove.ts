import DiscordCommand from '../../../private/commands/DiscordCommand.ts';
import DiscordCommandDataBuilder from '../../../private/commands/DiscordCommandDataBuilder.ts';
import PolyHelperError from '../../../../private/error.ts';
import {
  type ChatInputCommandInteractionWithGuild,
  CommandPermission,
  InteractionFlags
} from '../../../../types/discord.ts';
import { SuccessEmbed } from '../../../private/EmbedHelper.ts';
import { isGuildMember } from '@sapphire/discord.js-utilities';
import { isSupportMember } from '../../../../utils/discordUtils.ts';

class RemoveCommand extends DiscordCommand {
  override readonly data = new DiscordCommandDataBuilder()
    .setName('remove')
    .setDescription('Remove a user from a ticket')
    .addUserOption((option) =>
      option.setName('user').setDescription('The user you want to remove from the ticket').setRequired(true)
    )
    .setCleanErrorName('remove this user to the ticket');
  override flags: readonly InteractionFlags[] = [InteractionFlags.GuildCommand];
  override permission: CommandPermission = CommandPermission.Support;

  override async execute(interaction: ChatInputCommandInteractionWithGuild) {
    const member = interaction.options.getMember('user');
    if (!isGuildMember(member)) throw new PolyHelperError('Could not find that user');
    const ticket = this.discord.application.database.getTicketByThreadId(interaction.channel.id);
    if (!ticket) throw new PolyHelperError('This is not a ticket. Please run this command inside of a ticket');
    if (ticket.owner === member.user.id) {
      throw new PolyHelperError('You cannot remove the ticket owner from the ticket');
    }
    const isSupportTeam = await isSupportMember(member);
    if (isSupportTeam) throw new PolyHelperError('You cannot remove a support member from a ticket');
    const thread = await ticket.getThread();
    await thread.members.remove(member);
    await interaction.followUp({
      embeds: [new SuccessEmbed().setDescription(`Removed <@${member.user.id}> from the ticket`)]
    });
  }
}

export default RemoveCommand;
