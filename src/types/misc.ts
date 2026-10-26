import type { ChalkInstance } from 'chalk';

declare global {
  export interface Console {
    discord: (message: string) => void;
    scripts: (message: string) => void;
    other: (message: string) => void;
  }
}

export interface LogData {
  level: string;
  background: ChalkInstance;
  color: ChalkInstance;
}

export interface TicketAction {
  reason?: string;
  runner: string;
}

export interface TicketSearch {
  panelId?: string;
  pinned?: boolean;
  unpinned?: boolean;
  closed?: boolean;
  open?: boolean;
  owner?: string;
}
