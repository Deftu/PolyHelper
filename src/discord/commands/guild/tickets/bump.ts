import DiscordCommand from '../../../private/commands/DiscordCommand.ts';
import DiscordCommandDataBuilder from '../../../private/commands/DiscordCommandDataBuilder.ts';
import EmbedHelper from '../../../private/EmbedHelper.ts';
import PolyHelperError from '../../../../private/error.ts';
import {
  type ChatInputCommandInteractionWithGuild,
  CommandPermission,
  InteractionFlags
} from '../../../../types/discord.ts';

class BumpCommand extends DiscordCommand {
  override readonly data = new DiscordCommandDataBuilder()
    .setName('bump')
    .setDescription('Bumps a ticket to encourage closing')
    .setCleanErrorName('bump this ticket');
  override flags: readonly InteractionFlags[] = [InteractionFlags.GuildCommand];
  override permission: CommandPermission = CommandPermission.Support;

  override async execute(interaction: ChatInputCommandInteractionWithGuild) {
    const ticket = this.discord.application.database.getTicketByThreadId(interaction.channel.id);
    if (!ticket) throw new PolyHelperError('This is not a ticket. Please run this command inside of a ticket');
    if (ticket.pinned) throw new PolyHelperError('This ticket is pinned. Please unpin it before bumping');
    await interaction.followUp({
      content: `Hey <@${ticket.owner}>:`,
      embeds: [
        new EmbedHelper()
          .setColor('Yellow')
          .setTitle('Do you still need help?')
          .setFields(
            {
              name: '> Yes, I still need help!',
              value: '__Restate your problem clearly.__ If someone asked you to upload something, do that.'
            },
            { name: '> No, all my problems are solved.', value: '__Let us know__ so we can close the ticket.' }
          )
      ],
      allowedMentions: { users: [ticket.owner] }
    });
  }
}

export default BumpCommand;
