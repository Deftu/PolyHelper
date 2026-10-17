import config from '../../../config.json' with { type: 'json' };
import {
  ButtonBuilder,
  ButtonStyle,
  ChannelSelectMenuBuilder,
  ChannelType,
  CheckboxBuilder,
  ContainerBuilder,
  type HexColorString,
  LabelBuilder,
  ModalBuilder,
  type RGBTuple,
  TextDisplayBuilder,
  TextInputBuilder,
  TextInputStyle
} from 'discord.js';
import { ConfigDiscordEmbedsColors } from '../../types/config.ts';
import { hexToRgb } from '../../utils/miscUtils.ts';
import type { DatabasePanel } from '../../types/database.ts';

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
    .setURL('https://github.com/Polyfrost/PolyHelper');
}

export function OpenTicketButton({ id, buttonLabel, buttonEmoji, enabled }: DatabasePanel): ButtonBuilder {
  const button = new ButtonBuilder()
    .setStyle(ButtonStyle.Secondary)
    .setLabel(buttonLabel)
    .setCustomId(`panel:${id}`)
    .setDisabled(!Boolean(enabled));
  if (buttonEmoji) button.setEmoji(buttonEmoji);
  return button;
}

export function BasicPanelModal(panel?: DatabasePanel): ModalBuilder {
  const channel = new ChannelSelectMenuBuilder()
    .setCustomId('channel')
    .setRequired(true)
    .setChannelTypes(ChannelType.GuildText)
    .setMaxValues(1);
  if (panel) channel.setDefaultChannels(panel.channel);

  return new ModalBuilder().addLabelComponents(
    new LabelBuilder().setLabel('Panel Name').setTextInputComponent(
      new TextInputBuilder()
        .setCustomId('name')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setValue(panel?.name ?? '')
    ),
    new LabelBuilder().setLabel('Title').setTextInputComponent(
      new TextInputBuilder()
        .setCustomId('title')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setValue(panel?.title ?? '')
    ),
    new LabelBuilder().setLabel('Description').setTextInputComponent(
      new TextInputBuilder()
        .setCustomId('description')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
        .setValue(panel?.description ?? '')
    ),
    new LabelBuilder().setLabel('Staff Channel').setChannelSelectMenuComponent(channel),
    new LabelBuilder()
      .setLabel('Enabled')
      .setCheckboxComponent(new CheckboxBuilder().setCustomId('enabled').setDefault(Boolean(panel?.enabled ?? 1)))
  );
}

export function MiscPanelModal(panel?: DatabasePanel): ModalBuilder {
  return new ModalBuilder()
    .addLabelComponents(
      new LabelBuilder().setLabel('Button Label').setTextInputComponent(
        new TextInputBuilder()
          .setCustomId('buttonLabel')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setValue(panel?.buttonLabel ?? '')
      ),
      new LabelBuilder().setLabel('Button Emoji (emoji id)').setTextInputComponent(
        new TextInputBuilder()
          .setCustomId('buttonEmoji')
          .setStyle(TextInputStyle.Short)
          .setValue(panel?.buttonEmoji ?? '')
          .setRequired(false)
      )
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        [
          '## Variables',
          '',
          "- `{mention}` - Ticket Opener's mention",
          "- `{username}` - Ticket Opener's username",
          "- `{id}` - Ticket Opener's id",
          '- `{serverName}` - the discord server name',
          '- `{panelName}` - panel name'
        ].join('\n')
      )
    )
    .addLabelComponents(
      new LabelBuilder().setLabel('Opening Message').setTextInputComponent(
        new TextInputBuilder()
          .setCustomId('openingMessage')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
          .setValue(panel?.openingMessage ?? '')
      ),
      new LabelBuilder()
        .setLabel('Ping Support Role On Open')
        .setCheckboxComponent(
          new CheckboxBuilder()
            .setCustomId('pingSupportRoleOnOpen')
            .setDefault(Boolean(panel?.pingSupportRoleOnOpen ?? 1))
        )
    );
}
