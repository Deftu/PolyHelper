import DiscordCommand from '../../../private/interactions/commands/DiscordCommand.ts';
import DiscordCommandMetadata from '../../../private/interactions/commands/DiscordCommandMetadata.ts';
import PolyHelperError from '../../../../private/error.ts';
import { CommandPermission, InteractionFlags, type InteractionWithGuild } from '../../../../types/discord.ts';
import { SuccessEmbed } from '../../../private/EmbedHelper.ts';
import { isGuildMember } from '@sapphire/discord.js-utilities';
import type { ChatInputCommandInteraction } from 'discord.js';

class AddCommand extends DiscordCommand {
  override readonly metadata: DiscordCommandMetadata = new DiscordCommandMetadata()
    .setName('add')
    .setDescription('Add a user to a ticket')
    .addUserOption((option) =>
      option.setName('user').setDescription('The user you want to add to the ticket').setRequired(true)
    )
    .setCleanErrorName('add this user to the ticket');
  override flags: readonly InteractionFlags[] = [InteractionFlags.GuildCommand];
  override permission: CommandPermission = CommandPermission.Support;

  override async execute(interaction: InteractionWithGuild<ChatInputCommandInteraction>) {
    const member = interaction.options.getMember('user');
    if (!isGuildMember(member)) throw new PolyHelperError('Could not find that user');
    const ticket = this.discord.application.database.getTicketByThreadId(interaction.channel.id);
    if (!ticket) throw new PolyHelperError('This is not a ticket. Please run this command inside of a ticket');
    const thread = await ticket.getThread();
    await thread.members.add(member);
    await interaction.followUp({
      embeds: [new SuccessEmbed().setDescription(`Added <@${member.user.id}> to the ticket`)]
    });
  }
}

export default AddCommand;
