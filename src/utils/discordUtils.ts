import {
  type ButtonInteraction,
  type ChatInputCommandInteraction,
  type Client,
  InteractionType,
  ModalSubmitInteraction,
  type SendableChannels,
  Team,
  type User
} from 'discord.js';
import type {
  ButtonInteractionWithGuild,
  ChatInputCommandInteractionWithGuild,
  ModalSubmitInteractionWithGuild
} from '../types/discord.ts';

export async function getApplicationOwners(client: Client<true>): Promise<string[]> {
  const app = await client.application.fetch();
  if (app.owner instanceof Team) return app.owner.members.map((member) => member.id);
  return app.owner?.id ? [app.owner.id] : [];
}

export async function isApplicationOwner(user: User): Promise<boolean> {
  const adminUsers = await getApplicationOwners(user.client);
  return adminUsers.includes(user.id);
}

export async function isAdminMember(user: User): Promise<boolean> {
  if (await isApplicationOwner(user)) return true;
  return false;
}

export function isChatInputCommandInteractionInsideOfGuild(
  interaction: ChatInputCommandInteraction
): interaction is ChatInputCommandInteractionWithGuild {
  return interaction.guild !== null && interaction.member !== null;
}

export function isButtonInteractionInsideOfGuild(
  interaction: ButtonInteraction
): interaction is ButtonInteractionWithGuild {
  return interaction.guild !== null && interaction.member !== null;
}

export function isModalSubmitInteractionInsideOfGuild(
  interaction: ModalSubmitInteraction
): interaction is ModalSubmitInteractionWithGuild {
  return interaction.guild !== null && interaction.member !== null;
}

export async function canSendMessages(channel: SendableChannels): Promise<boolean> {
  return await channel
    .sendTyping()
    .then(() => true)
    .catch((error: Error) => {
      if (error.message === 'Missing Access') return false;
      throw error;
    });
}

export function parseInteractionType(type: InteractionType): string {
  switch (type) {
    case InteractionType.ApplicationCommand:
      return 'ApplicationCommand';
    case InteractionType.MessageComponent:
      return 'MessageComponent';
    case InteractionType.ApplicationCommandAutocomplete:
      return 'ApplicationCommandAutocomplete';
    case InteractionType.ModalSubmit:
      return 'ModalSubmit';
    case InteractionType.Ping:
    default:
      return 'Ping';
  }
}
