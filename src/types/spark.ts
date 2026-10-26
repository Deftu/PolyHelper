import type Anthropic from '@anthropic-ai/sdk';
import type { Config } from './config.ts';
import type { Message } from 'discord.js';

export type SparkReportKind = 'analysis' | 'fix';

export interface SparkProfile {
  sparkId: string;
  profilePath: string;
}

export interface SparkContext extends SparkProfile {
  client: Anthropic;
  config: Config['sparkAnalysis'];
  baseline: SparkProfile | null;
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

export type ScanSparkLogMetadata = Pick<
  SparkJob,
  'sparkId' | 'supportNotes' | 'channelId' | 'channelUrl' | 'requester'
> & { baselineId?: string | null };

export interface ScanSparkLogResult {
  analysisMessage: Message;
  fixMessage: Message;
}
