import DiscordCommand from '../../../private/interactions/commands/DiscordCommand.ts';
import DiscordCommandMetadata from '../../../private/interactions/commands/DiscordCommandMetadata.ts';
import { InteractionFlag, InteractionPermission, type InteractionWithGuild } from '../../../../types/discord.ts';
import { SuccessEmbed } from '../../../private/EmbedHelper.ts';
import { hasRole } from '../../../../utils/discordUtils.ts';
import type { ChatInputCommandInteraction } from 'discord.js';

class ToggleTicketPingCommand extends DiscordCommand {
  override readonly metadata: DiscordCommandMetadata = new DiscordCommandMetadata()
    .setName('toggle-ticket-ping')
    .setDescription('Toggle mentions for new support tickets.')
    .setFlags(InteractionFlag.RequiresGuild)
    .setPermission(InteractionPermission.Support);

  override async execute(interaction: InteractionWithGuild<ChatInputCommandInteraction>) {
    const has = await hasRole(interaction.member, this.discord.application.config.discord.roles.ticketPing);
    if (has) await interaction.member.roles.remove(this.discord.application.config.discord.roles.ticketPing);
    else await interaction.member.roles.add(this.discord.application.config.discord.roles.ticketPing);

    await interaction.followUp({
      embeds: [
        new SuccessEmbed().setDescription(
          has
            ? 'You will **no longer be mentioned** when new support tickets are opened.'
            : 'You will **now be mentioned** when new support tickets are opened.'
        )
      ]
    });
  }
}

export default ToggleTicketPingCommand;
