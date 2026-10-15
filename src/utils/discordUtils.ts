import {
  type APIInteractionGuildMember,
  type ButtonInteraction,
  type ChatInputCommandInteraction,
  type Client,
  GuildMember,
  InteractionType,
  ModalSubmitInteraction,
  Role,
  type SendableChannels,
  Team,
  type User
} from 'discord.js';
import { isGuildMember } from '@sapphire/discord.js-utilities';
import type {
  ButtonInteractionWithGuild,
  ChatInputCommandInteractionWithGuild,
  ModalSubmitInteractionWithGuild
} from '../types/discord.ts';

export async function getRoles(member: GuildMember): Promise<Role[]> {
  member = await member.fetch();
  return member.roles.cache.map((role) => role);
}

export async function getApplicationOwners(client: Client<true>): Promise<string[]> {
  const app = await client.application.fetch();
  if (app.owner instanceof Team) return app.owner.members.map((member) => member.id);
  return app.owner?.id ? [app.owner.id] : [];
}

export async function isApplicationOwner(user: User): Promise<boolean> {
  const adminUsers = await getApplicationOwners(user.client);
  return adminUsers.includes(user.id);
}

export function isDiscordServerOwner(user: User): boolean {
  if (!user.client.discordManager.isGuildReady()) return false;
  return user.id === user.client.discordManager.guild.ownerId;
}

export async function isAdminMember(user: User): Promise<boolean> {
  if (await isApplicationOwner(user)) return true;
  if (isDiscordServerOwner(user)) return true;
  return false;
}

export async function isPolyfrostTeamMember(member: GuildMember | APIInteractionGuildMember | null): Promise<boolean> {
  if (!isGuildMember(member)) return false;
  if (await isAdminMember(member.user)) return true;
  const userRoles = await getRoles(member).then((roles) => roles.map((role) => role.id));
  if (userRoles.includes(member.client.config.discord.roles.polyfrostTeam)) return true;
  return false;
}

export async function isModeratorMember(member: GuildMember | APIInteractionGuildMember | null): Promise<boolean> {
  if (!isGuildMember(member)) return false;
  if (await isPolyfrostTeamMember(member)) return true;
  const userRoles = await getRoles(member).then((roles) => roles.map((role) => role.id));
  if (userRoles.includes(member.client.config.discord.roles.moderator)) return true;
  return false;
}

export async function isSupportMember(member: GuildMember | APIInteractionGuildMember | null): Promise<boolean> {
  if (!isGuildMember(member)) return false;
  if (await isModeratorMember(member)) return true;
  const userRoles = await getRoles(member).then((roles) => roles.map((role) => role.id));
  if (userRoles.includes(member.client.config.discord.roles.support)) return true;
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
