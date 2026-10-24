import BasicInteractionData from './basic/BasicInteractionData.ts';
import type { ButtonInteraction } from 'discord.js';

abstract class DiscordButton extends BasicInteractionData<ButtonInteraction> {}

export default DiscordButton;
