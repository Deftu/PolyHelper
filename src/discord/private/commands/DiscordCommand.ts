import BasicInteractionData from '../BasicInteractionData.ts';
import {
  type AutocompleteOption,
  BasicInteractionResponse,
  type DiscordManagerWithClient
} from '../../../types/discord.ts';
import type DiscordCommandDataBuilder from './DiscordCommandDataBuilder.ts';
import type DiscordManager from '../../DiscordManager.ts';
import type { AutocompleteInteraction, ChatInputCommandInteraction } from 'discord.js';

abstract class DiscordCommand<
  Manager extends DiscordManager = DiscordManagerWithClient
> extends BasicInteractionData<Manager> {
  abstract readonly data: DiscordCommandDataBuilder;
  readonly response: BasicInteractionResponse = BasicInteractionResponse.Public;

  shouldEphemeral(interaction: ChatInputCommandInteraction): boolean {
    return interaction.options.getBoolean('hidden-response') ?? this.response === BasicInteractionResponse.Ephemeral;
  }

  // eslint-disable-next-line require-await
  async autocomplete(interaction: AutocompleteInteraction): Promise<AutocompleteOption[]> {
    return [];
  }

  abstract execute(interaction: ChatInputCommandInteraction): Promise<any>;
}

export default DiscordCommand;
