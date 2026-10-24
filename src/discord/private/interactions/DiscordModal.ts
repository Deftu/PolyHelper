import BasicInteractionData from './basic/BasicInteractionData.ts';
import type { ModalSubmitInteraction } from 'discord.js';

abstract class DiscordModal extends BasicInteractionData<ModalSubmitInteraction> {
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
}

export default DiscordModal;
