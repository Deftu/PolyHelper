import BasicInteractionData from './basic/BasicInteractionData.ts';
import { ButtonResponse, type DiscordManagerWithClient } from '../../../types/discord.ts';
import type DiscordManager from '../../DiscordManager.ts';
import type { ButtonInteraction } from 'discord.js';

abstract class DiscordButton<
  Manager extends DiscordManager = DiscordManagerWithClient
> extends BasicInteractionData<Manager> {
  readonly response: ButtonResponse = ButtonResponse.Ephemeral;
  abstract execute(interaction: ButtonInteraction): Promise<any>;
}

export default DiscordButton;
