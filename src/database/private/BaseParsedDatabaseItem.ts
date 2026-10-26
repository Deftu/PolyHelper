import type { AutocompleteOption } from '../../types/discord.ts';

abstract class BaseParsedDatabaseItem<DatabaseType> {
  abstract toAutocompleteOption(): AutocompleteOption;
  abstract toJSON(): DatabaseType;
}

export default BaseParsedDatabaseItem;
