import DiscordButton from '../../private/buttons/DiscordButton.ts';
import DiscordButtonData from '../../private/buttons/DiscordButtonData.ts';
import PolyHelperError from '../../../private/error.ts';
import { BasicPanelModal, MiscPanelModal } from '../../private/ComponentHelper.ts';
import { type ButtonInteractionWithGuild, ButtonResponse, InteractionFlags } from '../../../types/discord.ts';

class PanelEditButton extends DiscordButton {
  override readonly data = new DiscordButtonData('panelEdit');
  override flags: readonly InteractionFlags[] = [InteractionFlags.GuildButton];
  override response: ButtonResponse = ButtonResponse.None;
  override fetchGuildMember: boolean = false;

  override async execute(interaction: ButtonInteractionWithGuild) {
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
