import { type Message, MessageType } from 'discord.js';
import type DiscordManager from '../DiscordManager.ts';

class MessageHandler {
  constructor(private readonly discord: DiscordManager) {}

  async onMessage(message: Message) {
    if (message.type === MessageType.ThreadCreated) await this.onThreadCreated(message);
  }

  async onThreadCreated(message: Message) {
    if (message.author.id !== message.client.user.id) return;
    if (message.channel.id !== this.discord.application.config.discord.channels.support) return;
    await message.delete().catch(() => null);
  }
}

export default MessageHandler;
