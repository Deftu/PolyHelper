import PolyHelperError from '../../private/error.ts';
import type DatabaseManager from '../DatabaseManager.ts';
import type Panel from './Panel.ts';
import type { DatabaseTicket } from '../../types/database.ts';
import type { GuildMember, TextThreadChannel } from 'discord.js';

class Ticket {
  readonly id: DatabaseTicket['id'];
  readonly panelId: DatabaseTicket['panelId'];
  readonly threadId: DatabaseTicket['threadId'];
  readonly owner: DatabaseTicket['owner'];
  readonly #pinned: DatabaseTicket['pinned'];
  readonly #closed: DatabaseTicket['closed'];
  constructor(
    data: DatabaseTicket,
    private readonly manager: DatabaseManager
  ) {
    this.id = data.id;
    this.panelId = data.panelId;
    this.threadId = data.threadId;
    this.owner = data.owner;
    this.#pinned = data.pinned;
    this.#closed = data.closed;
  }

  get pinned(): boolean {
    return Boolean(this.#pinned);
  }

  get closed(): boolean {
    return Boolean(this.#closed);
  }

  get panel(): Panel {
    const panel = this.manager.getPanel(this.panelId);
    if (!panel) throw new PolyHelperError('Could not find the matching panel?');
    return panel;
  }

  async getDiscord(): Promise<GuildMember> {
    if (!this.manager.application.discord.isGuildReady()) {
      await this.manager.application.discord.loadGuild();
      throw new PolyHelperError("The discord server isn't ready. Please try again later");
    }

    return await this.manager.application.discord.guild.members.fetch(this.owner);
  }

  async getThread(): Promise<TextThreadChannel> {
    const channel = await this.manager.application.discord.getSupportChannel();
    const thread = await channel.threads.fetch(this.threadId);
    if (!thread) throw new PolyHelperError('Could not find the matching thread?');
    return thread;
  }

  async mentionOwnerInThread(message?: string) {
    const thread = await this.getThread();
    const user = await this.getDiscord();
    await thread.send({ content: `<@${user.user.id}>\n${message}`.trim() });
  }

  toJSON(): DatabaseTicket {
    return {
      id: this.id,
      panelId: this.panelId,
      threadId: this.threadId,
      owner: this.owner,
      pinned: this.#pinned,
      closed: this.#closed
    };
  }
}

export default Ticket;
