import BasicInteractionData from '../basic/BasicInteractionData.ts';
import { type AutocompleteOption, InteractionResponse } from '../../../../types/discord.ts';
import type DiscordCommandMetadata from './DiscordCommandMetadata.ts';
import type { AutocompleteInteraction, ChatInputCommandInteraction } from 'discord.js';

abstract class DiscordCommand extends BasicInteractionData<ChatInputCommandInteraction, DiscordCommandMetadata> {
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
