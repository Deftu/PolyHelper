import DiscordCommand from '../../../private/interactions/commands/DiscordCommand.ts';
import DiscordCommandMetadata from '../../../private/interactions/commands/DiscordCommandMetadata.ts';
import EmbedHelper from '../../../private/EmbedHelper.ts';
import PolyHelperError from '../../../../private/error.ts';
import ms, { type StringValue } from 'ms';
import { ActionRowBuilder, ButtonBuilder, ChatInputCommandInteraction } from 'discord.js';
import { CloseRequestButtons } from '../../../private/ComponentHelper.ts';
import { InteractionFlag, InteractionPermission, type InteractionWithGuild } from '../../../../types/discord.ts';
import type { DatabaseCloseRequest } from '../../../../types/database.ts';

class CloseRequestCommand extends DiscordCommand {
  override readonly metadata: DiscordCommandMetadata = new DiscordCommandMetadata()
    .setName('closerequest')
    .setDescription('Request to close a ticket')
    .addStringOption((option) => option.setName('reason').setDescription('The reason for closing the ticket'))
    .addStringOption((option) => option.setName('auto-close').setDescription('The auto close time (e.g. 1d, 72h, 2w)'))
    .removeHidddenOption()
    .setCleanErrorTitle('close request this ticket')
    .setFlags(InteractionFlag.GuildCommand)
    .setPermission(InteractionPermission.Support);

  override async execute(interaction: InteractionWithGuild<ChatInputCommandInteraction>) {
    const ticket = this.getTicket(interaction);
    if (ticket.pinned) throw new PolyHelperError('This ticket is pinned. Please unpin it before closing.');

    const currentCloseRequest = this.discord.application.database.getCloseRequestByTicketId(ticket.id);
    if (currentCloseRequest) {
      const message = await currentCloseRequest.getMessage();
      return await interaction.followUp({
        content: `There is already an active close request for this ticket.\n${message.url}`
      });
    }

    const autoCloseTime = interaction.options.getString('auto-close');
    const autoCloseDuration = autoCloseTime ? ms(autoCloseTime as StringValue) : undefined;
    if (autoCloseTime && (!Number.isFinite(autoCloseDuration) || autoCloseDuration! <= 0)) {
      throw new PolyHelperError('The auto-close time must be a valid duration greater than zero.');
    }
    const autoClose: DatabaseCloseRequest['autoClose'] = autoCloseDuration ? Date.now() + autoCloseDuration : null;

    const ticketOwner = await ticket.getDiscord();
    const reason = interaction.options.getString('reason') ?? 'No reason provided';

    const embed = new EmbedHelper()
      .setTitle('Close Request')
      .setDescription(`<@${interaction.user.id}> has requested to close the ticket.`)
      .setFields({ name: 'Reason', value: reason, format: 'Block' });

    if (autoClose !== null) {
      embed.addFields({ name: 'Automatically closes at', value: Math.floor(autoClose / 1000), format: 'Timestamp' });
    }

    embed.addFields({ name: '_ _', value: 'Please accept or deny using the buttons below.' });

    const id = crypto.randomUUID();

    const message = await interaction.followUp({
      content: `Hey <@${ticketOwner.user.id}>`,
      embeds: [embed],
      components: [new ActionRowBuilder<ButtonBuilder>().addComponents(CloseRequestButtons(id))]
    });
    this.discord.application.database.insertCloseRequest({
      id,
      ticketId: ticket.id,
      messageId: message.id,
      reason,
      closer: interaction.user.id,
      autoClose
    });
  }
}

export default CloseRequestCommand;
