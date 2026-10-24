import BasicInteractionData from './basic/BasicInteractionData.ts';
import type DiscordManager from '../../DiscordManager.ts';
import type { ButtonInteraction } from 'discord.js';
import type { DiscordManagerWithClient } from '../../../types/discord.ts';

abstract class DiscordButton<Manager extends DiscordManager = DiscordManagerWithClient> extends BasicInteractionData<
  ButtonInteraction,
  Manager
> {}

export default DiscordButton;
