import DiscordCommand from '../../../private/interactions/commands/DiscordCommand.ts';
import DiscordCommandMetadata from '../../../private/interactions/commands/DiscordCommandMetadata.ts';
import EmbedHelper from '../../../private/EmbedHelper.ts';
import PolyHelperError from '../../../../private/error.ts';
import { ActionRowBuilder, ButtonBuilder, ChatInputCommandInteraction, Message, PermissionFlagsBits } from 'discord.js';
import {
  BasicInteractionResponse,
  InteractionFlags,
  InteractionPermission,
  type InteractionWithGuild
} from '../../../../types/discord.ts';
import { OpenTicketButton } from '../../../private/ComponentHelper.ts';

class DebugTicketsCommand extends DiscordCommand {
  override readonly metadata: DiscordCommandMetadata = new DiscordCommandMetadata()
    .setName('debug-tickets')
    .addSubcommand((option) =>
      option.setName('refresh-names').setDescription('refresh the thread name of every open ticket')
    )
    .addSubcommand((option) =>
      option.setName('refresh-name').setDescription('refresh the thread name of the current ticket')
    )
    .addSubcommand((option) => option.setName('refresh-panels-message').setDescription('refresh the panels message'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .removeHidddenOption();
  override flags: readonly InteractionFlags[] = [InteractionFlags.GuildCommand];
  override response: BasicInteractionResponse = BasicInteractionResponse.Ephemeral;
  override permission: InteractionPermission = InteractionPermission.Admin;

  async executeRefreshNames(interaction: InteractionWithGuild<ChatInputCommandInteraction>) {
    const tickets = this.discord.application.database.getTickets({ closed: 1 });
    await interaction.followUp({ content: `refreshing the thread name of ${tickets.length} ticket(s)` });
    for (const ticket of tickets) await ticket.updateThreadName();
  }

  async executeRefreshName(interaction: InteractionWithGuild<ChatInputCommandInteraction>) {
    const ticket = this.discord.application.database.getTicketByThreadId(interaction.channel.id);
    if (!ticket) throw new PolyHelperError('This is not a ticket. Please run this command inside of a ticket');
    await interaction.followUp({ content: 'refreshing the thread name of this ticket' });
    await ticket.updateThreadName();
  }

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
