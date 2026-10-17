import DiscordModal from '../../private/modals/DiscordModal.ts';
import DiscordModalData from '../../private/modals/DiscordModalData.ts';
import PolyHelperError from '../../../private/error.ts';
import { InteractionFlags, type ModalSubmitInteractionWithGuild } from '../../../types/discord.ts';
import type { DatabasePanel } from '../../../types/database.ts';

class PanelAddModal extends DiscordModal {
  override readonly data = new DiscordModalData('panelAdd');
  override flags: readonly InteractionFlags[] = [InteractionFlags.GuildModal];

  override async execute(interaction: ModalSubmitInteractionWithGuild) {
    const channel = this.getSelectedChannels(interaction, 'channel')[0];
    if (!channel) throw new PolyHelperError('Please select a channel for this panel.');

    const panelData: Omit<DatabasePanel, 'id'> = {
      name: interaction.fields.getTextInputValue('name'),
      title: interaction.fields.getTextInputValue('title'),
      description: interaction.fields.getTextInputValue('description'),
      channel,
      buttonLabel: interaction.fields.getTextInputValue('title'),
      buttonEmoji: null,
      openingMessage: interaction.fields.getTextInputValue('title'),
      pingSupportRoleOnOpen: 1,
      enabled: this.getCheckbox(interaction, 'enabled') ? 1 : 0
    };

    const panel = await this.discord.application.database.insertPanel(panelData);
    await interaction.followUp({ content: `Panel "${panel.name}" created.` });
  }
}

export default PanelAddModal;
