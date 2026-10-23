import assert from 'node:assert';
import { Collection, MessageFlags, StringSelectMenuInteraction } from 'discord.js';
import { InteractionFlag, InteractionResponse } from '../../types/discord.ts';
import { readdir } from 'node:fs/promises';
import { toError } from '../../utils/miscUtils.ts';
import type DiscordManager from '../DiscordManager.ts';
import type DiscordStringSelectMenu from '../private/interactions/DiscordStringSelectMenu.ts';

class StringSelectMenuHandler {
  readonly stringSelectMenus: Collection<string, DiscordStringSelectMenu> = new Collection<
    string,
    DiscordStringSelectMenu
  >();
  constructor(private readonly discord: DiscordManager) {}

  async onSubmit(interaction: StringSelectMenuInteraction) {
    const stringSelectMenu = this.stringSelectMenus.get(interaction.customId.split(':', 1)[0] ?? interaction.customId);
    if (!stringSelectMenu) return;

    try {
      if (stringSelectMenu.metadata.response !== InteractionResponse.None) {
        if (stringSelectMenu.metadata.response === InteractionResponse.Update) {
          await interaction.deferUpdate();
        } else {
          await interaction.deferReply({
            flags:
              stringSelectMenu.metadata.response === InteractionResponse.Ephemeral ? MessageFlags.Ephemeral : undefined
          });
        }
      }
      console.discord(
        `String select men submitted ${interaction.user.username} (${interaction.user.id}) modal ${interaction.customId}`
      );

      this.discord.interactionHandler.checkInteractionFlags(interaction, stringSelectMenu.metadata.flags);
      await this.discord.interactionHandler.checkPermission(interaction, stringSelectMenu.metadata.permission);

      if (stringSelectMenu.metadata.flags.includes(InteractionFlag.GuildStringSelectMenu)) {
        assert(interaction.guild);
        if (stringSelectMenu.metadata.fetchGuildMember) {
          interaction.member = await interaction.guild.members.fetch(interaction.user.id);
        }
      }

      await stringSelectMenu.execute(interaction);
    } catch (error) {
      await this.discord.handleError(toError(error), interaction, [], stringSelectMenu.metadata);
    }
  }

  async loadStringSelectMenus() {
    this.stringSelectMenus.clear();
    const stringSelectMenuFiles = await readdir('./src/discord/stringSelectMenus/', {
      recursive: true,
      encoding: 'utf-8'
    }).then((files) => files.filter((file) => file.endsWith('.ts')));
    for (const file of stringSelectMenuFiles) {
      const stringSelectMenu: DiscordStringSelectMenu = new (await import(`../stringSelectMenus/${file}`)).default(
        this.discord
      );
      stringSelectMenu.metadata.ids.forEach((id) => this.stringSelectMenus.set(id, stringSelectMenu));
    }
    console.discord(`Successfully loaded ${this.stringSelectMenus.size} string select menu(s).`);
  }
}

export default StringSelectMenuHandler;
