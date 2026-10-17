import PolyHelperError from '../../../private/error.ts';
import type DatabaseManager from '../../DatabaseManager.ts';
import type Panel from '../Panel.ts';
import type { DatabaseTicket } from '../../../types/database.ts';
import type { GuildMember } from 'discord.js';

class BasicTicket {
  readonly panelId: DatabaseTicket['panelId'];
  readonly owner: DatabaseTicket['owner'];
  constructor(
    data: Pick<DatabaseTicket, 'panelId' | 'owner'>,
    protected readonly manager: DatabaseManager
  ) {
    this.panelId = data.panelId;
    this.owner = data.owner;
  }

  getPanel(): Panel {
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
}

export default BasicTicket;
