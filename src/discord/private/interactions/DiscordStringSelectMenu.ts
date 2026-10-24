import BasicInteractionData from './basic/BasicInteractionData.ts';
import type { StringSelectMenuInteraction } from 'discord.js';

abstract class DiscordStringSelectMenu extends BasicInteractionData<StringSelectMenuInteraction> {}

export default DiscordStringSelectMenu;
