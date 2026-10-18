import DiscordButton from '../../../private/buttons/DiscordButton.ts';
import DiscordButtonData from '../../../private/buttons/DiscordButtonData.ts';
import EmbedHelper from '../../../private/EmbedHelper.ts';
import PolyHelperError from '../../../../private/error.ts';
import { type ButtonInteractionWithGuild, ButtonResponse, InteractionFlags } from '../../../../types/discord.ts';

class CloseRequestDenyButton extends DiscordButton {
  override readonly data = new DiscordButtonData('closeRequestDeny');
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
          .setColor('Red')
          .setTitle('Close Request')
          .setDescription(`Close request has been denied by <@${interaction.user.id}>`)
      ]
    });
    await this.discord.application.database.deleteCloseRequest(closeRequest.id);
  }
}

export default CloseRequestDenyButton;
