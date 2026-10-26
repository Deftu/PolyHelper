import DiscordCommand from '../../../private/interactions/commands/DiscordCommand.ts';
import DiscordCommandMetadata from '../../../private/interactions/commands/DiscordCommandMetadata.ts';
import PolyHelperError from '../../../../private/error.ts';
import ms, { type StringValue } from 'ms';
import { ChatInputCommandInteraction } from 'discord.js';
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
    .setFlags(InteractionFlag.RequiresGuild)
    .setPermission(InteractionPermission.Support);

  override async execute(interaction: InteractionWithGuild<ChatInputCommandInteraction>) {
    await interaction.followUp({ content: 'Attempting to close request this ticket...' });

    const autoCloseTime = interaction.options.getString('auto-close');
    const autoCloseDuration = autoCloseTime ? ms(autoCloseTime as StringValue) : undefined;
    if (autoCloseTime && (!Number.isFinite(autoCloseDuration) || autoCloseDuration! <= 0)) {
      throw new PolyHelperError('The auto-close time must be a valid duration greater than zero.');
    }
    const autoClose: DatabaseCloseRequest['autoClose'] = autoCloseDuration ? Date.now() + autoCloseDuration : null;

    await this.getTicket(interaction).closeRequest({
      reason: this.getReason(interaction),
      runner: interaction.user.id,
      autoClose
    });
  }
}

export default CloseRequestCommand;
