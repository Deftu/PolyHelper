import DiscordCommand from '../private/commands/DiscordCommand.ts';
import DiscordCommandDataBuilder from '../private/commands/DiscordCommandDataBuilder.ts';
import {
  ActionRowBuilder,
  type BaseMessageOptions,
  ButtonBuilder,
  type ChatInputCommandInteraction,
  MessageFlags,
  SectionBuilder,
  TextDisplayBuilder
} from 'discord.js';
import { PatchedContainerBuilder, ViewCreditsButton, ViewSourceCodeButton } from '../private/ComponentHelper.ts';
import type { DiscordManagerWithClient } from '../../types/discord.ts';

class InformationCommand extends DiscordCommand {
  override readonly data = new DiscordCommandDataBuilder()
    .setName('information')
    .setDescription('Shows information about the bot.');

  private static formatInformation({
    name,
    value,
    format
  }: {
    name: string;
    value: string | number;
    format?: boolean;
  }): string {
    return `**${name}:** ${format !== false ? `\`${value}\`` : value}`;
  }

  static InformationComponent(
    discord: DiscordManagerWithClient,
    ownerId: string
  ): NonNullable<BaseMessageOptions['components']> {
    const { commit, dirty, startTime } = discord.application.getRuntimeInformation();
    return [
      new PatchedContainerBuilder()
        .addSectionComponents(
          new SectionBuilder().addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`# ${discord.application.package.name}`),
            new TextDisplayBuilder().setContent(discord.application.package.description)
          )
        )
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            [
              '## Runtime Info',
              ...[
                { name: 'Version', value: discord.application.package.version },
                { name: 'Online since', value: `<t:${startTime}:F> (<t:${startTime}:R>)`, format: false },
                { name: 'Git Hash', value: commit ?? 'UNKNOWN' },
                {
                  name: 'Is Git Dirty',
                  value: dirty !== null ? (dirty ? ':white_check_mark: Yes' : ':x: No') : 'UNKNOWN',
                  format: false
                }
              ].map((line) => this.formatInformation(line))
            ].join('\n')
          )
        ),
      new ActionRowBuilder<ButtonBuilder>().addComponents(ViewCreditsButton(ownerId), ViewSourceCodeButton())
    ];
  }

  override async execute(interaction: ChatInputCommandInteraction) {
    await interaction.followUp({
      components: InformationCommand.InformationComponent(this.discord, interaction.user.id),
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { parse: [] }
    });
  }
}

export default InformationCommand;
