import DiscordCommand from '../../../private/interactions/commands/DiscordCommand.ts';
import DiscordCommandMetadata from '../../../private/interactions/commands/DiscordCommandMetadata.ts';
import EmbedHelper from '../../../private/EmbedHelper.ts';
import PolyHelperError from '../../../../private/error.ts';
import { ActionRowBuilder, ButtonBuilder, ChatInputCommandInteraction, Message, PermissionFlagsBits } from 'discord.js';
import {
  InteractionFlag,
  InteractionPermission,
  InteractionResponse,
  type InteractionWithGuild
} from '../../../../types/discord.ts';
import { OpenTicketButton } from '../../../private/ComponentHelper.ts';

class DebugTicketsCommand extends DiscordCommand {
  override readonly metadata: DiscordCommandMetadata = new DiscordCommandMetadata()
    .setName('debug-tickets')
    .addSubcommand((option) => option.setName('refresh-panels-message').setDescription('refresh the panels message'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setFlags(InteractionFlag.GuildCommand)
    .setResponse(InteractionResponse.Ephemeral)
    .setPermission(InteractionPermission.Admin);

  static async updatePanelsMessage(message: Message): Promise<Message> {
    const panels = message.client.discordManager.application.database.getPanels();
    return await message.edit({
      content: '',
      embeds: [
        new EmbedHelper()
          .setTitle(`${message.client.discordManager.guild?.name ?? 'UNKNOWN'} support tickets`)
          .setColor('Blue')
          .setFields(...panels.map((panel) => ({ name: `**${panel.title}**`, value: panel.description })))
      ],
      components: [new ActionRowBuilder<ButtonBuilder>().addComponents(panels.map((panel) => OpenTicketButton(panel)))]
    });
  }

  async executeRefreshPanelsMessage(interaction: InteractionWithGuild<ChatInputCommandInteraction>) {
    const message = await this.discord.application.database.getPanelsMessage();
    await DebugTicketsCommand.updatePanelsMessage(message);
    await interaction.followUp({ content: `Message updated - ${message.url}` });
  }

  override execute(interaction: InteractionWithGuild<ChatInputCommandInteraction>): Promise<any> {
    throw new PolyHelperError('Invalid subcommand found');
  }
}

export default DebugTicketsCommand;
