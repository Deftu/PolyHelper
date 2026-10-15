import BasicDatabaseManager from './BasicDatabaseManager.ts';
import type Application from '../Application.ts';

class DatabaseManager extends BasicDatabaseManager {
  protected override currentDatabaseSchemaVersion: number = 1;
  protected override databaseMigrationsPath: string = 'src/database/migrations';
  constructor(readonly application: Application) {
    super(application.config.other.sqlitedb);
  }
}

export default DatabaseManager;
