import BasicScript from '../BasicScript.ts';
import EmbedHelper from '../../discord/private/EmbedHelper.ts';
import type ScriptManager from '../ScriptManager.ts';

class CheckCloseRequestsScript extends BasicScript {
  constructor(scripts: ScriptManager) {
    super(scripts, { id: 'checkCloseRequests', interval: '1m' });
  }

  override async execute() {
    const closeRequests = this.scripts.application.database.getCloseRequestByAutoClose();
    for (const closeRequest of closeRequests) {
      const ticket = closeRequest.ticket;
      if (ticket.pinned) {
        await this.scripts.application.database.deleteCloseRequest(closeRequest.id);
        continue;
      }
      const message = await closeRequest.getMessage();
      await message.reply({
        embeds: [new EmbedHelper().setTitle('Closing').setDescription('Close requests have expired. Auto-closing...')]
      });
      await ticket.close({ reason: closeRequest.reason, runner: closeRequest.closer });
    }
  }
}

export default CheckCloseRequestsScript;
