import zod from 'zod';

export interface DatabaseMigrationFile {
  start: number;
  end: number;
  path: string;
}

export interface MetadataEntry<K extends string> {
  key: K;
  value: string;
}

export interface DatabaseSearchFilters {
  limit?: number;
}

export const DatabaseBoolean = zod
  .union([zod.literal(0), zod.literal(1)])
  .meta({ description: "Boolean type isn't support by sql so we need to use 0 1 as a boolean" });

export const DatabasePanel = zod.object({
  id: zod.string(),
  name: zod.string(),
  cleanName: zod.string(),
  title: zod.string(),
  description: zod.string(),
  buttonLabel: zod.string(),
  buttonEmoji: zod.string().nullable(),
  openingMessage: zod.string(),
  maxOpenTickets: zod.int().positive(),
  pinnedTicketPrefix: zod.string(),
  closedTicketPrefix: zod.string(),
  defaultTicketName: zod.string(),
  pingSupportRoleOnOpen: DatabaseBoolean,
  enabled: DatabaseBoolean
});
export type DatabasePanel = zod.infer<typeof DatabasePanel>;

export interface PanelSearchFilters extends DatabaseSearchFilters {
  enabled?: boolean;
}

export const DatabaseTicket = zod.object({
  id: zod.string(),
  panelId: zod.string(),
  threadId: zod.string(),
  owner: zod.string(),
  pinMessageId: zod.string().nullable(),
  startingMessageId: zod.string(),
  openingTimestamp: zod.int().positive(),
  name: zod.string(),
  closed: DatabaseBoolean
});
export type DatabaseTicket = zod.infer<typeof DatabaseTicket>;

export interface TicketSearchFilters extends DatabaseSearchFilters {
  panelId?: DatabaseTicket['panelId'];
  owner?: DatabaseTicket['owner'];
  pinned?: boolean;
  closed?: DatabaseTicket['closed'];
  autoClose?: boolean;
}

export const DatabaseCloseRequest = zod.object({
  id: zod.string(),
  ticketId: zod.string(),
  messageId: zod.string(),
  reason: zod.string(),
  closer: zod.string(),
  autoClose: zod.int().positive().nullable()
});
export type DatabaseCloseRequest = zod.infer<typeof DatabaseCloseRequest>;
