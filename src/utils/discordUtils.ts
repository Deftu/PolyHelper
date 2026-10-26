import {
  type APIInteractionGuildMember,
  type BaseInteraction,
  type Client,
  GuildMember,
  InteractionType,
  type Role,
  type SendableChannels,
  Team,
  User
} from 'discord.js';
import { isGuildMember } from '@sapphire/discord.js-utilities';
import type { InteractionWithGuild } from '../types/discord.ts';

export async function getRoles(member: GuildMember): Promise<Role[]> {
  member = await member.fetch();
  return member.roles.cache.map((role) => role);
}

export async function hasRole(member: GuildMember, roleId: Role['id']): Promise<boolean> {
  const userRoles = await getRoles(member).then((roles) => roles.map((role) => role.id));
  return userRoles.includes(roleId);
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

export async function isAdminMember(member: GuildMember | APIInteractionGuildMember | null): Promise<boolean> {
  if (!isGuildMember(member)) return false;
  if (member.permissions.has('Administrator')) return true;
  if (await isApplicationOwner(member.user)) return true;
  if (isDiscordServerOwner(member.user)) return true;
  return false;
}

export async function isPolyfrostTeamMember(member: GuildMember | APIInteractionGuildMember | null): Promise<boolean> {
  if (!isGuildMember(member)) return false;
  if (await isAdminMember(member)) return true;
  return await hasRole(member, member.client.discordManager.application.config.discord.roles.polyfrostTeam);
}

export async function isModeratorMember(member: GuildMember | APIInteractionGuildMember | null): Promise<boolean> {
  if (!isGuildMember(member)) return false;
  if (await isPolyfrostTeamMember(member)) return true;
  return await hasRole(member, member.client.discordManager.application.config.discord.roles.moderator);
}

export async function isSupportMember(member: GuildMember | APIInteractionGuildMember | null): Promise<boolean> {
  if (!isGuildMember(member)) return false;
  if (await isModeratorMember(member)) return true;
  return await hasRole(member, member.client.discordManager.application.config.discord.roles.support);
}

export function isInteractionInsideOfGuild<Interaction extends BaseInteraction>(
  interaction: Interaction
): interaction is InteractionWithGuild<Interaction> {
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

export function getUserDisplayName(user: User, id: boolean = true): string {
  return `${user.globalName ?? `@${user.username}`} (${id ? `(${user.id})` : ''})`.trim();
}

export function getFormattedBooleanResponse(value: boolean): string {
  return value ? ':white_check_mark: Yes' : ':x: No';
}

export function getUserId(user: User | string): string {
  if (user instanceof User) return user.id;
  return user;
}

export function getMention(user: User | string): string {
  return `<@${getUserId(user)}>`;
}
