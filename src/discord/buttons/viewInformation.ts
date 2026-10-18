import DiscordButton from '../private/buttons/DiscordButton.ts';
import DiscordButtonData from '../private/buttons/DiscordButtonData.ts';
import InformationCommand from '../commands/information.ts';
import {
  type ButtonInteraction,
  MessageFlags,
  type MessageEditOptions,
  type InteractionReplyOptions
} from 'discord.js';
import { ButtonResponse } from '../../types/discord.ts';

class ViewInformationButton extends DiscordButton {
  override readonly data = new DiscordButtonData('viewInformation');
  override response: ButtonResponse = ButtonResponse.None;

  override async execute(interaction: ButtonInteraction) {
    const [ownerId] = this.getArgs(interaction);
    const message: MessageEditOptions & InteractionReplyOptions = {
      components: InformationCommand.InformationComponent(interaction.user.id),
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { parse: [] }
    };
    if (ownerId === interaction.user.id) await interaction.update(message);
    else await interaction.reply(message);
  }
}

export default ViewInformationButton;
