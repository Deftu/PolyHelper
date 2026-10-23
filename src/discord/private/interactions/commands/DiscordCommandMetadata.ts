import {
  ApplicationIntegrationType,
  InteractionContextType,
  type RESTPostAPIChatInputApplicationCommandsJSONBody,
  type SlashCommandAttachmentOption,
  type SlashCommandBooleanOption,
  SlashCommandBuilder,
  type SlashCommandChannelOption,
  type SlashCommandIntegerOption,
  type SlashCommandMentionableOption,
  type SlashCommandNumberOption,
  type SlashCommandRoleOption,
  type SlashCommandStringOption,
  type SlashCommandSubcommandBuilder,
  type SlashCommandSubcommandGroupBuilder,
  type SlashCommandUserOption
} from 'discord.js';
import { type InteractionFlag, InteractionPermission, InteractionResponse } from '../../../../types/discord.ts';

class DiscordCommandMetadata extends SlashCommandBuilder {
  #shouldAddHiddenOption: boolean = true;
  readonly #flags: InteractionFlag[] = [];
  #permission: InteractionPermission = InteractionPermission.Anyone;
  #response: InteractionResponse = InteractionResponse.Public;
  #fetchGuildMember: boolean = true;
  #cleanErrorTitle: string | null = null;
  constructor() {
    super();
    this.setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel);
    this.setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall);
  }

  override setName(name: string): this {
    super.setName(name);
    super.setDescription(name);
    return this;
  }

  override setDescription(description: string): this {
    super.setDescription(description);
    return this;
  }

  override addAttachmentOption(
    input: SlashCommandAttachmentOption | ((builder: SlashCommandAttachmentOption) => SlashCommandAttachmentOption)
  ): this {
    super.addAttachmentOption(input);
    return this;
  }

  override addBooleanOption(
    input: SlashCommandBooleanOption | ((builder: SlashCommandBooleanOption) => SlashCommandBooleanOption)
  ): this {
    super.addBooleanOption(input);
    return this;
  }

  override addChannelOption(
    input: SlashCommandChannelOption | ((builder: SlashCommandChannelOption) => SlashCommandChannelOption)
  ): this {
    super.addChannelOption(input);
    return this;
  }

  override addIntegerOption(
    input: SlashCommandIntegerOption | ((builder: SlashCommandIntegerOption) => SlashCommandIntegerOption)
  ): this {
    super.addIntegerOption(input);
    return this;
  }

  override addMentionableOption(
    input: SlashCommandMentionableOption | ((builder: SlashCommandMentionableOption) => SlashCommandMentionableOption)
  ): this {
    super.addMentionableOption(input);
    return this;
  }

  override addNumberOption(
    input: SlashCommandNumberOption | ((builder: SlashCommandNumberOption) => SlashCommandNumberOption)
  ): this {
    super.addNumberOption(input);
    return this;
  }

  override addRoleOption(
    input: SlashCommandRoleOption | ((builder: SlashCommandRoleOption) => SlashCommandRoleOption)
  ): this {
    super.addRoleOption(input);
    return this;
  }

  override addStringOption(
    input: SlashCommandStringOption | ((builder: SlashCommandStringOption) => SlashCommandStringOption)
  ): this {
    super.addStringOption(input);
    return this;
  }

  override addSubcommand(
    input:
      | SlashCommandSubcommandBuilder
      | ((subcommandGroup: SlashCommandSubcommandBuilder) => SlashCommandSubcommandBuilder)
  ): this {
    super.addSubcommand(input);
    return this.removeHidddenOption();
  }

  override addSubcommandGroup(
    input:
      | SlashCommandSubcommandGroupBuilder
      | ((subcommandGroup: SlashCommandSubcommandGroupBuilder) => SlashCommandSubcommandGroupBuilder)
  ): this {
    super.addSubcommandGroup(input);
    return this.removeHidddenOption();
  }

  override addUserOption(
    input: SlashCommandUserOption | ((builder: SlashCommandUserOption) => SlashCommandUserOption)
  ): this {
    super.addUserOption(input);
    return this;
  }

  override toJSON(): RESTPostAPIChatInputApplicationCommandsJSONBody {
    if (this.#shouldAddHiddenOption) {
      this.addBooleanOption((option) =>
        option.setName('hidden-response').setDescription('Should the command response be hidden')
      );
    }
    return super.toJSON();
  }

  removeHidddenOption(): this {
    this.#shouldAddHiddenOption = false;
    return this;
  }

  setFlags(...flags: InteractionFlag[]): this {
    this.#flags.push(...flags);
    return this;
  }

  get flags(): InteractionFlag[] {
    return [...this.#flags];
  }

  setPermission(permission: InteractionPermission): this {
    this.#permission = permission;
    return this;
  }

  get permission(): InteractionPermission {
    return this.#permission;
  }

  setResponse(response: InteractionResponse): this {
    if (response === InteractionResponse.Ephemeral) this.removeHidddenOption();
    this.#response = response;
    return this;
  }

  get response(): InteractionResponse {
    return this.#response;
  }

  setFetchGuildMember(fetchGuildMember: boolean): this {
    this.#fetchGuildMember = fetchGuildMember;
    return this;
  }

  get fetchGuildMember(): boolean {
    return this.#fetchGuildMember;
  }

  setCleanErrorTitle(title: string | null): this {
    this.#cleanErrorTitle = title;
    return this;
  }

  get cleanErrorTitle(): string | null {
    return this.#cleanErrorTitle;
  }
}

export default DiscordCommandMetadata;
