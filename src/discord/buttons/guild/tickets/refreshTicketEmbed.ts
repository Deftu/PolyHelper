import BasicInteractionMetadata from '../../../private/interactions/basic/BasicInteractionMetadata.ts';
import DiscordButton from '../../../private/interactions/DiscordButton.ts';
import PolyHelperError from '../../../../private/error.ts';
import { ButtonResponse, InteractionFlags, type InteractionWithGuild } from '../../../../types/discord.ts';
import type { ButtonInteraction } from 'discord.js';

class RefreshTicketEmbedButton extends DiscordButton {
  override readonly metadata: BasicInteractionMetadata = new BasicInteractionMetadata('refreshTicketEmbed');
  override flags: readonly InteractionFlags[] = [InteractionFlags.GuildButton];
  override response: ButtonResponse = ButtonResponse.Update;
  override fetchGuildMember: boolean = false;

  override async execute(interaction: InteractionWithGuild<ButtonInteraction>) {
    const [id] = this.getArgs(interaction);
    if (id === undefined) throw new PolyHelperError('Could not find this ticket?');
    const ticket = this.discord.application.database.getTicket(id);
    if (!ticket) throw new PolyHelperError('Could not find the matching ticket?');
    await interaction.editReply(await ticket.getMessageData());
  }
}

export default RefreshTicketEmbedButton;
