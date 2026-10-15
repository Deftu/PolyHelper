import DiscordButton from '../private/buttons/DiscordButton.ts';
import DiscordButtonData from '../private/buttons/DiscordButtonData.ts';
import PolyHelperError from '../../private/error.ts';
import { type ButtonInteractionWithGuild, ButtonResponse, InteractionFlags } from '../../types/discord.ts';
import { LabelBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import { hasRole } from '../../utils/discordUtils.ts';

class ShowDevEntryButton extends DiscordButton {
  override readonly data = new DiscordButtonData('show-dev-entry');
  override flags: readonly InteractionFlags[] = [InteractionFlags.GuildButton];
  override response: ButtonResponse = ButtonResponse.None;

  override async execute(interaction: ButtonInteractionWithGuild) {
    if (await hasRole(interaction.member, this.discord.application.config.discord.roles.devAccess)) {
      throw new PolyHelperError('You already have access to the Development channels');
    }

    await interaction.showModal(
      new ModalBuilder()
        .setCustomId('dev-entry')
        .setTitle('Dev Entry Form')
        .addLabelComponents(
          new LabelBuilder()
            .setLabel('How many repositories?')
            .setTextInputComponent(
              new TextInputBuilder().setCustomId('repo-count').setStyle(TextInputStyle.Short).setRequired(true)
            )
        )
    );
  }
}

export default ShowDevEntryButton;
