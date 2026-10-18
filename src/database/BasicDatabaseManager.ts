import Database from 'better-sqlite3';
import { access, readFile, readdir } from 'node:fs/promises';
import type { MetadataEntry } from '../types/database.ts';

abstract class BasicDatabaseManager {
  protected abstract readonly databaseMigrationsPath: string;
  readonly db: Database.Database;
  constructor(private readonly databasePath: string) {
    this.db = new Database(this.databasePath);
  }

  async checkForDatabase() {
    const metadataTable = this.db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'metadata'")
      .get();
    if (!metadataTable) {
      console.other('I have no database! I am probably new.');
      console.other(`Will set up ${this.databasePath}`);
      this.initNewDB();
    }

    await access(this.databasePath);
  }

  private initNewDB() {
    this.db.exec(`CREATE TABLE metadata(
        key TEXT PRIMARY KEY,
        value TEXT
    ) STRICT`);

    this.insertMetadataEntry<'SchemaVersion'>({ key: 'SchemaVersion', value: '0' });
  }

  async checkForMigrations() {
    console.other('Checking whether DB needs migrations...');

    let dbversion = 0;
    try {
      const version = this.getMetadataEntry('SchemaVersion');
      if (!version) console.error('Metadata table has no SchemaVersion. DB Version is 0 and applying all migrations.');
      else dbversion = Number.parseInt(version.value);
    } catch (e) {
      console.error(e);
      console.error('There is likely no metadata table. Assuming our DB Version is 0 and applying all migrations.');
    }

    const regex = /^(?<start>[0-9]+)-(?<end>[0-9]+)\.sql$/;
    const migrationFiles = (await readdir(this.databaseMigrationsPath, { encoding: 'utf-8' }))
      .map((file) => {
        const match = file.match(regex);
        if (!match?.groups) return null;
        return { start: Number(match.groups.start), end: Number(match.groups.end), path: file };
      })
      .filter((file) => file !== null)
      .sort((a, b) => a.start - b.start || a.end - b.end);

    const pendingMigrations = migrationFiles.filter((migration) => migration.start >= dbversion);
    if (pendingMigrations.length === 0) return console.other('Database is already up to date.');

    for (const migration of pendingMigrations) {
      console.other(`Applying database migration ${migration.path}...`);
      await this.doDatabaseMigration(migration.path);
      dbversion = migration.end;
    }

    console.other('Done with migrations. Setting SchemaVersion to new value...');
    this.updateMetadataEntry<'SchemaVersion'>({ key: 'SchemaVersion', value: dbversion.toString() });
  }

  private async doDatabaseMigration(file: string) {
    const data = await readFile(`${this.databaseMigrationsPath}/${file}`);
    if (!data) throw new Error(`The ${file} file does not exist.`);
    this.db.exec(data.toString('utf-8'));
  }

  getMetadataEntry<K extends string>(key: K): MetadataEntry<K> | null {
    return this.db.prepare<string, MetadataEntry<K>>('SELECT * FROM metadata WHERE key = ?').get(key) ?? null;
  }

  protected updateMetadataEntry<K extends string>(entry: MetadataEntry<K>) {
    this.db.prepare<MetadataEntry<K>>('UPDATE metadata SET value = @value WHERE key = @key').run(entry);
  }

  protected insertMetadataEntry<K extends string>(entry: MetadataEntry<K>) {
    this.db.prepare<MetadataEntry<K>>('INSERT INTO metadata(key, value) VALUES (@key, @value)').run(entry);
  }

  protected deletgeMetadataEntry<K extends string>(key: K) {
    this.db.prepare<string>('DELETE FROM metadata WHERE key = ?').run(key);
  }
}

export default BasicDatabaseManager;
