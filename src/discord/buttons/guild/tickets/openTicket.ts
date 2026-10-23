import BasicInteractionMetadata from '../../../private/interactions/basic/BasicInteractionMetadata.ts';
import DiscordButton from '../../../private/interactions/DiscordButton.ts';
import EmbedHelper from '../../../private/EmbedHelper.ts';
import PolyHelperError from '../../../../private/error.ts';
import { type ButtonInteraction, ChannelType, ThreadAutoArchiveDuration } from 'discord.js';
import { InteractionFlag, InteractionResponse, type InteractionWithGuild } from '../../../../types/discord.ts';

class OpenTicketButton extends DiscordButton {
  override readonly metadata: BasicInteractionMetadata = new BasicInteractionMetadata('openTicket')
    .setFlags(InteractionFlag.GuildButton)
    .setResponse(InteractionResponse.Ephemeral)
    .setFetchGuildMember(false);

  override async execute(interaction: InteractionWithGuild<ButtonInteraction>) {
    const [id] = this.getArgs(interaction);
    if (id === undefined) throw new PolyHelperError('Could not find this panel?');
    const panel = this.discord.application.database.getPanel(id);
    if (!panel) throw new PolyHelperError('Could not find this panel?');
    if (!panel.enabled) throw new PolyHelperError('This ticket panel is currently disabled.');

    const tickets = this.discord.application.database.getTickets({
      panelId: panel.id,
      owner: interaction.user.id,
      closed: 0
    });
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
    const thread = await channel.threads.create({
      name: `[${panel.cleanName}] ticket-${interaction.user.username}`,
      autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
      type: ChannelType.PrivateThread,
      invitable: true
    });
    await thread.members.add(interaction.user);
    const startingMessage = await thread.send(panel.getStartingMessageData(interaction.user));
    await startingMessage.pin();

    if (panel.supportRole) {
      const pingMessage = await thread.send({ content: `<@&${panel.supportRole}>` });
      await pingMessage.delete();
    }

    const ticket = this.discord.application.database.insertTicket({
      panelId: panel.id,
      threadId: thread.id,
      owner: interaction.user.id,
      pinMessageId: null,
      startingMessageId: startingMessage.id,
      openingTimestamp: Date.now(),
      name: thread.name,
      closed: 0
    });
    await ticket.rename();
    await interaction.followUp({
      embeds: [new EmbedHelper().setTitle('Ticket').setDescription(`Opened a ticket: <#${thread.id}>`)]
    });
  }
}

export default OpenTicketButton;
