import DiscordCommand from '../../../private/commands/DiscordCommand.ts';
import DiscordCommandDataBuilder from '../../../private/commands/DiscordCommandDataBuilder.ts';
import PolyHelperError from '../../../../private/error.ts';
import {
  BasicInteractionResponse,
  type ChatInputCommandInteractionWithGuild,
  CommandPermission,
  InteractionFlags
} from '../../../../types/discord.ts';

class CloseCommand extends DiscordCommand {
  override readonly data = new DiscordCommandDataBuilder()
    .setName('close')
    .setDescription('Close a ticket')
    .addStringOption((option) => option.setName('reason').setDescription('The reason for closing the ticket'))
    .removeHidddenOption();
  override flags: readonly InteractionFlags[] = [InteractionFlags.GuildCommand];
  override response: BasicInteractionResponse = BasicInteractionResponse.Ephemeral;
  override permission: CommandPermission = CommandPermission.Support;

  override async execute(interaction: ChatInputCommandInteractionWithGuild) {
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const ticket = this.discord.application.database.getTicketByThreadId(interaction.channel.id);
    if (!ticket) throw new PolyHelperError('This is not a ticket. Please run this command inside of a ticket');
    await interaction.followUp({ content: 'Attempting to close this ticket...' });
    await this.discord.application.tickets.closeTicket({ id: ticket.id, reason, closer: interaction.user.id });
  }
}

export default CloseCommand;
