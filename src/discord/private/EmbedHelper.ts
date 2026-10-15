import config from '../../../config.json' with { type: 'json' };
import { type APIEmbed, type APIEmbedField, type ColorResolvable, EmbedBuilder, type EmbedData } from 'discord.js';
import { CommonDevs, EmbedStyles } from '../../private/constants.ts';
import { ConfigDiscordEmbedsColors } from '../../types/config.ts';
import { type DevData, type DevName } from '../../types/application.ts';
import type { EmbedHelperField, EmbedStyleData, EmbedStyleName } from '../../types/discord.ts';

export default class EmbedHelper extends EmbedBuilder {
  constructor(data?: EmbedData | APIEmbed) {
    super(data);
    if (data) return;
    this.setTimestamp();
    this.setStyle('Generic');
  }

  override setColor(color: ConfigDiscordEmbedsColors | ColorResolvable | null): this {
    if (ConfigDiscordEmbedsColors.safeParse(color).success) {
      return super.setColor(config.discord.embeds.colors[color as ConfigDiscordEmbedsColors] as ColorResolvable);
    }

    return super.setColor(color as ColorResolvable);
  }

  setDevFooter(data: DevName | DevData | null, message: string = 'Consider checking out /about'): this {
    if (data === null) return this.setFooter(null);
    const dev = (typeof data === 'string' ? CommonDevs[data] : data) as DevData;
    const { displayName, discord, avatarURL } = dev;
    const username = discord ? `@${discord.username}` : displayName;
    return this.setFooter({ text: `by ${username} | ${message}`, iconURL: avatarURL });
  }

  setStyle(data: EmbedStyleName | EmbedStyleData): this {
    const { title, author, description, color, footer, footerMessage, timestamp } = (
      typeof data === 'string' ? EmbedStyles[data] : data
    ) as EmbedStyleData;
    this.setTitle(title ?? null);
    this.setAuthor(author ?? null);
    this.setDescription(description ?? null);
    this.setColor(color ?? null);
    this.setDevFooter(footer ?? null, footerMessage);
    this.setTimestamp(timestamp === 'Now' ? Date.now() : (timestamp ?? null));
    return this;
  }

  override setFields(...fields: EmbedHelperField[]): this {
    return super.setFields(fields.map((field) => this.formatField(field)));
  }

  override addFields(...fields: EmbedHelperField[]): this {
    return super.addFields(fields.map((field) => this.formatField(field)));
  }

  private formatField({ name, value, inline, blockValue, formatTimestamp }: EmbedHelperField): APIEmbedField {
    return { name, value: this.formatFieldValue({ name, value, inline, blockValue, formatTimestamp }), inline };
  }

  private formatFieldValue({ value, smallBlockValue, blockValue, formatTimestamp }: EmbedHelperField): string {
    if (smallBlockValue) return `\`${value}\``;
    if (blockValue) return `\`\`\`${value}\`\`\``;
    if (formatTimestamp) return `<t:${value}:F> (<t:${value}:R>)`;
    return value;
  }
}

export class WarningEmbed extends EmbedHelper {
  constructor() {
    super();
    this.setStyle('Warning');
  }
}

export class ErrorEmbed extends EmbedHelper {
  constructor() {
    super();
    this.setStyle('Error');
  }
}

export class SuccessEmbed extends EmbedHelper {
  constructor() {
    super();
    this.setStyle('Success');
  }
}
