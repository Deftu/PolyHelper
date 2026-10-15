import type DiscordManager from '../discord/DiscordManager.ts';
import type {
  APIEmbedField,
  ButtonInteraction,
  ChatInputCommandInteraction,
  Client,
  ColorResolvable,
  EmbedAuthorOptions,
  Guild,
  GuildMember,
  ModalMessageModalSubmitInteraction,
  ModalSubmitInteraction
} from 'discord.js';
import type { ConfigDiscordEmbedsColors } from './config.ts';
import type { DevData, DevName } from './application.ts';
import type { EmbedStyles } from '../private/constants.ts';

export enum InteractionFlags {
  GuildCommand,
  GuildButton,
  GuildModal
}

export enum CommandPermission {
  Admin,
  Staff,
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

export interface AutocompleteOption {
  name: string;
  value?: string;
}

export interface GuildInteractionData {
  guildId: string;
  guild: Guild;
  member: GuildMember;
}

export type ChatInputCommandInteractionWithGuild = ChatInputCommandInteraction & GuildInteractionData;
export type ButtonInteractionWithGuild = ButtonInteraction & GuildInteractionData;
export type ModalSubmitInteractionWithGuild = ModalSubmitInteraction & GuildInteractionData;
export type ModalMessageModalSubmitInteractionWithGuild = ModalMessageModalSubmitInteraction & GuildInteractionData;

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
