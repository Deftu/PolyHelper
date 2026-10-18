import DiscordButton from '../../../private/buttons/DiscordButton.ts';
import DiscordButtonData from '../../../private/buttons/DiscordButtonData.ts';
import EmbedHelper from '../../../private/EmbedHelper.ts';
import PolyHelperError from '../../../../private/error.ts';
import { type ButtonInteractionWithGuild, ButtonResponse, InteractionFlags } from '../../../../types/discord.ts';

class CloseRequestAcceptButton extends DiscordButton {
  override readonly data = new DiscordButtonData('closeRequestAccept');
  override flags: readonly InteractionFlags[] = [InteractionFlags.GuildButton];
  override response: ButtonResponse = ButtonResponse.Public;

  override async execute(interaction: ButtonInteractionWithGuild) {
    const [id] = this.getArgs(interaction);
    if (id === undefined) throw new PolyHelperError('Could not find this close request?');
    const closeRequest = this.discord.application.database.getCloseRequest(id);
    if (!closeRequest) throw new PolyHelperError('Could not find this close request?');
    await interaction.followUp({
      embeds: [
        new EmbedHelper()
          .setTitle('Closeing...')
          .setDescription(`Close request has been accepted by <@${interaction.user.id}>`)
      ]
    });
    await closeRequest.ticket.close({ reason: closeRequest.reason, runner: interaction.user.id });
  }
}

export default CloseRequestAcceptButton;
