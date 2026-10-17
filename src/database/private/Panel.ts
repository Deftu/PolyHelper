import EmbedHelper from '../../discord/private/EmbedHelper.ts';
import { replaceVariables } from '../../utils/stringUtils.ts';
import type DatabaseManager from '../DatabaseManager.ts';
import type { BaseMessageOptions, User } from 'discord.js';
import type { DatabasePanel } from '../../types/database.ts';

class Panel {
  readonly id: DatabasePanel['id'];
  readonly name: DatabasePanel['name'];
  readonly title: DatabasePanel['title'];
  readonly description: DatabasePanel['description'];
  readonly buttonLabel: DatabasePanel['buttonLabel'];
  readonly buttonEmoji: DatabasePanel['buttonEmoji'];
  readonly openingMessage: DatabasePanel['openingMessage'];
  readonly maxOpenTickets: DatabasePanel['maxOpenTickets'];
  readonly #pingSupportRoleOnOpen: DatabasePanel['pingSupportRoleOnOpen'];
  readonly #enabled: DatabasePanel['enabled'];
  constructor(
    data: DatabasePanel,
    private readonly manager: DatabaseManager
  ) {
    this.id = data.id;
    this.name = data.name;
    this.title = data.title;
    this.description = data.description;
    this.buttonLabel = data.buttonLabel;
    this.buttonEmoji = data.buttonEmoji;
    this.openingMessage = data.openingMessage;
    this.maxOpenTickets = data.maxOpenTickets;
    this.#pingSupportRoleOnOpen = data.pingSupportRoleOnOpen;
    this.#enabled = data.enabled;
  }

  get pingSupportRoleOnOpen(): boolean {
    return Boolean(this.#pingSupportRoleOnOpen);
  }

  get enabled(): boolean {
    return Boolean(this.#enabled);
  }

  getOpeningMessage(user: User): BaseMessageOptions {
    return {
      content:
        `<@${user.id}> ${this.pingSupportRoleOnOpen ? `<@&${this.manager.application.config.discord.roles.support}>` : ''}`.trim(),
      embeds: [
        new EmbedHelper()
          .setColor('Green')
          .setTitle(this.name)
          .setDescription(
            replaceVariables(this.openingMessage, { mention: `<@${user.id}>`, username: user.username, id: user.id })
          )
      ]
    };
  }
}

export default Panel;
