import DiscordCommand from '../../../private/interactions/commands/DiscordCommand.ts';
import DiscordCommandMetadata from '../../../private/interactions/commands/DiscordCommandMetadata.ts';
import PolyHelperError from '../../../../private/error.ts';
import { InteractionFlag, InteractionPermission, type InteractionWithGuild } from '../../../../types/discord.ts';
import { SuccessEmbed } from '../../../private/EmbedHelper.ts';
import { isGuildMember } from '@sapphire/discord.js-utilities';
import { isSupportMember } from '../../../../utils/discordUtils.ts';
import type { ChatInputCommandInteraction } from 'discord.js';

class RemoveCommand extends DiscordCommand {
  override readonly metadata: DiscordCommandMetadata = new DiscordCommandMetadata()
    .setName('remove')
    .setDescription('Remove a user from a ticket')
    .addUserOption((option) =>
      option.setName('user').setDescription('The user you want to remove from the ticket').setRequired(true)
    )
    .setCleanErrorTitle('remove this user to the ticket')
    .setFlags(InteractionFlag.GuildCommand)
    .setPermission(InteractionPermission.Support);

  override async execute(interaction: InteractionWithGuild<ChatInputCommandInteraction>) {
    const member = interaction.options.getMember('user');
    if (!isGuildMember(member)) throw new PolyHelperError('Could not find that user');
    const ticket = this.getTicket(interaction);
    if (ticket.owner === member.user.id) {
      throw new PolyHelperError('You cannot remove the ticket owner from the ticket');
    }
    const isSupportTeam = await isSupportMember(member);
    if (isSupportTeam) throw new PolyHelperError('You cannot remove a support member from a ticket');
    const thread = await ticket.getThread();
    await thread.members.remove(member);
    await interaction.followUp({
      embeds: [new SuccessEmbed().setDescription(`Removed <@${member.user.id}> from the ticket`)]
    });
  }
}

export default RemoveCommand;
