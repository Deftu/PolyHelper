import EmbedHelper from '../discord/private/EmbedHelper.ts';
import PolyHelperError from '../private/error.ts';
import { ActionRowBuilder, type BaseMessageOptions, ButtonBuilder, Message, User } from 'discord.js';
import { OpenTicketButton } from '../discord/private/ComponentHelper.ts';
import type Application from '../Application.ts';
import type { DatabaseTicket } from '../types/database.ts';

class TicketsManager {
  constructor(readonly application: Application) {}

  async updatePanelsMessage(): Promise<Message> {
    const panelsMessage = await this.application.database.getPanelsMessage();
    return await panelsMessage.edit(this.getPanelsMessageData());
  }

  getPanelsMessageData(): BaseMessageOptions {
    const panels = this.application.database.getPanels();
    return {
      content: '',
      embeds: [
        new EmbedHelper()
          .setTitle(`${this.application.discord.guild?.name ?? 'UNKNOWN'} support tickets`)
          .setColor('Blue')
          .setFields(...panels.map((panel) => ({ name: `**${panel.title}**`, value: panel.description })))
      ],
      components: [new ActionRowBuilder<ButtonBuilder>().addComponents(panels.map((panel) => OpenTicketButton(panel)))]
    };
  }

  async closeTicket({ id, reason, closer }: { id: DatabaseTicket['id']; reason: string; closer: User['id'] }) {
    const ticket = this.application.database.getTicket(id);
    if (!ticket) throw new PolyHelperError('This is not a ticket. Please run this command inside of a ticket');
    if (ticket.pinned) throw new PolyHelperError('This ticket is pinned. Please unpin it before closing');
    const thread = await ticket.getThread();
    await thread.send({
      embeds: [
        new EmbedHelper()
          .setTitle('Ticket Closed')
          .setDescription(`This ticket has been closeed by <@${closer}>`)
          .setFields({ name: 'Reason', value: reason, blockValue: true })
      ]
    });
    const closeRequest = this.application.database.getCloseRequestByTicketId(ticket.id);
    if (closeRequest) await this.application.database.deleteCloseRequest(closeRequest.id);
    await thread.setArchived(true);
    this.application.database.updateTicket({ ...ticket.toJSON(), closed: 1 });
  }
}

export default TicketsManager;
