import CreditsCommand from '../commands/credits.ts';
import DiscordButton from '../private/buttons/DiscordButton.ts';
import DiscordButtonData from '../private/buttons/DiscordButtonData.ts';
import {
  type ButtonInteraction,
  MessageFlags,
  type MessageEditOptions,
  type InteractionReplyOptions
} from 'discord.js';
import { ButtonResponse } from '../../types/discord.ts';

class ViewCreditsButton extends DiscordButton {
  override readonly data = new DiscordButtonData('viewCredits');
  override response: ButtonResponse = ButtonResponse.None;

  override async execute(interaction: ButtonInteraction) {
    const [ownerId] = this.getArgs(interaction);
    const message: MessageEditOptions & InteractionReplyOptions = {
      components: CreditsCommand.CreditsComponent(interaction.user.id),
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { parse: [] }
    };
    if (ownerId === interaction.user.id) await interaction.update(message);
    else await interaction.reply(message);
  }
}

export default ViewCreditsButton;
