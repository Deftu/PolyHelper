import type Anthropic from '@anthropic-ai/sdk';
import type { Config } from './config.ts';

export type SparkReportKind = 'analysis' | 'fix';

export interface SparkContext {
  client: Anthropic;
  config: Config['sparkAnalysis'];
  sparkId: string;
  profilePath: string;
  supportNotes: string | null;
}

export interface SparkJob extends SparkContext {
  channelId: string;
  channelUrl: string;
  requester: string;
}

export interface FixHandoff {
  possible: boolean;
  reason: string;
  mod: string | null;
  hotSpot: string | null;
  lead: string | null;
}

export interface SparkAnalysis {
  report: string;
  handoff: FixHandoff | null;
}
