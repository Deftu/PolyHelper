import DiscordModal from '../private/modals/DiscordModal.ts';
import DiscordModalData from '../private/modals/DiscordModalData.ts';
import type { ModalMessageModalSubmitInteraction } from 'discord.js';

class ManageAlertTypeModals extends DiscordModal {
  override readonly data = new DiscordModalData('example');

  override async execute(interaction: ModalMessageModalSubmitInteraction) {
    await interaction.followUp({ content: 'Hey!! This is an example modal!' });
  }
}

export default ManageAlertTypeModals;
