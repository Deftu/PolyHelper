class BasicInteractionMetadata {
  readonly #ids: string[] = [];
  constructor(id: string | string[] = []) {
    if (Array.isArray(id)) this.#ids = id;
    else this.#ids.push(id);
  }

  get ids(): string[] {
    return [...this.#ids];
  }
}

export default BasicInteractionMetadata;
