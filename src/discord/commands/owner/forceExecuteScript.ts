import DiscordCommand from '../../private/interactions/commands/DiscordCommand.ts';
import DiscordCommandMetadata from '../../private/interactions/commands/DiscordCommandMetadata.ts';
import EmbedHelper, { SuccessEmbed } from '../../private/EmbedHelper.ts';
import PolyHelperError from '../../../private/error.ts';
import prettyMilliseconds from 'pretty-ms';
import { AutocompleteInteraction, type ChatInputCommandInteraction } from 'discord.js';
import { type AutocompleteOption, InteractionPermission } from '../../../types/discord.ts';
import { titleCaseFromCamel } from '../../../utils/stringUtils.ts';

class ForceExecuteScriptCommand extends DiscordCommand {
  override readonly metadata: DiscordCommandMetadata = new DiscordCommandMetadata()
    .setName('force-execute-script')
    .setDescription('Allows executing scripts')
    .addStringOption((option) =>
      option.setName('script-name').setDescription('Script Name').setRequired(true).setAutocomplete(true)
    )
    .setPermission(InteractionPermission.Owner);

  // eslint-disable-next-line require-await
  override async autocomplete(interaction: AutocompleteInteraction): Promise<AutocompleteOption[]> {
    return this.discord.application.scripts.scripts
      .map(({ id }) => ({ value: id, name: titleCaseFromCamel(id) }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  override async execute(interaction: ChatInputCommandInteraction) {
    const scriptName = interaction.options.getString('script-name', true);
    const script = this.discord.application.scripts.getScript(scriptName);
    if (!script) throw new PolyHelperError('Could not find that script?');
    await interaction.followUp({ embeds: [new EmbedHelper().setDescription(`Executing \`${script.id}\` script`)] });
    const duration = await script.runNow();
    await interaction.followUp({
      embeds: [
        new SuccessEmbed()
          .setDescription(`Finished executing \`${script.id}\` script`)
          .addFields({ name: 'Duration', value: `${duration.toFixed(2)}ms (${prettyMilliseconds(duration)})` })
      ]
    });
  }
}

export default ForceExecuteScriptCommand;
