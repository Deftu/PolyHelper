import DiscordCommand from '../../../private/commands/DiscordCommand.ts';
import DiscordCommandDataBuilder from '../../../private/commands/DiscordCommandDataBuilder.ts';
import EmbedHelper from '../../../private/EmbedHelper.ts';
import PolyHelperError from '../../../../private/error.ts';
import {
  ActionRowBuilder,
  AutocompleteInteraction,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  MessageFlags,
  PermissionFlagsBits
} from 'discord.js';
import {
  type AutocompleteOption,
  BasicInteractionResponse,
  type ChatInputCommandInteractionWithGuild,
  InteractionFlags
} from '../../../../types/discord.ts';
import { BasicPanelModal } from '../../../private/ComponentHelper.ts';

class TicketPanelsCommand extends DiscordCommand {
  override readonly data = new DiscordCommandDataBuilder()
    .setName('ticket-panels')
    .addSubcommand((option) => option.setName('refresh').setDescription('refresh the panels message'))
    .addSubcommand((option) => option.setName('add').setDescription('add a panel'))
    .addSubcommand((option) =>
      option
        .setName('edit')
        .setDescription('edit a panel')
        .addStringOption((option) =>
          option.setName('panel-id').setDescription('the panel id').setRequired(true).setAutocomplete(true)
        )
    )
    .addSubcommand((option) =>
      option
        .setName('remove')
        .setDescription('remove a panel')
        .addStringOption((option) =>
          option.setName('panel-id').setDescription('the panel id').setRequired(true).setAutocomplete(true)
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .removeHidddenOption();
  override flags: readonly InteractionFlags[] = [InteractionFlags.GuildCommand];
  override response: BasicInteractionResponse = BasicInteractionResponse.None;
  override fetchGuildMember: boolean = false;

  // eslint-disable-next-line require-await
  override async autocomplete(interaction: AutocompleteInteraction): Promise<AutocompleteOption[]> {
    return this.discord.application.database.getPanels().map((panel) => ({ name: panel.name, value: panel.id }));
  }

  async executeRefresh(interaction: ChatInputCommandInteractionWithGuild) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const message = await this.discord.application.tickets.updatePanelsMessage();
    await interaction.followUp({ content: `Message updated - ${message.url}` });
  }

  async executeAdd(interaction: ChatInputCommandInteractionWithGuild) {
    await interaction.showModal(BasicPanelModal().setCustomId('panelAdd').setTitle('Add a new panel'));
  }

  async executeEdit(interaction: ChatInputCommandInteractionWithGuild) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const id = interaction.options.getString('panel-id', true);
    const panel = this.discord.application.database.getPanel(id);
    if (!panel) return await interaction.followUp({ content: "This panel doesn't exist" });
    await interaction.followUp({
      embeds: [new EmbedHelper().setTitle(`Editing panel ${panel.name}`)],
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(`panelEdit:${id}:basic`)
            .setStyle(ButtonStyle.Secondary)
            .setLabel('Edit Basic Options'),
          new ButtonBuilder()
            .setCustomId(`panelEdit:${id}:misc`)
            .setStyle(ButtonStyle.Secondary)
            .setLabel('Edit Misc Options')
        )
      ]
    });
  }

  async executeRemove(interaction: ChatInputCommandInteractionWithGuild) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const id = interaction.options.getString('panel-id', true);
    await this.discord.application.database.deletePanel(id);
    await interaction.followUp({ content: 'Panel deleted' });
  }

  override execute(interaction: ChatInputCommandInteraction): Promise<any> {
    throw new PolyHelperError('Invalid subcommand found');
  }
}

export default TicketPanelsCommand;
