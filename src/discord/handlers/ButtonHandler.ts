import BasicInteractionHandler from '../private/BasicInteractionHandler.ts';
import { type ButtonInteraction, MessageFlags } from 'discord.js';
import { InteractionResponse } from '../../types/discord.ts';
import { readdir } from 'node:fs/promises';
import type DiscordButton from '../private/interactions/DiscordButton.ts';

class ButtonHandler extends BasicInteractionHandler<ButtonInteraction, DiscordButton> {
  override getRawIdFromInteraction(interaction: ButtonInteraction) {
    return interaction.customId;
  }

  override getIdFromInteraction(interaction: ButtonInteraction) {
    return interaction.customId.split(':', 1)[0] ?? interaction.customId;
  }

  override async handleResponse(interaction: ButtonInteraction, element: DiscordButton) {
    if (element.metadata.response === InteractionResponse.None) return;
    if (element.metadata.response === InteractionResponse.Update) return await interaction.deferUpdate();
    await interaction.deferReply({
      flags: element.metadata.response === InteractionResponse.Ephemeral ? MessageFlags.Ephemeral : undefined
    });
  }

  override async loadElements() {
    this.elements.clear();
    const buttonFiles = await readdir('./src/discord/buttons/', { recursive: true, encoding: 'utf-8' }).then((files) =>
      files.filter((file) => file.endsWith('.ts'))
    );
    for (const file of buttonFiles) {
      const button: DiscordButton = new (await import(`../buttons/${file}`)).default(this.discord);
      button.metadata.ids.forEach((id) => this.elements.set(id, button));
    }
    console.discord(`Successfully loaded ${this.elements.size} button(s).`);
  }
}

export default ButtonHandler;
