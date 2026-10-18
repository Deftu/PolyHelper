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
      if (closeRequest.ticket.pinned) this.scripts.application.database.deleteCloseRequest(closeRequest.id);
      const message = await closeRequest.getMessage();
      await message.reply({
        embeds: [new EmbedHelper().setTitle('Closing').setDescription('Close requests have expired. Auto-closing...')]
      });
      await closeRequest.ticket.close({ reason: closeRequest.reason, runner: closeRequest.closer });
    }
  }
}

export default CheckCloseRequestsScript;
