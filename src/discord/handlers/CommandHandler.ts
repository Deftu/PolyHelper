import assert from 'node:assert';
import {
  ApplicationIntegrationType,
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  Collection,
  InteractionContextType,
  MessageFlags,
  REST,
  Routes
} from 'discord.js';
import { BasicInteractionResponse, InteractionFlags } from '../../types/discord.ts';
import { readdir } from 'node:fs/promises';
import { toCamelCase, upperFirst } from '../../utils/stringUtils.ts';
import { toError } from '../../utils/miscUtils.ts';
import type DiscordCommand from '../private/commands/DiscordCommand.ts';
import type DiscordManager from '../DiscordManager.ts';

class CommandHandler {
  readonly commands: Collection<string, DiscordCommand> = new Collection<string, DiscordCommand>();
  constructor(private readonly discord: DiscordManager) {}

  async onCommand(interaction: ChatInputCommandInteraction) {
    const command = this.commands.get(interaction.commandName);
    if (!command) return;

    try {
      if (command.response !== BasicInteractionResponse.None) {
        await interaction.deferReply({
          flags:
            (interaction.options.getBoolean('hidden-response') ??
            command.response === BasicInteractionResponse.Ephemeral)
              ? MessageFlags.Ephemeral
              : undefined
        });
      }
      console.discord(
        `Interaction Event trigged by ${interaction.user.username} (${interaction.user.id}) ran command ${interaction.commandName}`
      );

      await this.discord.interactionHandler.checkPerms(interaction, command);

      if (command.flags.includes(InteractionFlags.GuildCommand)) {
        assert(interaction.guild);
        interaction.member = await interaction.guild.members.fetch(interaction.user.id);
      }

      const subcommand = this.checkForSubcommand(interaction);
      if (subcommand) {
        const funcName = `execute${upperFirst(toCamelCase(subcommand))}`;
        const stupidCommand = command as any;
        if (typeof stupidCommand[funcName] === 'function') return await stupidCommand[funcName](interaction);
      }

      await command.execute(interaction);
    } catch (error) {
      await this.discord.handleError(toError(error), interaction);
    }
  }

  private checkForSubcommand(interaction: ChatInputCommandInteraction): string | null {
    try {
      return interaction.options.getSubcommand(true);
    } catch {
      return null;
    }
  }

  async onAutocomplete(interaction: AutocompleteInteraction) {
    const command = this.commands.get(interaction.commandName);
    if (!command) return;
    try {
      const options = await command.autocomplete(interaction);
      await interaction.respond(options.map((choice) => ({ name: choice.name, value: choice.value ?? choice.name })));
    } catch (error) {
      await this.discord.handleError(toError(error), interaction);
    }
  }

  async deployCommands() {
    this.commands.clear();
    const commandFiles = await readdir('./src/discord/commands/', { recursive: true, encoding: 'utf-8' }).then(
      (files) => files.filter((file) => file.endsWith('.ts'))
    );

    const commands = [];
    const guildCommands = [];
    for (const file of commandFiles) {
      const command: DiscordCommand = new (await import(`../commands/${file}`)).default(this.discord);
      if (command.data.name) {
        if (command.flags.includes(InteractionFlags.GuildCommand)) {
          command.data.setContexts(InteractionContextType.Guild);
          command.data.setIntegrationTypes(ApplicationIntegrationType.GuildInstall);
          guildCommands.push(command.data.toJSON());
        } else {
          commands.push(command.data.toJSON());
        }
        this.commands.set(command.data.name, command);
      }
    }

    const rest = new REST({ version: '10' }).setToken(this.discord.application.config.discord.token);
    const clientId = Buffer.from(
      this.discord.application.config.discord.token.split('.')?.[0] || 'UNKNOWN',
      'base64'
    ).toString('ascii');

    await rest
      .put(Routes.applicationCommands(clientId), { body: commands })
      .then(() => console.discord(`Successfully reloaded ${commands.length} application command(s).`));
    await rest
      .put(Routes.applicationGuildCommands(clientId, this.discord.application.config.discord.serverId), {
        body: guildCommands
      })
      .then(() =>
        console.discord(
          `Successfully reloaded ${guildCommands.length} application guilds command(s) into ${this.discord.application.config.discord.serverId}.`
        )
      );
  }
}

export default CommandHandler;
