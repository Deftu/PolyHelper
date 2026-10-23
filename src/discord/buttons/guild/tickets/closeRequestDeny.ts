import BasicInteractionMetadata from '../../../private/interactions/basic/BasicInteractionMetadata.ts';
import DiscordButton from '../../../private/interactions/DiscordButton.ts';
import EmbedHelper from '../../../private/EmbedHelper.ts';
import PolyHelperError from '../../../../private/error.ts';
import { InteractionFlag, type InteractionWithGuild } from '../../../../types/discord.ts';
import type { ButtonInteraction } from 'discord.js';

class CloseRequestDenyButton extends DiscordButton {
  override readonly metadata: BasicInteractionMetadata = new BasicInteractionMetadata('closeRequestDeny').setFlags(
    InteractionFlag.GuildButton
  );

  override async execute(interaction: InteractionWithGuild<ButtonInteraction>) {
    const [id] = this.getArgs(interaction);
    if (id === undefined) throw new PolyHelperError('Could not find this close request?');
    const closeRequest = this.discord.application.database.getCloseRequest(id);
    if (!closeRequest) throw new PolyHelperError('Could not find this close request?');
    await interaction.followUp({
      embeds: [
        new EmbedHelper()
          .setColor('Red')
          .setTitle('Close Request')
          .setDescription(`Close request has been denied by <@${interaction.user.id}>`)
      ]
    });
    await this.discord.application.database.deleteCloseRequest(closeRequest.id);
  }
}

export default CloseRequestDenyButton;
