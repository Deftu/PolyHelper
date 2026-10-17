import DiscordButton from '../../private/buttons/DiscordButton.ts';
import DiscordButtonData from '../../private/buttons/DiscordButtonData.ts';
import EmbedHelper from '../../private/EmbedHelper.ts';
import PolyHelperError from '../../../private/error.ts';
import { type ButtonInteractionWithGuild, InteractionFlags } from '../../../types/discord.ts';

class PanelButton extends DiscordButton {
  override readonly data = new DiscordButtonData('panel');
  override flags: readonly InteractionFlags[] = [InteractionFlags.GuildButton];
  override fetchGuildMember: boolean = false;

  override async execute(interaction: ButtonInteractionWithGuild) {
    const [id] = this.getArgs(interaction);
    if (id === undefined) throw new PolyHelperError('Could not find this panel?');
    const panel = this.discord.application.database.getPanel(id);
    if (!panel) throw new PolyHelperError('Could not find this panel?');

    const tickets = this.discord.application.database.getTicketsByPanelUser(panel.id, interaction.user.id);
    if (tickets.length >= panel.maxOpenTickets) {
      for (const ticket of tickets) {
        const thread = await ticket.getThread();
        thread.members.add(interaction.user.id);
        await ticket.mentionOwnerInThread('Hey! This is your open ticket');
      }

      return await interaction.followUp({
        embeds: [
          new EmbedHelper()
            .setColor('Red')
            .setTitle('Maximum Tickets Reached')
            .setDescription(
              `You already have the maximum tickets allowed to be opened. I have helpfully pinged you in them\n${tickets
                .map((ticket) => `- <#${ticket.threadId}>`)
                .join('\n')}`
            )
        ]
      });
    }

    const channel = await this.discord.application.discord.getSupportChannel();
    const thread = await channel.threads.create({ name: `[${panel.name}] ticket-${interaction.user.username}` });
    await thread.members.add(interaction.user);
    await thread.send(panel.getOpeningMessage(interaction.user));
    this.discord.application.database.insertTicket({
      panelId: panel.id,
      threadId: thread.id,
      owner: interaction.user.id,
      pinned: 0,
      closed: 0
    });
    await interaction.followUp({
      embeds: [new EmbedHelper().setTitle('Ticket').setDescription(`Opened a ticket: <#${thread.id}>`)]
    });
  }
}

export default PanelButton;
