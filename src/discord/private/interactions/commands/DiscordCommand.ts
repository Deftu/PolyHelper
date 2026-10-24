import BasicInteractionData from '../basic/BasicInteractionData.ts';
import PolyHelperError from '../../../../private/error.ts';
import {
  type AutocompleteOption,
  type DiscordManagerWithClient,
  InteractionResponse,
  type InteractionWithGuild
} from '../../../../types/discord.ts';
import type DiscordCommandMetadata from './DiscordCommandMetadata.ts';
import type DiscordManager from '../../../DiscordManager.ts';
import type Ticket from '../../../../database/private/Ticket.ts';
import type { AutocompleteInteraction, ChatInputCommandInteraction } from 'discord.js';

abstract class DiscordCommand<Manager extends DiscordManager = DiscordManagerWithClient> extends BasicInteractionData<
  ChatInputCommandInteraction,
  Manager,
  DiscordCommandMetadata
> {
  getTicket(interaction: InteractionWithGuild<ChatInputCommandInteraction>): Ticket {
    const ticket = this.discord.application.database.getTicketByThreadId(interaction.channel.id);
    if (!ticket) throw new PolyHelperError('This is not a ticket. Please run this command inside of a ticket');
    return ticket;
  }

  shouldEphemeral(interaction: ChatInputCommandInteraction): boolean {
    return (
      interaction.options.getBoolean('hidden-response') ?? this.metadata.response === InteractionResponse.Ephemeral
    );
  }

  // eslint-disable-next-line require-await
  async autocomplete(interaction: AutocompleteInteraction): Promise<AutocompleteOption[]> {
    return [];
  }
}

export default DiscordCommand;
