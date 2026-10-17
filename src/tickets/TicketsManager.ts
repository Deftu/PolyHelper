import EmbedHelper from '../discord/private/EmbedHelper.ts';
import { ActionRowBuilder, type BaseMessageOptions, ButtonBuilder, Message } from 'discord.js';
import { OpenTicketButton } from '../discord/private/ComponentHelper.ts';
import type Application from '../Application.ts';

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
}

export default TicketsManager;
