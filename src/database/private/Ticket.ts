import EmbedHelper, { TicketEmbed } from '../../discord/private/EmbedHelper.ts';
import PolyHelperError from '../../private/error.ts';
import {
  ActionRowBuilder,
  type BaseMessageOptions,
  ButtonBuilder,
  ButtonStyle,
  type GuildMember,
  type Message,
  type TextThreadChannel
} from 'discord.js';
import type DatabaseManager from '../DatabaseManager.ts';
import type Panel from './Panel.ts';
import type { AutocompleteOptionWithValue } from '../../types/discord.ts';
import type { DatabaseTicket } from '../../types/database.ts';
import type { TicketAction } from '../../types/misc.ts';

class Ticket {
  readonly id: DatabaseTicket['id'];
  readonly panelId: DatabaseTicket['panelId'];
  readonly threadId: DatabaseTicket['threadId'];
  readonly owner: DatabaseTicket['owner'];
  readonly pinMessageId: DatabaseTicket['pinMessageId'];
  readonly startingMessageId: DatabaseTicket['startingMessageId'];
  readonly #closed: DatabaseTicket['closed'];
  constructor(
    data: DatabaseTicket,
    private readonly manager: DatabaseManager
  ) {
    this.id = data.id;
    this.panelId = data.panelId;
    this.threadId = data.threadId;
    this.owner = data.owner;
    this.pinMessageId = data.pinMessageId;
    this.startingMessageId = data.startingMessageId;
    this.#closed = data.closed;
  }

  get pinned(): boolean {
    return this.pinMessageId !== null;
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

  async getStartingMessage(): Promise<Message> {
    const thread = await this.getThread();
    const message = await thread.messages.fetch(this.startingMessageId).catch(() => null);
    if (!message) throw new PolyHelperError('Could not find the matching message?');
    return message;
  }

  static getThreadName(panelName: string, username: string, pinned: boolean = false) {
    return `${pinned ? '[📌]' : ''} [${panelName}] ticket-${username}`.trim();
  }

  async updateThreadName(): Promise<this> {
    const thread = await this.getThread();
    const discord = await this.getDiscord();
    await thread.setName(Ticket.getThreadName(this.panel.name, discord.user.username, this.pinned));
    return this;
  }

  async mentionOwnerInThread(message?: string) {
    const thread = await this.getThread();
    const user = await this.getDiscord();
    await thread.send({ content: `<@${user.user.id}>\n${message}`.trim() });
  }

  async close({ reason, runner }: TicketAction) {
    if (this.pinned) throw new PolyHelperError('This ticket is pinned. Please unpin it before closing');
    const thread = await this.getThread();
    await thread.send({
      embeds: [
        new EmbedHelper()
          .setTitle('Ticket Closed')
          .setDescription(`This ticket has been closeed by <@${runner}>`)
          .setFields({ name: 'Reason', value: reason, format: 'Block' })
      ]
    });
    const closeRequest = this.manager.getCloseRequestByTicketId(this.id);
    if (closeRequest) await this.manager.deleteCloseRequest(closeRequest.id);
    await thread.setArchived(true);
    this.manager.updateTicket({ ...this.toJSON(), closed: 1 });
  }

  async pin({ reason, runner }: TicketAction) {
    if (this.pinned) throw new PolyHelperError('This ticket is already pinned. Please unpin it to pin it');
    const thread = await this.getThread();
    const message = await thread.send({
      embeds: [
        new EmbedHelper()
          .setTitle('Ticket Pinned')
          .setDescription(`This ticket has been pinned by <@${runner}>`)
          .setFields({ name: 'Reason', value: reason, format: 'Block' })
      ]
    });
    await message.pin();
    return await this.manager.updateTicket({ ...this.toJSON(), pinMessageId: message.id }).updateThreadName();
  }

  async getPinMessage(): Promise<Message | undefined> {
    if (!this.pinMessageId) return undefined;
    const thread = await this.getThread();
    const message = await thread.messages.fetch(this.pinMessageId).catch(() => undefined);
    return message;
  }

  async unpin({ reason, runner }: TicketAction) {
    if (!this.pinned) throw new PolyHelperError('This ticket isnt pinned. Please pin it to unpin it');
    const thread = await this.getThread();
    const pinMessage = await this.getPinMessage();
    if (!pinMessage) throw new PolyHelperError('Is this ticket pinned? I could not find the pinned message');
    await pinMessage.unpin();
    await thread.send({
      embeds: [
        new EmbedHelper()
          .setTitle('Ticket Unpinned')
          .setDescription(`This ticket has been unpinned by <@${runner}>`)
          .setFields({ name: 'Reason', value: reason, format: 'Block' })
      ]
    });
    return await this.manager.updateTicket({ ...this.toJSON(), pinMessageId: null }).updateThreadName();
  }

  async getMessageData(): Promise<BaseMessageOptions> {
    const thread = await this.getThread();
    const startingMessage = await this.getStartingMessage();
    const pinMessage = await this.getPinMessage();
    return {
      embeds: [new TicketEmbed(this)],
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder().setLabel('Go To Thread').setStyle(ButtonStyle.Link).setURL(thread.url),
          new ButtonBuilder().setLabel('Go To Top of Thread').setStyle(ButtonStyle.Link).setURL(startingMessage.url),
          new ButtonBuilder()
            .setLabel('Go To Pin Message')
            .setStyle(ButtonStyle.Link)
            .setURL(pinMessage?.url ?? 'https://amber.rip')
            .setDisabled(pinMessage === undefined)
        ),
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setLabel(this.closed ? 'Open' : 'Close')
            .setStyle(this.closed ? ButtonStyle.Secondary : ButtonStyle.Danger)
            .setCustomId(this.closed ? `openTicket:${this.id}` : `closeTicket:${this.id}`)
            .setDisabled(this.pinned),
          new ButtonBuilder()
            .setLabel(this.pinned ? 'Unpin' : 'Pin')
            .setStyle(this.pinned ? ButtonStyle.Danger : ButtonStyle.Secondary)
            .setCustomId(this.pinned ? `unpinTicket:${this.id}` : `pinTicket:${this.id}`),
          new ButtonBuilder()
            .setLabel('Refresh Embed')
            .setStyle(ButtonStyle.Secondary)
            .setCustomId(`refreshTicketEmbed:${this.id}`)
        )
      ]
    };
  }

  async getAutocompleteOption(): Promise<AutocompleteOptionWithValue> {
    const user = await this.getDiscord();
    const startingMessage = await this.getStartingMessage();
    return {
      name: `${this.closed ? 'Closed' : 'Open'} Ticket form @${user.user.username} (${this.panel.name}) - ${startingMessage.createdAt.toISOString().split('T')[0]}`,
      value: this.id
    };
  }

  toJSON(): DatabaseTicket {
    return {
      id: this.id,
      panelId: this.panelId,
      threadId: this.threadId,
      owner: this.owner,
      pinMessageId: this.pinMessageId,
      startingMessageId: this.startingMessageId,
      closed: this.#closed
    };
  }
}

export default Ticket;
