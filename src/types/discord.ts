import type DiscordManager from '../discord/DiscordManager.ts';
import type {
  APIEmbedField,
  AutocompleteInteraction,
  ButtonInteraction,
  ChatInputCommandInteraction,
  Client,
  ColorResolvable,
  EmbedAuthorOptions,
  Guild,
  GuildMember,
  ModalMessageModalSubmitInteraction,
  ModalSubmitInteraction,
  TextBasedChannel
} from 'discord.js';
import type { ConfigDiscordEmbedsColors } from './config.ts';
import type { DevData, DevName } from './application.ts';
import type { EmbedStyles } from '../private/constants.ts';

declare module 'discord.js' {
  export interface Client {
    discordManager: DiscordManager;
  }
}

export enum InteractionFlags {
  GuildCommand,
  GuildButton,
  GuildModal
}

export enum CommandPermission {
  Admin,
  PolyfrostTeam,
  Moderator,
  Support,
  Anyone
}

export enum BasicInteractionResponse {
  Public,
  Ephemeral,
  None
}

export enum ButtonResponse {
  Public = BasicInteractionResponse.Public,
  Ephemeral = BasicInteractionResponse.Ephemeral,
  None = BasicInteractionResponse.None,
  Update
}

export type DiscordManagerWithClient = DiscordManager & { client: Client<true> };
export type DiscordManagerWithGuild = DiscordManagerWithClient & { guild: Guild };

export interface AutocompleteOption {
  name: string;
  value?: string;
}

export interface GuildInteractionData {
  guildId: string;
  guild: Guild;
  member: GuildMember;
}

export type ChatInputCommandInteractionWithGuild = ChatInputCommandInteraction &
  GuildInteractionData & { channel: TextBasedChannel };
export type ButtonInteractionWithGuild = ButtonInteraction & GuildInteractionData & { channel: TextBasedChannel };
export type ModalSubmitInteractionWithGuild = ModalSubmitInteraction & GuildInteractionData;
export type ModalMessageModalSubmitInteractionWithGuild = ModalMessageModalSubmitInteraction & GuildInteractionData;

export type InteractionTypes =
  | AutocompleteInteraction
  | ButtonInteraction
  | ChatInputCommandInteraction
  | ModalMessageModalSubmitInteraction
  | ModalSubmitInteraction;

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

export interface EmbedHelperField extends APIEmbedField {
  smallBlockValue?: boolean;
  blockValue?: boolean;
  formatTimestamp?: boolean;
}
