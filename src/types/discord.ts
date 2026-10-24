import type DiscordManager from '../discord/DiscordManager.ts';
import type {
  APIEmbedField,
  AutocompleteInteraction,
  BaseInteraction,
  ButtonInteraction,
  ChatInputCommandInteraction,
  Client,
  ColorResolvable,
  ContextMenuCommandInteraction,
  EmbedAuthorOptions,
  Guild,
  GuildMember,
  MessageContextMenuCommandInteraction,
  ModalMessageModalSubmitInteraction,
  ModalSubmitInteraction,
  StringSelectMenuInteraction,
  TextBasedChannel,
  User,
  UserContextMenuCommandInteraction
} from 'discord.js';
import type { ConfigDiscordEmbedsColors } from './config.ts';
import type { DevData, DevName } from './application.ts';
import type { EmbedStyles } from '../private/constants.ts';

declare module 'discord.js' {
  export interface Client {
    discordManager: DiscordManager;
  }
}

export enum InteractionFlag {
  RequiresGuild
}

export enum InteractionPermission {
  Owner,
  Admin,
  PolyfrostTeam,
  Moderator,
  Support,
  Anyone
}

export enum InteractionResponse {
  Public,
  Ephemeral,
  None,
  Update
}

export type DiscordManagerWithClient = DiscordManager & { client: Client<true> };
export type DiscordManagerWithGuild = DiscordManagerWithClient & { guild: Guild };

export interface AutocompleteOption {
  name: string;
  value?: string;
}

export interface AutocompleteOptionWithValue extends AutocompleteOption {
  value: string;
}

export interface GuildInteractionData {
  guildId: string;
  guild: Guild;
  member: GuildMember;
  channel: TextBasedChannel;
}
export type InteractionWithGuild<Interaction extends BaseInteraction> = Interaction & GuildInteractionData;

export type InteractionTypes =
  | AutocompleteInteraction
  | ButtonInteraction
  | ChatInputCommandInteraction
  | ContextMenuCommandInteraction
  | ModalMessageModalSubmitInteraction
  | ModalSubmitInteraction
  | StringSelectMenuInteraction;

export type MessageAndUserContextMenuInteraction =
  MessageContextMenuCommandInteraction | UserContextMenuCommandInteraction;

export type EmbedStyleName = keyof typeof EmbedStyles;
export interface EmbedStyleData {
  title?: string;
  author?: EmbedAuthorOptions;
  description?: string;
  color?: ConfigDiscordEmbedsColors | ColorResolvable;
  footer?: DevName | DevData;
  footerMessage?: string;
  timestamp?: Date | number | 'Now';
}

export type EmbedHelperValueFormatter = 'Small Block' | 'Block' | 'Timestamp' | 'Boolean' | 'Discord User';
export type EmbedHelperField =
  | (APIEmbedField & { format?: 'Small Block' | 'Block' })
  | (Omit<APIEmbedField, 'value'> & { value: number; format: 'Timestamp' })
  | (Omit<APIEmbedField, 'value'> & { value: boolean; format: 'Boolean' })
  | (Omit<APIEmbedField, 'value'> & { value: User | string; format: 'Discord User' });
