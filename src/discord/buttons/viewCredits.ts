import CreditsCommand from '../commands/credits.ts';
import DiscordButton from '../private/buttons/DiscordButton.ts';
import DiscordButtonData from '../private/buttons/DiscordButtonData.ts';
import { type ButtonInteraction, MessageFlags } from 'discord.js';
import { ButtonResponse } from '../../types/discord.ts';

class ViewCreditsButton extends DiscordButton {
  override readonly data = new DiscordButtonData('viewCredits');
  override response: ButtonResponse = ButtonResponse.None;

  override async execute(interaction: ButtonInteraction) {
    const ownerId = this.getOwnerId(interaction);
    if (ownerId === interaction.user.id) {
      await interaction.update({
        components: CreditsCommand.CreditsComponent(ownerId),
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [] }
      });
    } else {
      await interaction.followUp({
        components: CreditsCommand.CreditsComponent(interaction.user.id),
        flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
        allowedMentions: { parse: [] }
      });
    }
  }
}

export default ViewCreditsButton;
