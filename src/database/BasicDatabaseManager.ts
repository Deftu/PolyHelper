import Database from 'better-sqlite3';
import { access, readFile } from 'node:fs/promises';
import { range } from 'discord.js';
import type { MetadataEntry } from '../types/database.ts';

abstract class BasicDatabaseManager {
  protected abstract readonly currentDatabaseSchemaVersion: number;
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

    let dbversion;
    try {
      const version = this.getMetadataEntry('SchemaVersion');
      if (!version) {
        console.error('Metadata table has no SchemaVersion. DB Version is 0 and applying all migrations.');
        dbversion = 0;
      } else {
        dbversion = Number.parseInt(version.value);
      }
    } catch (e) {
      console.error(e);
      console.error('There is likely no metadata table. Assuming our DB Version is 0 and applying all migrations.');
      dbversion = 0;
    }

    if (dbversion === this.currentDatabaseSchemaVersion) return;

    const migrationFiles: string[] = [];
    for (const migration of range({ start: dbversion + 1, end: this.currentDatabaseSchemaVersion + 1 })) {
      try {
        await access(`${this.databaseMigrationsPath}/${migration - 1}-${migration}.sql`);
      } catch {
        console.error(
          `A needed database migration (${this.databaseMigrationsPath}/${migration - 1}-${migration}.sql) does not exist. It is not safe to continue.`
        );
        process.exit(1);
      }

      migrationFiles.push(`${this.databaseMigrationsPath}/${migration - 1}-${migration}.sql`);
    }

    for (const migration of migrationFiles) {
      console.other(`Applying database migration ${migration}...`);
      await this.doDatabaseMigration(migration);
    }

    console.other('Done with migrations. Setting SchemaVersion to new value...');
    this.updateMetadataEntry<'SchemaVersion'>({
      key: 'SchemaVersion',
      value: this.currentDatabaseSchemaVersion.toString()
    });
  }

  private async doDatabaseMigration(file: string) {
    const data = await readFile(file);
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
}

export default BasicDatabaseManager;
