import DiscordCommand from '../../../private/interactions/commands/DiscordCommand.ts';
import DiscordCommandMetadata from '../../../private/interactions/commands/DiscordCommandMetadata.ts';
import PolyHelperError from '../../../../private/error.ts';
import {
  BasicInteractionResponse,
  CommandPermission,
  InteractionFlags,
  type InteractionWithGuild
} from '../../../../types/discord.ts';
import { ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';

class DebugTickets extends DiscordCommand {
  override readonly metadata: DiscordCommandMetadata = new DiscordCommandMetadata()
    .setName('debug-tickets')
    .addSubcommand((option) =>
      option.setName('refresh-names').setDescription('refresh the thread name of every open ticket')
    )
    .addSubcommand((option) =>
      option.setName('refresh-name').setDescription('refresh the thread name of the current ticket')
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .removeHidddenOption();
  override flags: readonly InteractionFlags[] = [InteractionFlags.GuildCommand];
  override response: BasicInteractionResponse = BasicInteractionResponse.Ephemeral;
  override permission: CommandPermission = CommandPermission.Admin;

  async executeRefreshNames(interaction: InteractionWithGuild<ChatInputCommandInteraction>) {
    const tickets = this.discord.application.database.getTickets(1);
    await interaction.followUp({ content: `refreshing the thread name of ${tickets.length} ticket(s)` });
    for (const ticket of tickets) await ticket.updateThreadName();
  }

  async executeRefreshName(interaction: InteractionWithGuild<ChatInputCommandInteraction>) {
    const ticket = this.discord.application.database.getTicketByThreadId(interaction.channel.id);
    if (!ticket) throw new PolyHelperError('This is not a ticket. Please run this command inside of a ticket');
    await interaction.followUp({ content: 'refreshing the thread name of this ticket' });
    await ticket.updateThreadName();
  }

  override execute(interaction: InteractionWithGuild<ChatInputCommandInteraction>): Promise<any> {
    throw new PolyHelperError('Invalid subcommand found');
  }
}

export default DebugTickets;
