import BasicTicket from './BasicTicket.ts';
import PolyHelperError from '../../../private/error.ts';
import type DatabaseManager from '../../DatabaseManager.ts';
import type { DatabaseTicket } from '../../../types/database.ts';
import type { TextThreadChannel } from 'discord.js';

class Ticket extends BasicTicket {
  readonly id: DatabaseTicket['id'];
  readonly threadId: DatabaseTicket['threadId'];
  readonly pinned: DatabaseTicket['pinned'];
  readonly closed: DatabaseTicket['closed'];
  constructor(data: DatabaseTicket, manager: DatabaseManager) {
    super(data, manager);
    this.id = data.id;
    this.threadId = data.threadId;
    this.pinned = data.pinned;
    this.closed = data.closed;
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
}

export default Ticket;
