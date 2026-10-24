import BasicScript from '../BasicScript.ts';
import ms from 'ms';
import { Message, MessageFlags, type TextThreadChannel, ThreadAutoArchiveDuration } from 'discord.js';
import { toError } from '../../utils/miscUtils.ts';
import type ScriptManager from '../ScriptManager.ts';

class KeepTicketThreadsAliveScript extends BasicScript {
  private readonly nextCheckAt = new Map<string, number>();
  private readonly threadArchiveDelay = ms('5m');
  constructor(scripts: ScriptManager) {
    super(scripts, { id: 'keepTicketThreadsAlive', interval: '1m' });
  }

  private async getLastMessageInThread(thread: TextThreadChannel): Promise<Message | null> {
    if (thread.lastMessage !== null) return thread.lastMessage;
    const messages = await thread.messages.fetch({ limit: 1 });
    return messages.first() ?? null;
  }

  override async execute() {
    const openTickets = this.scripts.application.database.getTickets({ closed: 0 });

    for (const ticket of openTickets) {
      try {
        const thread = await ticket.getThread();
        const nextCheckAt = this.nextCheckAt.get(thread.id);
        if (!thread.archived && nextCheckAt !== undefined && nextCheckAt > Date.now()) continue;
        if (thread.autoArchiveDuration === null) await thread.setAutoArchiveDuration(ThreadAutoArchiveDuration.OneWeek);

        const lastMessage = await this.getLastMessageInThread(thread);
        const lastActivity = lastMessage?.createdTimestamp ?? thread.createdTimestamp ?? Date.now();
        const autoArchiveAt = lastActivity + ms(`${thread.autoArchiveDuration ?? ThreadAutoArchiveDuration.OneWeek}m`);
        if (autoArchiveAt - Date.now() > this.threadArchiveDelay) continue;
        if (thread.archived) await thread.setArchived(false);

        if (thread.editable && !thread.locked) {
          const nextDuration =
            thread.autoArchiveDuration === ThreadAutoArchiveDuration.OneWeek
              ? ThreadAutoArchiveDuration.ThreeDays
              : ThreadAutoArchiveDuration.OneWeek;

          try {
            await thread.setAutoArchiveDuration(nextDuration);
            this.nextCheckAt.set(thread.id, Date.now() + ms(`${nextDuration}m`) - this.threadArchiveDelay);
            continue;
          } catch (error) {
            this.scripts.application.logError(toError(error), [
              { name: 'Script Id', value: this.id, format: 'Block' },
              { name: 'Ticket Id', value: ticket.id, format: 'Block' },
              { name: 'Operation', value: 'Set auto-archive duration; trying message fallback', format: 'Block' }
            ]);
          }
        }

        if (!thread.sendable || thread.archived || thread.locked) continue;
        await thread.send({
          content: 'This ticket is still open. This message prevents the thread from being automatically archived.',
          flags: MessageFlags.SuppressNotifications
        });
        this.nextCheckAt.set(
          thread.id,
          Date.now() +
            ms(`${thread.autoArchiveDuration ?? ThreadAutoArchiveDuration.OneWeek}m`) -
            this.threadArchiveDelay
        );
      } catch (error) {
        this.scripts.application.logError(toError(error), [
          { name: 'Script Id', value: this.id, format: 'Block' },
          { name: 'Ticket Id', value: ticket.id, format: 'Block' }
        ]);
      }
    }
  }
}

export default KeepTicketThreadsAliveScript;
