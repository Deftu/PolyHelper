import ButtonHandler from './handlers/ButtonHandler.ts';
import CommandHandler from './handlers/CommandHandler.ts';
import InteractionHandler from './handlers/InteractionHandler.ts';
import MessageHandler from './handlers/MessageHandler.ts';
import ModalHandler from './handlers/ModalHandler.ts';
import PolyHelperError from '../private/error.ts';
import StringSelectMenuHandler from './handlers/StringSelectMenuHandler.ts';
import {
  ChannelType,
  Client,
  Events,
  GatewayIntentBits,
  Guild,
  MessageFlags,
  type SendableChannels,
  TextChannel
} from 'discord.js';
import { getCleanErrorEmbed, toError } from '../utils/miscUtils.ts';
import { parseInteractionType } from '../utils/discordUtils.ts';
import { writeFile } from 'node:fs/promises';
import type Application from '../Application.ts';
import type BasicInteractionMetadata from './private/interactions/basic/BasicInteractionMetadata.ts';
import type DiscordCommandMetadata from './private/interactions/commands/DiscordCommandMetadata.ts';
import type { Config } from '../types/config.ts';
import type {
  DiscordManagerWithClient,
  DiscordManagerWithGuild,
  EmbedHelperField,
  InteractionTypes
} from '../types/discord.ts';
import type { ValidErrors } from '../types/application.ts';

class DiscordManager {
  readonly buttonHandler: ButtonHandler;
  readonly commandHandler: CommandHandler;
  readonly interactionHandler: InteractionHandler;
  readonly messageHandler: MessageHandler;
  readonly modalHandler: ModalHandler;
  readonly stringSelectMenuHandler: StringSelectMenuHandler;
  client?: Client;
  guild?: Guild;
  constructor(readonly application: Application) {
    this.buttonHandler = new ButtonHandler(this);
    this.commandHandler = new CommandHandler(this);
    this.interactionHandler = new InteractionHandler(this);
    this.messageHandler = new MessageHandler(this);
    this.modalHandler = new ModalHandler(this);
    this.stringSelectMenuHandler = new StringSelectMenuHandler(this);
  }

  async connect() {
    const client = new Client({
      intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
    });
    client.discordManager = this;
    this.client = client;
    await this.commandHandler.deployCommands();
    await this.buttonHandler.loadButtons();
    await this.modalHandler.loadModals();
    await this.stringSelectMenuHandler.loadStringSelectMenus();
    this.client.on(Events.ClientReady, (client) => this.onReady(client));
    this.client.on(Events.MessageCreate, (message) => this.messageHandler.onMessage(message));
    this.client.on(Events.InteractionCreate, (interaction) => this.interactionHandler.onInteraction(interaction));
    this.client.login(this.application.config.discord.token).catch((e) => this.handleError(toError(e)));
  }

  async loadGuild(): Promise<DiscordManagerWithGuild> {
    if (!this.isClientOnline()) {
      throw new PolyHelperError("The discord bot doesn't seam to be online? Please restart the application");
    }
    this.guild = await this.client.guilds.fetch(this.application.config.discord.serverId);
    console.discord(`Guild ready, successfully fetched ${this.guild.name} (${this.guild.id})`);
    if (!this.isGuildReady()) throw new PolyHelperError('Something went wrong loading the guild');
    return this;
  }

  isGuildReady(): this is DiscordManagerWithGuild {
    if (!this.isClientOnline()) return false;
    return this.guild?.id !== undefined;
  }

  isClientOnline(): this is DiscordManagerWithClient {
    return this.client?.isReady() === true;
  }

  hasClient(): this is DiscordManager & { client: Client } {
    return this.client !== undefined;
  }

  private async onReady(client: Client<true>) {
    console.discord(`Logged in as ${client.user.username} (${client.user.id})!`);
    await this.loadGuild();
  }

  async handleError(
    error: ValidErrors,
    interaction: InteractionTypes | null = null,
    extraErrorData: EmbedHelperField[] = [],
    metadata: BasicInteractionMetadata | DiscordCommandMetadata | null = null
  ) {
    if (interaction) {
      extraErrorData.push({ name: 'Source', value: 'Discord Interaction' });
      extraErrorData.push({
        name: 'User',
        value: `\`@${interaction.user.username}\` (\`${interaction.user.id}\`) <@${interaction.user.id}>`
      });
      extraErrorData.push({ name: 'Interaction Type', value: parseInteractionType(interaction.type) });
      if (interaction.isCommand()) {
        extraErrorData.push({ name: 'Command', value: interaction.commandName, format: 'Small Block' });
      }
      if (interaction.isButton()) {
        extraErrorData.push({ name: 'Button', value: interaction.customId, format: 'Small Block' });
      }
    }
    await this.application.logError(error, extraErrorData);
    if (!interaction) return;

    if (interaction.isAutocomplete()) {
      try {
        await interaction.respond([]);
      } catch (e: unknown) {
        this.application.logError(toError(e));
      }
      return;
    }

    try {
      const embed = getCleanErrorEmbed(error, metadata);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ embeds: [embed], flags: MessageFlags.Ephemeral });
      } else {
        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
      }
    } catch (e: unknown) {
      this.application.logError(toError(e));
    }
  }

  async getChannel(type: keyof Config['discord']['channels']): Promise<SendableChannels> {
    if (!this.isGuildReady()) {
      await this.loadGuild();
      throw new PolyHelperError("The discord server isn't ready. Please try again later");
    }
    const config = this.application.config.discord.channels[type];
    if (config === null) {
      if (!this.isGuildReady()) {
        throw new PolyHelperError("The discord server isn't ready. Please try again later");
      }

      const channel = await this.guild.channels.create({ name: type });
      this.application.config.discord.channels[type] = channel.id;
      await writeFile('config.json', JSON.stringify(this.application.config, null, 2), 'utf-8');
      return channel;
    }

    const channel = await this.client.channels.fetch(config);
    if (channel === null || !channel.isSendable()) throw new PolyHelperError(`Channel "${type}" not found!`);
    return channel;
  }

  async getSupportChannel(): Promise<TextChannel> {
    const channel = await this.getChannel('support');
    if (channel.type !== ChannelType.GuildText) throw new PolyHelperError('Could not find the support channel?');
    return channel;
  }
}

export default DiscordManager;
