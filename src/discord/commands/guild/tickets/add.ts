import DiscordCommand from '../../../private/commands/DiscordCommand.ts';
import DiscordCommandDataBuilder from '../../../private/commands/DiscordCommandDataBuilder.ts';
import PolyHelperError from '../../../../private/error.ts';
import {
  type ChatInputCommandInteractionWithGuild,
  CommandPermission,
  InteractionFlags
} from '../../../../types/discord.ts';
import { SuccessEmbed } from '../../../private/EmbedHelper.ts';
import { isGuildMember } from '@sapphire/discord.js-utilities';

class AddCommand extends DiscordCommand {
  override readonly data = new DiscordCommandDataBuilder()
    .setName('add')
    .setDescription('Add a user to a ticket')
    .addUserOption((option) =>
      option.setName('user').setDescription('The user you want to add to the ticket').setRequired(true)
    );
  override flags: readonly InteractionFlags[] = [InteractionFlags.GuildCommand];
  override permission: CommandPermission = CommandPermission.Support;

  override async execute(interaction: ChatInputCommandInteractionWithGuild) {
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
