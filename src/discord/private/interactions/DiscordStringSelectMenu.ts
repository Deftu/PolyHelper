import BasicInteractionData from './basic/BasicInteractionData.ts';
import { ButtonResponse, type DiscordManagerWithClient } from '../../../types/discord.ts';
import type DiscordManager from '../../DiscordManager.ts';
import type { StringSelectMenuInteraction } from 'discord.js';

abstract class DiscordStringSelectMenu<
  Manager extends DiscordManager = DiscordManagerWithClient
> extends BasicInteractionData<Manager> {
  readonly response: ButtonResponse = ButtonResponse.Ephemeral;
  abstract execute(interaction: StringSelectMenuInteraction): Promise<any>;
}

export default DiscordStringSelectMenu;
