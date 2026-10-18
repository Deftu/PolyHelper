import PolyHelperError from '../../private/error.ts';
import { type BaseInteraction } from 'discord.js';
import { CommandPermission, InteractionFlags } from '../../types/discord.ts';
import {
  isAdminMember,
  isButtonInteractionInsideOfGuild,
  isChatInputCommandInteractionInsideOfGuild,
  isModalSubmitInteractionInsideOfGuild,
  isModeratorMember,
  isPolyfrostTeamMember,
  isSupportMember
} from '../../utils/discordUtils.ts';
import type BasicInteractionData from '../private/BasicInteractionData.ts';
import type DiscordManager from '../DiscordManager.ts';

class InteractionHandler {
  constructor(private readonly discord: DiscordManager) {}

  onInteraction(interaction: BaseInteraction) {
    if (interaction.isChatInputCommand()) this.discord.commandHandler.onCommand(interaction);
    if (interaction.isAutocomplete()) this.discord.commandHandler.onAutocomplete(interaction);
    if (interaction.isButton()) this.discord.buttonHandler.onButton(interaction);
    if (interaction.isModalSubmit()) this.discord.modalHandler.onSubmit(interaction);
  }

  async checkPerms(interaction: BaseInteraction, data: BasicInteractionData<DiscordManager>) {
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
        data.flags.includes(InteractionFlags.GuildCommand) && !interaction.isChatInputCommand(),
        'This command must be run as a chat input command.'
      ],
      [
        data.flags.includes(InteractionFlags.GuildCommand) &&
          interaction.isChatInputCommand() &&
          !isChatInputCommandInteractionInsideOfGuild(interaction),
        'Please run this command inside of a guild.'
      ],
      [
        data.flags.includes(InteractionFlags.GuildButton) && !interaction.isButton(),
        'This button must be run as a button.'
      ],
      [
        data.flags.includes(InteractionFlags.GuildButton) &&
          interaction.isButton() &&
          !isButtonInteractionInsideOfGuild(interaction),
        'Please run this button inside of a guild.'
      ],
      [
        data.flags.includes(InteractionFlags.GuildModal) && !interaction.isModalSubmit(),
        'This modal must be run as a modal.'
      ],
      [
        data.flags.includes(InteractionFlags.GuildModal) &&
          interaction.isModalSubmit() &&
          !isModalSubmitInteractionInsideOfGuild(interaction),
        'Please run this button inside of a guild.'
      ]
    ];

    for (const [failed, message] of checks) {
      if (failed) throw new PolyHelperError(message);
    }
  }
}

export default InteractionHandler;
