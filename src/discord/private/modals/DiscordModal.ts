import BasicInteractionData from '../BasicInteractionData.ts';
import PolyHelperError from '../../../private/error.ts';
import { BasicInteractionResponse, type DiscordManagerWithClient } from '../../../types/discord.ts';
import type DiscordManager from '../../DiscordManager.ts';
import type DiscordModalData from './DiscordModalData.ts';
import type { ModalSubmitInteraction } from 'discord.js';

abstract class DiscordModal<
  Manager extends DiscordManager = DiscordManagerWithClient
> extends BasicInteractionData<Manager> {
  abstract readonly data: DiscordModalData;
  response: BasicInteractionResponse = BasicInteractionResponse.Ephemeral;

  protected getArgs(interaction: ModalSubmitInteraction): string[] {
    const split = interaction.customId.split(':');
    const id = split[0];
    if (!id) throw new PolyHelperError('Could not get the args of this modal submit interaction');
    if (!this.data.ids.includes(id)) {
      throw new PolyHelperError('Could not get the args of this modal submit interaction');
    }
    return split.slice(1);
  }

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
