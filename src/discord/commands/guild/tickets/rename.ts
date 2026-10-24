import DiscordCommand from '../../../private/interactions/commands/DiscordCommand.ts';
import DiscordCommandMetadata from '../../../private/interactions/commands/DiscordCommandMetadata.ts';
import EmbedHelper from '../../../private/EmbedHelper.ts';
import { InteractionFlag, InteractionPermission, type InteractionWithGuild } from '../../../../types/discord.ts';
import type { ChatInputCommandInteraction } from 'discord.js';

class RenameCommand extends DiscordCommand {
  override readonly metadata: DiscordCommandMetadata = new DiscordCommandMetadata()
    .setName('rename')
    .setDescription('Rename a ticket')
    .addStringOption((option) =>
      option.setName('name').setDescription('Supported variables - {username} {id} {panelName} {cleanPanelName}')
    )
    .setCleanErrorTitle('renaming this ticket')
    .setFlags(InteractionFlag.RequiresGuild)
    .setPermission(InteractionPermission.Support);

  override async execute(interaction: InteractionWithGuild<ChatInputCommandInteraction>) {
    await this.getTicket(interaction).rename(interaction.options.getString('name') ?? undefined);
    await interaction.followUp({
      embeds: [
        new EmbedHelper()
          .setTitle('Ticket Renammed')
          .setDescription(`This ticket has been renammed by <@${interaction.user.id}>`)
      ]
    });
  }
}

export default RenameCommand;
