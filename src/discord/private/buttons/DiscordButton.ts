import BasicInteractionData from '../BasicInteractionData.ts';
import PolyHelperError from '../../../private/error.ts';
import { ButtonResponse, type DiscordManagerWithClient } from '../../../types/discord.ts';
import type DiscordButtonData from './DiscordButtonData.ts';
import type DiscordManager from '../../DiscordManager.ts';
import type { ButtonInteraction } from 'discord.js';

abstract class DiscordButton<
  Manager extends DiscordManager = DiscordManagerWithClient
> extends BasicInteractionData<Manager> {
  abstract readonly data: DiscordButtonData;
  readonly response: ButtonResponse = ButtonResponse.Ephemeral;

  protected getArgs(interaction: ButtonInteraction): string[] {
    const split = interaction.customId.split(':');
    const id = split[0];
    if (!id) throw new PolyHelperError('Could not get the args of this button interaction');
    if (!this.data.ids.includes(id)) {
      throw new PolyHelperError('Could not get the args of this button interaction');
    }
    return split.slice(1);
  }

  protected getOwnerId(interaction: ButtonInteraction): string | undefined {
    const [id, userId] = interaction.customId.split(':');
    if (!id) return undefined;
    if (!this.data.ids.includes(id)) return undefined;
    return userId;
  }

  abstract execute(interaction: ButtonInteraction): Promise<void>;
}

export default DiscordButton;
