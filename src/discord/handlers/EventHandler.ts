import { AuditLogEvent, type Client, type GuildAuditLogsEntry } from 'discord.js';
import type DiscordManager from '../DiscordManager.ts';
import type Ticket from '../../database/private/Ticket.ts';
import type { TicketAction } from '../../types/misc.ts';

class EventHandler {
  constructor(private readonly discord: DiscordManager) {}

  async onReady(client: Client<true>) {
    console.discord(`Logged in as ${client.user.username} (${client.user.id})!`);
    await this.discord.loadGuild();
  }

  async onGuildAuditLogEntryCreate(entry: GuildAuditLogsEntry) {
    if (entry.action !== AuditLogEvent.ThreadUpdate) return;
    if (!entry.targetId || !entry.executor) return;
    if (entry.executor.id === entry.executor.client.user.id) return;
    const ticket = this.discord.application.database.getTicketByThreadId(entry.targetId);
    if (!ticket) return;
    const action: TicketAction = { runner: entry.executor.id };
    for (const change of entry.changes) {
      if (change.key === 'name') await this.onTicketRename(ticket, entry, action);
      if (change.key === 'archived' && change.new === true) await this.onTicketArchive(ticket, action);
      if (change.key === 'archived' && change.new === false) await this.onTicketUnarchive(ticket, action);
    }
  }

  private async onTicketRename(ticket: Ticket, entry: GuildAuditLogsEntry, action: TicketAction) {
    await ticket.rename(entry.changes.find((change) => change.key === 'name')?.new, { runner: action.runner });
  }

  private async onTicketArchive(ticket: Ticket, action: TicketAction) {
    if (ticket.closed) return;
    await ticket.close(action);
  }

  private async onTicketUnarchive(ticket: Ticket, action: TicketAction) {
    if (!ticket.closed) return;
    await ticket.open(action);
  }
}

export default EventHandler;
