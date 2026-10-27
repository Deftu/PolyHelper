import zod from 'zod';
import type { CommandInteraction } from 'discord.js';
import type { JarContents } from '../utils/jarUtils.ts';
import type { SourceGateLine } from '../utils/sourceCodeUtils.ts';

export type SparkMode = 'analyze' | 'compare';

export interface SparkProfile {
  sparkId: string;
  profilePath: string;
}

export interface SparkRequest {
  mode: SparkMode;
  sparkId: string;
  baselineId: string | null;
  supportNotes: string | null;
  interaction: CommandInteraction;
}

export interface SparkJob {
  mode: SparkMode;
  profile: SparkProfile;
  baseline: SparkProfile | null;
  supportNotes: string | null;
  channelId: string;
  requester: string;
  startedAt: number;
}

export interface HookRow {
  hook: string;
  mod: string;
  on: string;
  pct: number;
  pass_through: number;
  own_share: number;
  flag: string | null;
}

export interface PassRow {
  name: string;
  pct: number;
  gl_native_pct: number;
  owners: [string, number][];
  hooks: [string, number][];
}

export interface ProfileSummary {
  label: string;
  meta: { loader: string | null; mc_version: string | null };
  mods: string[];
  mod_versions: Record<string, string>;
  thread: string | null;
  wall_ms: number | null;
  by_mod: Record<string, number>;
  passes: { passes: PassRow[] } | null;
  hooks?: HookRow[];
}

export interface ScannedMod {
  modId: string;
  version: string | null;
  reasons: string[];
  title: string;
  iconUrl: string | null;
  issuesUrl: string | null;
  repo: string | null;
  ref: string | null;
  polyfrost: boolean;
  jar: JarContents | null;
  jarNote: string | null;
  sourceGates: SourceGateLine[];
}

export interface SparkPrepass {
  problem: ProfileSummary;
  baseline: ProfileSummary | null;
  textReport: string;
  digest: string;
  scanned: ScannedMod[];
  loadedMods: Set<string>;
  mcVersion: string | null;
  loader: string | null;
}

export const SparkFinding = zod.strictObject({
  title: zod.string().describe('One line naming the finding'),
  detail: zod.string().describe('One line of evidence or mechanism'),
  status: zod
    .enum(['confirmed', 'hypothesis'])
    .describe('confirmed only if you saw it in code, bytecode or the profile'),
  mod: zod.string().nullable().describe('Mod ID as spark shows it'),
  sourceUrl: zod.string().nullable().describe('GitHub link to the exact lines, if you have one')
});
export type SparkFinding = zod.infer<typeof SparkFinding>;

export const SparkHandoff = zod.strictObject({
  mod: zod.string().describe('Mod ID as spark shows it'),
  version: zod.string().nullable(),
  repo: zod.string().nullable().describe('owner/name'),
  ref: zod.string().nullable().describe('Branch or tag matching the profile'),
  file: zod.string().nullable().describe('Path inside the repo'),
  symbol: zod.string().nullable().describe('Class#method or field'),
  fileUrl: zod.string().nullable().describe('GitHub link to the file or lines'),
  problem: zod.string().describe('What the profile shows, with numbers'),
  suspectedCause: zod.string().describe('One or two sentences. Say (hypothesis) unless seen in code'),
  task: zod
    .string()
    .describe("A prompt for the developer's coding agent: where to look, what to change, how to verify"),
  upstreamTracker: zod.string().nullable().describe('Issue tracker URL for a third-party mod')
});
export type SparkHandoff = zod.infer<typeof SparkHandoff>;

export const SparkChange = zod.strictObject({
  mod: zod.string(),
  change: zod.enum(['added', 'removed', 'updated', 'share moved']),
  detail: zod.string().describe('Versions or both percentages')
});
export type SparkChange = zod.infer<typeof SparkChange>;

export const SparkReport = zod.strictObject({
  verdict: zod.string().describe('One or two sentences naming the cause and its cost'),
  evidence: zod.array(zod.string()).describe('Up to 4 short bullets with numbers'),
  tellUser: zod.array(zod.string()).describe('Up to 4 concrete steps the support member can pass on'),
  primaryMod: zod.string().nullable().describe('Mod ID most responsible, if any'),
  findings: zod.array(SparkFinding).describe('Up to 5, most important first'),
  analysis: zod.string().describe('The full write-up in markdown: every finding, the evidence and the reasoning'),
  handoff: SparkHandoff.nullable().describe('Only when a mod owns a cost its code could fix'),
  changes: zod.array(SparkChange).nullable().describe('Compare mode only: what differs between the profiles'),
  confounded: zod.string().nullable().describe('Compare mode only: why the comparison may be unfair, if it is')
});
export type SparkReport = zod.infer<typeof SparkReport>;

export interface SparkResult {
  report: SparkReport | null;
  partial: boolean;
  text: string | null;
  cost: number;
  turns: number;
  durationMs: number;
  prepass: SparkPrepass;
}
