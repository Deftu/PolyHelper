import BasicInteractionMetadata from './BasicInteractionMetadata.ts';
import PolyHelperError from '../../../../private/error.ts';
import type DiscordManager from '../../../DiscordManager.ts';
import type { ButtonInteraction, ModalSubmitInteraction, StringSelectMenuInteraction } from 'discord.js';
import type { DiscordManagerWithClient } from '../../../../types/discord.ts';

abstract class BasicInteractionData<
  Manager extends DiscordManager = DiscordManagerWithClient,
  Metadata extends object = BasicInteractionMetadata
> {
  abstract readonly metadata: Metadata;
  constructor(protected readonly discord: Manager) {}

  protected getArgs(interaction: ButtonInteraction | ModalSubmitInteraction | StringSelectMenuInteraction): string[] {
    if (!(this.metadata instanceof BasicInteractionMetadata)) throw new PolyHelperError('Unsuported interaction data');
    const split = interaction.customId.split(':');
    const id = split[0];
    if (!id) throw new PolyHelperError('Could not get the args of this interaction');
    if (!this.metadata.ids.includes(id)) throw new PolyHelperError('Could not get the args of this interaction');
    return split.slice(1);
  }
}

export default BasicInteractionData;
