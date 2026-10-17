import BasicDatabaseManager from './BasicDatabaseManager.ts';
import Panel from './private/Panel.ts';
import PolyHelperError from '../private/error.ts';
import Ticket from './private/ticket/Ticket.ts';
import type Application from '../Application.ts';
import type { DatabasePanel, DatabaseTicket } from '../types/database.ts';
import type { Message } from 'discord.js';

class DatabaseManager extends BasicDatabaseManager {
  protected override currentDatabaseSchemaVersion: number = 3;
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

  getPanels(): DatabasePanel[] {
    return this.db.prepare<[], DatabasePanel>('SELECT * FROM panels').all();
  }

  getPanel(id: DatabasePanel['id']): Panel | undefined {
    const data = this.db.prepare<[DatabasePanel['id']], DatabasePanel>('SELECT * FROM panels WHERE id = ?').get(id);
    if (!data) return data;
    return new Panel(data, this);
  }

  async insertPanel(panelData: Omit<DatabasePanel, 'id'>): Promise<Panel> {
    const id: DatabasePanel['id'] = crypto.randomUUID();
    this.db
      .prepare<DatabasePanel>(
        'INSERT INTO panels (id, name, title, description, buttonLabel, buttonEmoji, openingMessage, maxOpenTickets, pingSupportRoleOnOpen, enabled) VALUES (@id, @name, @title, @description, @buttonLabel, @buttonEmoji, @openingMessage, @maxOpenTickets, @pingSupportRoleOnOpen, @enabled)'
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

  async updatePanel(data: DatabasePanel): Promise<Panel> {
    const panel = this.getPanel(data.id);
    if (!panel) throw new PolyHelperError('Could not find this panel?');
    this.db
      .prepare<DatabasePanel>(
        'UPDATE panels SET name = @name, title = @title, description = @description, buttonLabel = @buttonLabel, buttonEmoji = @buttonEmoji, openingMessage = @openingMessage, maxOpenTickets = @maxOpenTickets, pingSupportRoleOnOpen = @pingSupportRoleOnOpen, enabled = @enabled WHERE id = @id'
      )
      .run(data);
    const newPanel = this.getPanel(data.id);
    if (!newPanel) throw new PolyHelperError('Something went wrong while updating a panel');
    await this.application.tickets.updatePanelsMessage();
    return newPanel;
  }

  getTicketIds(): DatabaseTicket['id'][] {
    return this.db
      .prepare<[], Pick<DatabaseTicket, 'id'>>('SELECT id FROM tickets')
      .all()
      .map((row) => row.id);
  }

  getTicketsByPanel(panelId: DatabaseTicket['panelId'], closed: DatabaseTicket['closed'] = 0): Ticket[] {
    return this.db
      .prepare<[DatabaseTicket['panelId'], DatabaseTicket['closed']], Pick<DatabaseTicket, 'id'>>(
        'SELECT id FROM tickets WHERE panelId = ? AND closed = ?'
      )
      .all(panelId, closed)
      .map(({ id }) => this.getTicket(id))
      .filter((ticket) => ticket !== undefined);
  }

  getTicketsByPanelUser(
    panelId: DatabaseTicket['panelId'],
    owner: DatabaseTicket['owner'],
    closed: DatabaseTicket['closed'] = 0
  ): Ticket[] {
    return this.db
      .prepare<
        [DatabaseTicket['panelId'], DatabaseTicket['owner'], DatabaseTicket['closed']],
        Pick<DatabaseTicket, 'id'>
      >('SELECT id FROM tickets WHERE panelId = ? AND owner = ? AND closed = ?')
      .all(panelId, owner, closed)
      .map(({ id }) => this.getTicket(id))
      .filter((ticket) => ticket !== undefined);
  }

  getTicket(id: DatabaseTicket['id']): Ticket | undefined {
    const data = this.db.prepare<[DatabaseTicket['id']], DatabaseTicket>('SELECT * FROM tickets WHERE id = ?').get(id);
    if (!data) return data;
    return new Ticket(data, this);
  }

  getTicketByThreadId(id: DatabaseTicket['threadId']): Ticket | undefined {
    const data = this.db
      .prepare<[DatabaseTicket['threadId']], Pick<DatabaseTicket, 'id'>>('SELECT id FROM tickets WHERE threadId = ?')
      .get(id);
    if (data === undefined) return data;
    return this.getTicket(data.id);
  }

  insertTicket(panelData: Omit<DatabaseTicket, 'id'>): Ticket {
    const id: DatabaseTicket['id'] = crypto.randomUUID();
    this.db
      .prepare<DatabaseTicket>(
        'INSERT INTO tickets (id, panelId, threadId, owner, pinned, closed) VALUES (@id, @panelId, @threadId, @owner, @pinned, @closed)'
      )
      .run({ ...panelData, id });
    const ticket = this.getTicket(id);
    if (!ticket) throw new PolyHelperError('Something went wrong while inserting a ticket');
    return ticket;
  }
}

export default DatabaseManager;
