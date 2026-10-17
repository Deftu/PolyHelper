import assert from 'node:assert';
import { BasicInteractionResponse, InteractionFlags } from '../../types/discord.ts';
import { Collection, MessageFlags, type ModalSubmitInteraction } from 'discord.js';
import { readdir } from 'node:fs/promises';
import { toError } from '../../utils/miscUtils.ts';
import type DiscordManager from '../DiscordManager.ts';
import type DiscordModal from '../private/modals/DiscordModal.ts';

class ModalHandler {
  readonly modals: Collection<string, DiscordModal> = new Collection<string, DiscordModal>();
  constructor(private readonly discord: DiscordManager) {}

  async onSubmit(interaction: ModalSubmitInteraction) {
    const modalId = interaction.customId.split(':', 1)[0] ?? interaction.customId;
    const modal = this.modals.get(interaction.customId) ?? this.modals.get(modalId);
    if (!modal) return;

    try {
      if (modal.response !== BasicInteractionResponse.None) {
        await interaction.deferReply({
          flags: modal.response === BasicInteractionResponse.Ephemeral ? MessageFlags.Ephemeral : undefined
        });
      }
      console.discord(
        `Modal submitted ${interaction.user.username} (${interaction.user.id}) modal ${interaction.customId}`
      );

      await this.discord.interactionHandler.checkPerms(interaction, modal);

      if (modal.flags.includes(InteractionFlags.GuildButton)) {
        assert(interaction.guild);
        interaction.member = await interaction.guild.members.fetch(interaction.user.id);
      }

      await modal.execute(interaction);
    } catch (error) {
      await this.discord.handleError(toError(error), interaction);
    }
  }

  async loadModals() {
    this.modals.clear();
    const modalFiles = await readdir('./src/discord/modals/', { recursive: true, encoding: 'utf-8' }).then((files) =>
      files.filter((file) => file.endsWith('.ts'))
    );
    for (const file of modalFiles) {
      const modal: DiscordModal = new (await import(`../modals/${file}`)).default(this.discord);
      modal.data.ids.forEach((id) => this.modals.set(id, modal));
    }
    console.discord(`Successfully loaded ${this.modals.size} modal(s).`);
  }
}

export default ModalHandler;
