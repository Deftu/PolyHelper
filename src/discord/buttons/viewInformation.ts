import DiscordButton from '../private/buttons/DiscordButton.ts';
import DiscordButtonData from '../private/buttons/DiscordButtonData.ts';
import InformationCommand from '../commands/information.ts';
import { type ButtonInteraction, MessageFlags } from 'discord.js';
import { ButtonResponse } from '../../types/discord.ts';

class ViewInformationButton extends DiscordButton {
  override readonly data = new DiscordButtonData('viewInformation');
  override response: ButtonResponse = ButtonResponse.None;

  override async execute(interaction: ButtonInteraction) {
    const ownerId = this.getOwnerId(interaction);
    if (ownerId === interaction.user.id) {
      await interaction.update({
        components: InformationCommand.InformationComponent(ownerId),
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [] }
      });
    } else {
      await interaction.reply({
        components: InformationCommand.InformationComponent(interaction.user.id),
        flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [] }
      });
    }
  }
}

export default ViewInformationButton;
