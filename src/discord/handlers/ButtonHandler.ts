import assert from 'node:assert';
import { type ButtonInteraction, Collection, MessageFlags } from 'discord.js';
import { InteractionFlag, InteractionResponse } from '../../types/discord.ts';
import { readdir } from 'node:fs/promises';
import { toError } from '../../utils/miscUtils.ts';
import type DiscordButton from '../private/interactions/DiscordButton.ts';
import type DiscordManager from '../DiscordManager.ts';

class ButtonHandler {
  readonly buttons: Collection<string, DiscordButton> = new Collection<string, DiscordButton>();
  constructor(private readonly discord: DiscordManager) {}

  async onButton(interaction: ButtonInteraction) {
    const button = this.buttons.get(interaction.customId.split(':', 1)[0] ?? interaction.customId);
    if (!button) return;

    try {
      if (button.metadata.response !== InteractionResponse.None) {
        if (button.metadata.response === InteractionResponse.Update) {
          await interaction.deferUpdate();
        } else {
          await interaction.deferReply({
            flags: button.metadata.response === InteractionResponse.Ephemeral ? MessageFlags.Ephemeral : undefined
          });
        }
      }
      console.discord(
        `Button Clicked ${interaction.user.username} (${interaction.user.id}) button ${interaction.customId}`
      );

      this.discord.interactionHandler.checkInteractionFlags(interaction, button.metadata.flags);
      await this.discord.interactionHandler.checkPermission(interaction, button.metadata.permission);

      if (button.metadata.flags.includes(InteractionFlag.GuildButton)) {
        assert(interaction.guild);
        if (button.metadata.fetchGuildMember) {
          interaction.member = await interaction.guild.members.fetch(interaction.user.id);
        }
      }

      await button.execute(interaction);
    } catch (error) {
      await this.discord.handleError(toError(error), interaction, [], button.metadata);
    }
  }

  async loadButtons() {
    this.buttons.clear();
    const buttonFiles = await readdir('./src/discord/buttons/', { recursive: true, encoding: 'utf-8' }).then((files) =>
      files.filter((file) => file.endsWith('.ts'))
    );
    for (const file of buttonFiles) {
      const button: DiscordButton = new (await import(`../buttons/${file}`)).default(this.discord);
      button.metadata.ids.forEach((id) => this.buttons.set(id, button));
    }
    console.discord(`Successfully loaded ${this.buttons.size} button(s).`);
  }
}

export default ButtonHandler;
