import BasicInteractionData from '../basic/BasicInteractionData.ts';
import type DiscordContextMenuMetadata from './DiscordContextMenuMetadata.ts';
import type { ContextMenuCommandInteraction } from 'discord.js';

abstract class DiscordContextMenu<InteractionType extends ContextMenuCommandInteraction> extends BasicInteractionData<
  InteractionType,
  DiscordContextMenuMetadata
> {
  readonly variations: DiscordContextMenuMetadata[] = [];
}

export default DiscordContextMenu;
