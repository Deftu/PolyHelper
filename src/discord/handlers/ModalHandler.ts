import assert from 'node:assert';
import { Collection, MessageFlags, type ModalSubmitInteraction } from 'discord.js';
import { InteractionFlag, InteractionResponse } from '../../types/discord.ts';
import { readdir } from 'node:fs/promises';
import { toError } from '../../utils/miscUtils.ts';
import type DiscordManager from '../DiscordManager.ts';
import type DiscordModal from '../private/interactions/DiscordModal.ts';

class ModalHandler {
  readonly modals: Collection<string, DiscordModal> = new Collection<string, DiscordModal>();
  constructor(private readonly discord: DiscordManager) {}

  async onSubmit(interaction: ModalSubmitInteraction) {
    const modal = this.modals.get(interaction.customId.split(':', 1)[0] ?? interaction.customId);
    if (!modal) return;

    try {
      if (modal.metadata.response !== InteractionResponse.None) {
        await interaction.deferReply({
          flags: modal.metadata.response === InteractionResponse.Ephemeral ? MessageFlags.Ephemeral : undefined
        });
      }
      console.discord(
        `Modal submitted ${interaction.user.username} (${interaction.user.id}) modal ${interaction.customId}`
      );

      this.discord.interactionHandler.checkInteractionFlags(interaction, modal.metadata.flags);
      await this.discord.interactionHandler.checkPermission(interaction, modal.metadata.permission);

      if (modal.metadata.flags.includes(InteractionFlag.GuildModal)) {
        assert(interaction.guild);
        if (modal.metadata.fetchGuildMember) {
          interaction.member = await interaction.guild.members.fetch(interaction.user.id);
        }
      }

      await modal.execute(interaction);
    } catch (error) {
      await this.discord.handleError(toError(error), interaction, [], modal.metadata);
    }
  }

  async loadModals() {
    this.modals.clear();
    const modalFiles = await readdir('./src/discord/modals/', { recursive: true, encoding: 'utf-8' }).then((files) =>
      files.filter((file) => file.endsWith('.ts'))
    );
    for (const file of modalFiles) {
      const modal: DiscordModal = new (await import(`../modals/${file}`)).default(this.discord);
      modal.metadata.ids.forEach((id) => this.modals.set(id, modal));
    }
    console.discord(`Successfully loaded ${this.modals.size} modal(s).`);
  }
}

export default ModalHandler;
