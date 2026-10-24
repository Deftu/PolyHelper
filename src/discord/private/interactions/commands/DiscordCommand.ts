import BasicInteractionData from '../basic/BasicInteractionData.ts';
import {
  type AutocompleteOption,
  type DiscordManagerWithClient,
  InteractionResponse
} from '../../../../types/discord.ts';
import type DiscordCommandMetadata from './DiscordCommandMetadata.ts';
import type DiscordManager from '../../../DiscordManager.ts';
import type { AutocompleteInteraction, ChatInputCommandInteraction } from 'discord.js';

abstract class DiscordCommand<Manager extends DiscordManager = DiscordManagerWithClient> extends BasicInteractionData<
  ChatInputCommandInteraction,
  Manager,
  DiscordCommandMetadata
> {
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
