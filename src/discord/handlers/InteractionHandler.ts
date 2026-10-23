import PolyHelperError from '../../private/error.ts';
import { type BaseInteraction } from 'discord.js';
import { InteractionFlag, InteractionPermission } from '../../types/discord.ts';
import {
  isAdminMember,
  isApplicationOwner,
  isInteractionInsideOfGuild,
  isModeratorMember,
  isPolyfrostTeamMember,
  isSupportMember
} from '../../utils/discordUtils.ts';
import type DiscordManager from '../DiscordManager.ts';

class InteractionHandler {
  constructor(private readonly discord: DiscordManager) {}

  async onInteraction(interaction: BaseInteraction) {
    if (interaction.isChatInputCommand()) await this.discord.commandHandler.onCommand(interaction);
    if (interaction.isAutocomplete()) await this.discord.commandHandler.onAutocomplete(interaction);
    if (interaction.isButton()) await this.discord.buttonHandler.onButton(interaction);
    if (interaction.isModalSubmit()) await this.discord.modalHandler.onSubmit(interaction);
    if (interaction.isStringSelectMenu()) await this.discord.stringSelectMenuHandler.onSubmit(interaction);
  }

  async checkPermission(interaction: BaseInteraction, permission: InteractionPermission) {
    const [
      isApplicationOwnerCheck,
      isAdminMemberCheck,
      isPolyfrostTeamMemberCheck,
      isModeratorMemberCheck,
      isSupportMemberCheck
    ] = await Promise.all([
      permission === InteractionPermission.Owner ? isApplicationOwner(interaction.user) : false,
      permission === InteractionPermission.Admin ? isAdminMember(interaction.member) : false,
      permission === InteractionPermission.PolyfrostTeam ? isPolyfrostTeamMember(interaction.member) : false,
      permission === InteractionPermission.Moderator ? isModeratorMember(interaction.member) : false,
      permission === InteractionPermission.Support ? isSupportMember(interaction.member) : false
    ]);

    const checks: Array<[boolean, string]> = [
      [
        permission === InteractionPermission.Owner && !isApplicationOwnerCheck,
        "You don't have permission to use this command. You are required to own the bot."
      ],
      [
        permission === InteractionPermission.Admin && !isAdminMemberCheck,
        "You don't have permission to use this command. You are required to be an admin."
      ],
      [
        permission === InteractionPermission.PolyfrostTeam && !isPolyfrostTeamMemberCheck,
        "You don't have permission to use this command. You are required to be appart of the Polyfrost Team."
      ],
      [
        permission === InteractionPermission.Moderator && !isModeratorMemberCheck,
        "You don't have permission to use this command. You are required to be appart of the Moderation Team."
      ],
      [
        permission === InteractionPermission.Support && !isSupportMemberCheck,
        "You don't have permission to use this command. You are required to be appart of the Support Team."
      ]
    ];

    for (const [failed, message] of checks) if (failed) throw new PolyHelperError(message);
  }

  checkInteractionFlags(interaction: BaseInteraction, flags: InteractionFlag[]) {
    const checks: Array<[boolean, string]> = [
      [
        flags.includes(InteractionFlag.GuildCommand) && !interaction.isChatInputCommand(),
        'This command must be run as a chat input command.'
      ],
      [
        flags.includes(InteractionFlag.GuildCommand) &&
          interaction.isChatInputCommand() &&
          !isInteractionInsideOfGuild(interaction),
        'Please run this command inside of a guild.'
      ],
      [flags.includes(InteractionFlag.GuildButton) && !interaction.isButton(), 'This button must be run as a button.'],
      [
        flags.includes(InteractionFlag.GuildButton) &&
          interaction.isButton() &&
          !isInteractionInsideOfGuild(interaction),
        'Please run this button inside of a guild.'
      ],
      [
        flags.includes(InteractionFlag.GuildModal) && !interaction.isModalSubmit(),
        'This modal must be run as a modal.'
      ],
      [
        flags.includes(InteractionFlag.GuildModal) &&
          interaction.isModalSubmit() &&
          !isInteractionInsideOfGuild(interaction),
        'Please run this modal inside of a guild.'
      ],
      [
        flags.includes(InteractionFlag.GuildStringSelectMenu) && !interaction.isStringSelectMenu(),
        'This string select menu must be run as a string select menu.'
      ],
      [
        flags.includes(InteractionFlag.GuildStringSelectMenu) &&
          interaction.isStringSelectMenu() &&
          !isInteractionInsideOfGuild(interaction),
        'Please run this string select menu inside of a guild.'
      ]
    ];

    for (const [failed, message] of checks) if (failed) throw new PolyHelperError(message);
  }
}

export default InteractionHandler;
