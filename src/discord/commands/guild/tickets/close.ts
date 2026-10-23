import DiscordCommand from '../../../private/interactions/commands/DiscordCommand.ts';
import DiscordCommandMetadata from '../../../private/interactions/commands/DiscordCommandMetadata.ts';
import {
  InteractionFlag,
  InteractionPermission,
  InteractionResponse,
  type InteractionWithGuild
} from '../../../../types/discord.ts';
import type { ChatInputCommandInteraction } from 'discord.js';

class CloseCommand extends DiscordCommand {
  override readonly metadata: DiscordCommandMetadata = new DiscordCommandMetadata()
    .setName('close')
    .setDescription('Close a ticket')
    .addStringOption((option) => option.setName('reason').setDescription('The reason for closing the ticket'))
    .setCleanErrorTitle('close ticket')
    .setFlags(InteractionFlag.GuildCommand)
    .setResponse(InteractionResponse.Ephemeral)
    .setPermission(InteractionPermission.Support);

  override async execute(interaction: InteractionWithGuild<ChatInputCommandInteraction>) {
    const reason = interaction.options.getString('reason') || 'No reason provided';
    await interaction.followUp({ content: 'Attempting to close this ticket...' });
    await this.getTicket(interaction).close({ reason, runner: interaction.user.id });
  }
}

export default CloseCommand;
