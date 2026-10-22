import PolyHelperError from '../../private/error.ts';
import { type BaseInteraction } from 'discord.js';
import { CommandPermission, InteractionFlags } from '../../types/discord.ts';
import {
  isAdminMember,
  isInteractionInsideOfGuild,
  isModeratorMember,
  isPolyfrostTeamMember,
  isSupportMember
} from '../../utils/discordUtils.ts';
import type BasicInteractionData from '../private/interactions/basic/BasicInteractionData.ts';
import type DiscordManager from '../DiscordManager.ts';

class InteractionHandler {
  constructor(private readonly discord: DiscordManager) {}

  onInteraction(interaction: BaseInteraction) {
    if (interaction.isChatInputCommand()) this.discord.commandHandler.onCommand(interaction);
    if (interaction.isAutocomplete()) this.discord.commandHandler.onAutocomplete(interaction);
    if (interaction.isButton()) this.discord.buttonHandler.onButton(interaction);
    if (interaction.isModalSubmit()) this.discord.modalHandler.onSubmit(interaction);
    if (interaction.isStringSelectMenu()) this.discord.stringSelectMenuHandler.onSubmit(interaction);
  }

  async checkPermission<Metadata extends object, Manager extends DiscordManager = DiscordManager>(
    interaction: BaseInteraction,
    data: BasicInteractionData<Manager, Metadata>,
    skipInteractionFlags: boolean = false
  ) {
    const [isAdminMemberCheck, isPolyfrostTeamMemberCheck, isModeratorMemberCheck, isSupportMemberCheck] =
      await Promise.all([
        data.permission === CommandPermission.Admin ? isAdminMember(interaction.member) : false,
        data.permission === CommandPermission.PolyfrostTeam ? isPolyfrostTeamMember(interaction.member) : false,
        data.permission === CommandPermission.Moderator ? isModeratorMember(interaction.member) : false,
        data.permission === CommandPermission.Support ? isSupportMember(interaction.member) : false
      ]);

    const checks: Array<[boolean, string]> = [
      [
        data.permission === CommandPermission.Admin && !isAdminMemberCheck,
        "You don't have permission to use this command. You are required to be an admin."
      ],
      [
        data.permission === CommandPermission.PolyfrostTeam && !isPolyfrostTeamMemberCheck,
        "You don't have permission to use this command. You are required to be appart of the Polyfrost Team."
      ],
      [
        data.permission === CommandPermission.Moderator && !isModeratorMemberCheck,
        "You don't have permission to use this command. You are required to be appart of the Moderation Team."
      ],
      [
        data.permission === CommandPermission.Support && !isSupportMemberCheck,
        "You don't have permission to use this command. You are required to be appart of the Support Team."
      ],
      [
        !skipInteractionFlags &&
          data.flags.includes(InteractionFlags.GuildCommand) &&
          !interaction.isChatInputCommand(),
        'This command must be run as a chat input command.'
      ],
      [
        !skipInteractionFlags &&
          data.flags.includes(InteractionFlags.GuildCommand) &&
          interaction.isChatInputCommand() &&
          !isInteractionInsideOfGuild(interaction),
        'Please run this command inside of a guild.'
      ],
      [
        !skipInteractionFlags && data.flags.includes(InteractionFlags.GuildButton) && !interaction.isButton(),
        'This button must be run as a button.'
      ],
      [
        !skipInteractionFlags &&
          data.flags.includes(InteractionFlags.GuildButton) &&
          interaction.isButton() &&
          !isInteractionInsideOfGuild(interaction),
        'Please run this button inside of a guild.'
      ],
      [
        !skipInteractionFlags && data.flags.includes(InteractionFlags.GuildModal) && !interaction.isModalSubmit(),
        'This modal must be run as a modal.'
      ],
      [
        !skipInteractionFlags &&
          data.flags.includes(InteractionFlags.GuildModal) &&
          interaction.isModalSubmit() &&
          !isInteractionInsideOfGuild(interaction),
        'Please run this modal inside of a guild.'
      ],
      [
        !skipInteractionFlags &&
          data.flags.includes(InteractionFlags.GuildStringSelectMenu) &&
          !interaction.isStringSelectMenu(),
        'This string select menu must be run as a string select menu.'
      ],
      [
        !skipInteractionFlags &&
          data.flags.includes(InteractionFlags.GuildStringSelectMenu) &&
          interaction.isStringSelectMenu() &&
          !isInteractionInsideOfGuild(interaction),
        'Please run this string select menu inside of a guild.'
      ]
    ];

    for (const [failed, message] of checks) {
      if (failed) throw new PolyHelperError(message);
    }
  }
}

export default InteractionHandler;
