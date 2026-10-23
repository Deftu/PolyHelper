import EmbedHelper from '../../discord/private/EmbedHelper.ts';
import { replaceVariables } from '../../utils/stringUtils.ts';
import type { BaseMessageOptions, User } from 'discord.js';
import type { DatabasePanel } from '../../types/database.ts';

class Panel {
  readonly id: DatabasePanel['id'];
  readonly name: DatabasePanel['name'];
  readonly cleanName: DatabasePanel['cleanName'];
  readonly title: DatabasePanel['title'];
  readonly description: DatabasePanel['description'];
  readonly buttonLabel: DatabasePanel['buttonLabel'];
  readonly buttonEmoji: DatabasePanel['buttonEmoji'];
  readonly openingMessage: DatabasePanel['openingMessage'];
  readonly maxOpenTickets: DatabasePanel['maxOpenTickets'];
  readonly pinnedTicketPrefix: DatabasePanel['pinnedTicketPrefix'];
  readonly defaultTicketName: DatabasePanel['defaultTicketName'];
  readonly supportRole: DatabasePanel['supportRole'];
  readonly #enabled: DatabasePanel['enabled'];
  constructor(data: DatabasePanel) {
    this.id = data.id;
    this.name = data.name;
    this.cleanName = data.cleanName;
    this.title = data.title;
    this.description = data.description;
    this.buttonLabel = data.buttonLabel;
    this.buttonEmoji = data.buttonEmoji;
    this.openingMessage = data.openingMessage;
    this.maxOpenTickets = data.maxOpenTickets;
    this.pinnedTicketPrefix = data.pinnedTicketPrefix;
    this.defaultTicketName = data.defaultTicketName;
    this.supportRole = data.supportRole;
    this.#enabled = data.enabled;
  }

  get fullPinnedTicketPrefix(): string {
    return `[${this.pinnedTicketPrefix}]`;
  }

  get enabled(): boolean {
    return Boolean(this.#enabled);
  }

  getStartingMessageData(user: User): BaseMessageOptions {
    return {
      content: `<@${user.id}>`,
      embeds: [
        new EmbedHelper()
          .setColor('Green')
          .setTitle(this.cleanName)
          .setDescription(
            replaceVariables(this.openingMessage, { mention: `<@${user.id}>`, username: user.username, id: user.id })
          )
      ]
    };
  }

  toJSON(): DatabasePanel {
    return {
      id: this.id,
      name: this.name,
      cleanName: this.cleanName,
      title: this.title,
      description: this.description,
      buttonLabel: this.buttonLabel,
      buttonEmoji: this.buttonEmoji,
      openingMessage: this.openingMessage,
      maxOpenTickets: this.maxOpenTickets,
      pinnedTicketPrefix: this.pinnedTicketPrefix,
      defaultTicketName: this.defaultTicketName,
      supportRole: this.supportRole,
      enabled: this.#enabled
    };
  }
}

export default Panel;
