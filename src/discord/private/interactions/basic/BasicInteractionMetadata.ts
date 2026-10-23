import { type InteractionFlag, InteractionPermission, InteractionResponse } from '../../../../types/discord.ts';

class BasicInteractionMetadata {
  readonly #ids: string[] = [];
  readonly #flags: InteractionFlag[] = [];
  #permission: InteractionPermission = InteractionPermission.Anyone;
  #response: InteractionResponse = InteractionResponse.Public;
  #fetchGuildMember: boolean = true;
  #cleanErrorTitle: string | null = null;
  constructor(id: string | string[] = []) {
    if (Array.isArray(id)) this.#ids.push(...id);
    else this.#ids.push(id);
  }

  get ids(): string[] {
    return [...this.#ids];
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

export default BasicInteractionMetadata;
