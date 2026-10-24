import BasicInteractionMetadata from '../../private/interactions/basic/BasicInteractionMetadata.ts';
import DiscordButton from '../../private/interactions/DiscordButton.ts';
import PolyHelperError from '../../../private/error.ts';
import { ButtonInteraction, LabelBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import { InteractionFlag, InteractionResponse, type InteractionWithGuild } from '../../../types/discord.ts';
import { hasRole } from '../../../utils/discordUtils.ts';

class ShowDevEntryButton extends DiscordButton {
  override readonly metadata: BasicInteractionMetadata = new BasicInteractionMetadata('show-dev-entry')
    .setFlags(InteractionFlag.RequiresGuild)
    .setResponse(InteractionResponse.None);

  override async execute(interaction: InteractionWithGuild<ButtonInteraction>) {
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
