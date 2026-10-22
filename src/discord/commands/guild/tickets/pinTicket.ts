import DiscordCommand from '../../../private/interactions/commands/DiscordCommand.ts';
import DiscordCommandMetadata from '../../../private/interactions/commands/DiscordCommandMetadata.ts';
import PolyHelperError from '../../../../private/error.ts';
import {
  BasicInteractionResponse,
  InteractionFlags,
  InteractionPermission,
  type InteractionWithGuild
} from '../../../../types/discord.ts';
import type { ChatInputCommandInteraction } from 'discord.js';

class PinTicketCommand extends DiscordCommand {
  override readonly metadata: DiscordCommandMetadata = new DiscordCommandMetadata()
    .setName('pinticket')
    .setDescription('Pin a ticket')
    .addStringOption((option) => option.setName('reason').setDescription('The reason for pinning the ticket'))
    .removeHidddenOption()
    .setCleanErrorName('pin this ticket');
  override flags: readonly InteractionFlags[] = [InteractionFlags.GuildCommand];
  override response: BasicInteractionResponse = BasicInteractionResponse.Ephemeral;
  override permission: InteractionPermission = InteractionPermission.Support;

  override async execute(interaction: InteractionWithGuild<ChatInputCommandInteraction>) {
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const ticket = this.discord.application.database.getTicketByThreadId(interaction.channel.id);
    if (!ticket) throw new PolyHelperError('This is not a ticket. Please run this command inside of a ticket');
    await interaction.followUp({ content: 'Attempting to pin this ticket...' });
    await ticket.pin({ reason, runner: interaction.user.id });
  }
}

export default PinTicketCommand;
