import config from '../../../config.json' with { type: 'json' };
import { ButtonBuilder, ButtonStyle, ContainerBuilder, type HexColorString, type RGBTuple } from 'discord.js';
import { ConfigDiscordEmbedsColors } from '../../types/config.ts';
import { hexToRgb } from '../../utils/miscUtils.ts';

export class PatchedContainerBuilder extends ContainerBuilder {
  constructor() {
    super();
    this.setAccentColor('Pink');
  }

  override setAccentColor(color?: ConfigDiscordEmbedsColors | HexColorString | RGBTuple | number): this {
    if (ConfigDiscordEmbedsColors.safeParse(color).success) {
      return super.setAccentColor(
        hexToRgb(config.discord.embeds.colors[color as ConfigDiscordEmbedsColors] as HexColorString)
      );
    }
    if (typeof color === 'string') {
      return super.setAccentColor(hexToRgb(color as HexColorString));
    }
    return super.setAccentColor(color);
  }
}

export function ViewInformationButton(ownerId: string): ButtonBuilder {
  return new ButtonBuilder()
    .setStyle(ButtonStyle.Secondary)
    .setLabel('View Information')
    .setCustomId(`viewInformation:${ownerId}`);
}

export function ViewCreditsButton(ownerId: string): ButtonBuilder {
  return new ButtonBuilder()
    .setStyle(ButtonStyle.Secondary)
    .setLabel('View Credits')
    .setCustomId(`viewCredits:${ownerId}`);
}

export function ViewSourceCodeButton(): ButtonBuilder {
  return new ButtonBuilder()
    .setStyle(ButtonStyle.Link)
    .setLabel('View Source Code')
    .setURL('hhttps://github.com/Polyfrost/PolyHelper');
}
