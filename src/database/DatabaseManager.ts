import BasicDatabaseManager from './BasicDatabaseManager.ts';
import PolyHelperError from '../private/error.ts';
import type Application from '../Application.ts';
import type { DatabasePanel } from '../types/database.ts';
import type { Message } from 'discord.js';

class DatabaseManager extends BasicDatabaseManager {
  protected override currentDatabaseSchemaVersion: number = 1;
  protected override databaseMigrationsPath: string = 'src/database/migrations';
  constructor(readonly application: Application) {
    super(application.config.other.sqlitedb);
  }

  async getPanelsMessage(): Promise<Message> {
    if (!this.application.discord.isClientOnline()) {
      throw new PolyHelperError("The discord bot doesn't seam to be online? Please restart the application");
    }
    const channel = await this.application.discord.getChannel('support');
    const messageId = this.getMetadataEntry('PanelsMessage');
    if (!messageId) {
      const message = await channel.send({ content: 'Setting up panels message' });
      this.insertMetadataEntry<'PanelsMessage'>({ key: 'PanelsMessage', value: message.id });
      return await this.getPanelsMessage();
    }
    const message = await channel.messages.fetch(messageId.value).catch(() => null);
    if (!message) {
      this.deletgeMetadataEntry('PanelsMessage');
      return await this.getPanelsMessage();
    }
    return message;
  }

  getPanelIds(): DatabasePanel['id'][] {
    return this.db
      .prepare<[], Pick<DatabasePanel, 'id'>>('SELECT id FROM panels')
      .all()
      .map((row) => row.id);
  }

  getPanels(): DatabasePanel[] {
    return this.db.prepare<[], DatabasePanel>('SELECT * FROM panels').all();
  }

  getPanel(id: DatabasePanel['id']): DatabasePanel | undefined {
    return this.db.prepare<[DatabasePanel['id']], DatabasePanel>('SELECT * FROM panels WHERE id = ?').get(id);
  }

  async insertPanel(panelData: Omit<DatabasePanel, 'id'>): Promise<DatabasePanel> {
    const id: DatabasePanel['id'] = crypto.randomUUID();
    this.db
      .prepare<DatabasePanel>(
        'INSERT INTO panels (id, name, title, description, channel, buttonLabel, buttonEmoji, openingMessage, pingSupportRoleOnOpen, enabled) VALUES (@id, @name, @title, @description, @channel, @buttonLabel, @buttonEmoji, @openingMessage, @pingSupportRoleOnOpen, @enabled)'
      )
      .run({ ...panelData, id });
    const panel = this.getPanel(id);
    if (!panel) throw new PolyHelperError('Something went wrong while inserting a panel');
    await this.application.tickets.updatePanelsMessage();
    return panel;
  }

  async deletePanel(id: DatabasePanel['id']) {
    this.db.prepare<DatabasePanel['id']>('DELETE FROM panels WHERE id = ?').run(id);
    await this.application.tickets.updatePanelsMessage();
  }

  async updatePanel(data: DatabasePanel): Promise<DatabasePanel> {
    const panel = this.getPanel(data.id);
    if (!panel) throw new PolyHelperError('Could not find this panel?');
    this.db
      .prepare<DatabasePanel>(
        'UPDATE panels SET name = @name, title = @title, description = @description, channel = @channel, buttonLabel = @buttonLabel, buttonEmoji = @buttonEmoji, openingMessage = @openingMessage, pingSupportRoleOnOpen = @pingSupportRoleOnOpen, enabled = @enabled WHERE id = @id'
      )
      .run(data);
    const newPanel = this.getPanel(data.id);
    if (!newPanel) throw new PolyHelperError('Something went wrong while updating a panel');
    await this.application.tickets.updatePanelsMessage();
    return newPanel;
  }
}

export default DatabaseManager;
