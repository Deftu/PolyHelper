import BasicInteractionData from '../basic/BasicInteractionData.ts';
import type DiscordContextMenuMetadata from './DiscordContextMenuMetadata.ts';
import type DiscordManager from '../../../DiscordManager.ts';
import type { ContextMenuCommandInteraction } from 'discord.js';
import type { DiscordManagerWithClient } from '../../../../types/discord.ts';

abstract class DiscordContextMenu<
  InteractionType extends ContextMenuCommandInteraction,
  Manager extends DiscordManager = DiscordManagerWithClient
> extends BasicInteractionData<InteractionType, Manager, DiscordContextMenuMetadata> {
  readonly variations: DiscordContextMenuMetadata[] = [];
}

export default DiscordContextMenu;
