import BasicInteractionHandler from '../private/BasicInteractionHandler.ts';
import { InteractionResponse } from '../../types/discord.ts';
import { MessageFlags, StringSelectMenuInteraction } from 'discord.js';
import { readdir } from 'node:fs/promises';
import type DiscordStringSelectMenu from '../private/interactions/DiscordStringSelectMenu.ts';

class StringSelectMenuHandler extends BasicInteractionHandler<StringSelectMenuInteraction, DiscordStringSelectMenu> {
  override getRawIdFromInteraction(interaction: StringSelectMenuInteraction) {
    return interaction.customId;
  }

  override getIdFromInteraction(interaction: StringSelectMenuInteraction) {
    return interaction.customId.split(':', 1)[0] ?? interaction.customId;
  }

  override async handleResponse(interaction: StringSelectMenuInteraction, element: DiscordStringSelectMenu) {
    if (element.metadata.response === InteractionResponse.None) return;
    if (element.metadata.response === InteractionResponse.Update) return await interaction.deferUpdate();
    await interaction.deferReply({
      flags: element.metadata.response === InteractionResponse.Ephemeral ? MessageFlags.Ephemeral : undefined
    });
  }

  async loadElements() {
    this.elements.clear();
    const stringSelectMenuFiles = await readdir('./src/discord/stringSelectMenus/', {
      recursive: true,
      encoding: 'utf-8'
    }).then((files) => files.filter((file) => file.endsWith('.ts')));
    for (const file of stringSelectMenuFiles) {
      const stringSelectMenu: DiscordStringSelectMenu = new (await import(`../stringSelectMenus/${file}`)).default(
        this.discord
      );
      stringSelectMenu.metadata.ids.forEach((id) => this.elements.set(id, stringSelectMenu));
    }
    console.discord(`Successfully loaded ${this.elements.size} string select menu(s).`);
  }
}

export default StringSelectMenuHandler;
