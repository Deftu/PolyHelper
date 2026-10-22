import BasicInteractionMetadata from '../../../private/interactions/basic/BasicInteractionMetadata.ts';
import DiscordButton from '../../../private/interactions/DiscordButton.ts';
import PolyHelperError from '../../../../private/error.ts';
import { BasicPanelModal, MiscPanelModal } from '../../../private/ComponentHelper.ts';
import { ButtonResponse, InteractionFlags, type InteractionWithGuild } from '../../../../types/discord.ts';
import type { ButtonInteraction } from 'discord.js';

class PanelEditButton extends DiscordButton {
  override readonly metadata: BasicInteractionMetadata = new BasicInteractionMetadata('panelEdit');
  override flags: readonly InteractionFlags[] = [InteractionFlags.GuildButton];
  override response: ButtonResponse = ButtonResponse.None;
  override fetchGuildMember: boolean = false;

  override async execute(interaction: InteractionWithGuild<ButtonInteraction>) {
    const [id, type] = this.getArgs(interaction);
    if (id === undefined) throw new PolyHelperError('Could not find this panel?');
    const panel = this.discord.application.database.getPanel(id);
    if (!panel) throw new PolyHelperError('Could not find this panel?');
    if (type === undefined || !['basic', 'misc'].includes(type)) throw new PolyHelperError('Invalid panel edit type');

    const modal = type === 'basic' ? BasicPanelModal(panel) : MiscPanelModal(panel);
    await interaction.showModal(modal.setCustomId(interaction.customId).setTitle('Editing a panel'));
  }
}

export default PanelEditButton;
