import DiscordCommand from '../../../private/interactions/commands/DiscordCommand.ts';
import DiscordCommandMetadata from '../../../private/interactions/commands/DiscordCommandMetadata.ts';
import {
  BasicInteractionResponse,
  InteractionFlags,
  InteractionPermission,
  type InteractionWithGuild
} from '../../../../types/discord.ts';
import type { ChatInputCommandInteraction } from 'discord.js';

class UnpinTicketCommand extends DiscordCommand {
  override readonly metadata: DiscordCommandMetadata = new DiscordCommandMetadata()
    .setName('unpinticket')
    .setDescription('Unpin a ticket')
    .addStringOption((option) => option.setName('reason').setDescription('The reason for pinning the ticket'))
    .removeHidddenOption()
    .setCleanErrorName('unpin this ticket');
  override flags: readonly InteractionFlags[] = [InteractionFlags.GuildCommand];
  override response: BasicInteractionResponse = BasicInteractionResponse.Ephemeral;
  override permission: InteractionPermission = InteractionPermission.Support;

  override async execute(interaction: InteractionWithGuild<ChatInputCommandInteraction>) {
    const reason = interaction.options.getString('reason') || 'No reason provided';
    await interaction.followUp({ content: 'Attempting to unpin this ticket...' });
    await this.getTicket(interaction).unpin({ reason, runner: interaction.user.id });
  }
}

export default UnpinTicketCommand;
