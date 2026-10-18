import type { StringValue } from 'ms';

export interface ScriptOptions {
  id: string;
  cron?: string;
  interval?: StringValue;
  enabled?: boolean;
}
