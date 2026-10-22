import BasicInteractionData from './basic/BasicInteractionData.ts';
import { BasicInteractionResponse, type DiscordManagerWithClient } from '../../../types/discord.ts';
import type DiscordManager from '../../DiscordManager.ts';
import type { ModalSubmitInteraction } from 'discord.js';

abstract class DiscordModal<
  Manager extends DiscordManager = DiscordManagerWithClient
> extends BasicInteractionData<Manager> {
  readonly response: BasicInteractionResponse = BasicInteractionResponse.Ephemeral;

  protected getTextInputValue(interaction: ModalSubmitInteraction, customId: string): string | undefined {
    try {
      return interaction.fields.getTextInputValue(customId).trim();
    } catch {
      return undefined;
    }
  }

  protected getSelectedChannels(interaction: ModalSubmitInteraction, customId: string): string[] {
    try {
      return interaction.fields.getSelectedChannels(customId, true).map((channel) => channel.id);
    } catch {
      return [];
    }
  }

  protected getCheckbox(interaction: ModalSubmitInteraction, customId: string, defaultValue: boolean = true): boolean {
    try {
      return interaction.fields.getCheckbox(customId);
    } catch {
      return defaultValue;
    }
  }

  abstract execute(interaction: ModalSubmitInteraction): Promise<any>;
}

export default DiscordModal;
