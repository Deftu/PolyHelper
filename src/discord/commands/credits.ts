import DiscordCommand from '../private/commands/DiscordCommand.ts';
import DiscordCommandDataBuilder from '../private/commands/DiscordCommandDataBuilder.ts';
import {
  ActionRowBuilder,
  type BaseMessageOptions,
  ButtonBuilder,
  type ChatInputCommandInteraction,
  MessageFlags,
  TextDisplayBuilder
} from 'discord.js';
import { CommonDevs, getParsedMiscCredits } from '../../private/constants.ts';
import { DevTypes } from '../../types/application.ts';
import { PatchedContainerBuilder, ViewInformationButton, ViewSourceCodeButton } from '../private/ComponentHelper.ts';
import { convertDevDataToName } from '../../utils/miscUtils.ts';

class CreditsCommand extends DiscordCommand {
  override readonly data = new DiscordCommandDataBuilder()
    .setName('credits')
    .setDescription('Shows the credits of the people who make this possible');

  static CreditsComponent(ownerId: string): NonNullable<BaseMessageOptions['components']> {
    return [
      new PatchedContainerBuilder()
        .addTextDisplayComponents(new TextDisplayBuilder().setContent('# Credits'))
        .addTextDisplayComponents(
          ...DevTypes.filter((type) => Object.values(CommonDevs).filter((data) => data.type === type).length > 0).map(
            (type) =>
              new TextDisplayBuilder().setContent(
                [
                  `## ${type}`,
                  ...Object.values(CommonDevs)
                    .filter((data) => data.type === type)
                    .sort((a, b) => a.displayName.localeCompare(b.displayName))
                    .map(
                      (dev) =>
                        `${convertDevDataToName(dev, true)} - [Github](<https://github.com/${dev.githubUsername}>)`
                    )
                ].join('\n')
              )
          )
        )
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            [
              '## Misc',
              'Below are some tools/projects that this bot utilizes to stay a float',
              ...getParsedMiscCredits()
            ].join('\n')
          )
        ),

      new ActionRowBuilder<ButtonBuilder>().addComponents(ViewInformationButton(ownerId), ViewSourceCodeButton())
    ];
  }

  override async execute(interaction: ChatInputCommandInteraction) {
    await interaction.followUp({
      components: CreditsCommand.CreditsComponent(interaction.user.id),
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { parse: [] }
    });
  }
}

export default CreditsCommand;
