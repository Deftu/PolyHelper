import BasicScript from '../BasicScript.ts';
import EmbedHelper from '../../discord/private/EmbedHelper.ts';
import type ScriptManager from '../ScriptManager.ts';

class CheckCloseRequestsScript extends BasicScript {
  constructor(scripts: ScriptManager) {
    super(scripts, { id: 'checkCloseRequets', interval: '1m' });
  }

  override async execute() {
    const closeRequests = this.scripts.application.database.getCloseRequestByAutoClose();
    for (const closeRequest of closeRequests) {
      if (closeRequest.ticket.pinned) this.scripts.application.database.deleteCloseRequest(closeRequest.id);
      const message = await closeRequest.getMessage();
      await message.reply({
        embeds: [new EmbedHelper().setTitle('Closeing...').setDescription('Close request has expired. Auto closing')]
      });
      await this.scripts.application.tickets.closeTicket({
        id: closeRequest.ticket.id,
        reason: closeRequest.reason,
        closer: closeRequest.closer
      });
    }
  }
}

export default CheckCloseRequestsScript;
