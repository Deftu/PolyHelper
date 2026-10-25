import { AuditLogEvent, type Client, type GuildAuditLogsEntry } from 'discord.js';
import type DiscordManager from '../DiscordManager.ts';

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
    await ticket.rename(entry.changes.find((change) => change.key === 'name')?.new, { runner: entry.executor.id });
  }
}

export default EventHandler;
