import DiscordCommand from '../../../private/interactions/commands/DiscordCommand.ts';
import DiscordCommandMetadata from '../../../private/interactions/commands/DiscordCommandMetadata.ts';
import EmbedHelper from '../../../private/EmbedHelper.ts';
import PolyHelperError from '../../../../private/error.ts';
import {
  ActionRowBuilder,
  type AutocompleteInteraction,
  type ChatInputCommandInteraction,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder
} from 'discord.js';
import {
  type AutocompleteOption,
  CommandPermission,
  type EmbedHelperField,
  InteractionFlags,
  type InteractionWithGuild
} from '../../../../types/discord.ts';
import { titleCase } from '../../../../utils/stringUtils.ts';

class TicketsCommand extends DiscordCommand {
  override readonly metadata: DiscordCommandMetadata = new DiscordCommandMetadata()
    .setName('tickets')
    .addSubcommand((option) =>
      option
        .setName('view')
        .setDescription('View information for a ticket')
        .addStringOption((option) =>
          option.setName('ticket-id').setDescription('The ticket id').setAutocomplete(true).setRequired(true)
        )
    )
    .addSubcommand((option) =>
      option
        .setName('search')
        .setDescription('Search Tickets')
        .addStringOption((option) =>
          option.setName('panel-id').setDescription('Search tickets by panel id').setAutocomplete(true)
        )
        .addUserOption((option) => option.setName('opener').setDescription('The person who opened the ticket'))
        .addBooleanOption((option) => option.setName('pinned').setDescription('Is the ticket currently pinned'))
        .addBooleanOption((option) => option.setName('unpinned').setDescription('Is the ticket currently unpinned'))
        .addBooleanOption((option) => option.setName('closed').setDescription('Is the ticket currently closed'))
        .addBooleanOption((option) => option.setName('open').setDescription('Is the ticket currently open'))
    )
    .removeHidddenOption();
  override flags: readonly InteractionFlags[] = [InteractionFlags.GuildCommand];
  override permission: CommandPermission = CommandPermission.Support;

  // eslint-disable-next-line require-await
  override async autocomplete(interaction: AutocompleteInteraction): Promise<AutocompleteOption[]> {
    const focusedOption = interaction.options.getFocused(true);

    switch (focusedOption.name) {
      case 'ticket-id':
        return this.discord.application.database.getTicketIds().map((name) => ({ name }));
      case 'panel-id':
        return this.discord.application.database.getPanels().map((panel) => ({ name: panel.name, value: panel.id }));
      default:
        return [{ name: 'No perm' }];
    }
  }

  async executeView(interaction: InteractionWithGuild<ChatInputCommandInteraction>) {
    const ticketId = interaction.options.getString('ticket-id', true);
    const ticket = this.discord.application.database.getTicket(ticketId);
    if (!ticket) throw new PolyHelperError('Could not find the matching ticket?');
    await interaction.followUp(await ticket.getMessageData());
  }

  async executeSearch(interaction: InteractionWithGuild<ChatInputCommandInteraction>) {
    const panelId = interaction.options.getString('panel-id');
    const opener = interaction.options.getUser('opener');
    const pinned = interaction.options.getBoolean('pinned');
    const unpinned = interaction.options.getBoolean('unpinned');
    const closed = interaction.options.getBoolean('closed');
    const open = interaction.options.getBoolean('open');

    if (pinned !== null && unpinned !== null && pinned === unpinned) {
      throw new PolyHelperError('The pinned and unpinned filters conflict with each other');
    }
    if (closed !== null && open !== null && closed === open) {
      throw new PolyHelperError('The closed and open filters conflict with each other');
    }

    const tickets = this.discord.application.database.searchTickets({
      panelId: panelId ?? undefined,
      owner: opener?.id,
      pinned: pinned ?? (unpinned === null ? undefined : !unpinned),
      closed: closed === null ? (open === null ? undefined : open ? 0 : 1) : closed ? 1 : 0,
      limit: 25
    });

    const embed = new EmbedHelper()
      .setTitle('Ticket Search')
      .setDescription(`Found **${tickets.length} ticket(s)** with the following filter(s)`)
      .addFields(
        ['pinned', 'unpinned', 'closed', 'open']
          .map((option) => ({ name: titleCase(option), value: interaction.options.getBoolean(option) }))
          .filter((field): field is { name: string; value: boolean } => field.value !== null)
          .map(({ name, value }): EmbedHelperField => ({ name, value, format: 'Boolean' }))
      );

    if (panelId) embed.addFields({ name: 'Panel Id', value: panelId, format: 'Block' });
    if (opener) embed.addFields({ name: 'Opener', value: `<@${opener.id}> (${opener.id})` });

    await interaction.followUp({
      embeds: [embed.setFields(embed.fields.map((field) => ({ ...field, inline: true })))],
      components: [
        new ActionRowBuilder<StringSelectMenuBuilder>().setComponents(
          new StringSelectMenuBuilder()
            .setCustomId(`ticketsSearch:${interaction.user.id}`)
            .setPlaceholder(tickets.length === 0 ? 'No tickets found' : 'Select a ticket to view more')
            .setDisabled(tickets.length === 0)
            .setOptions(
              tickets.length === 0
                ? [new StringSelectMenuOptionBuilder().setLabel('No tickets found').setValue('nothing')]
                : tickets.map(({ id }) => new StringSelectMenuOptionBuilder().setLabel(id).setValue(id))
            )
        )
      ]
    });
  }

  override execute(interaction: ChatInputCommandInteraction): Promise<any> {
    throw new PolyHelperError('Invalid subcommand found');
  }
}

export default TicketsCommand;
