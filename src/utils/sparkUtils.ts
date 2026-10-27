import Application from '../Application.ts';
import PolyHelperError from '../private/error.ts';
import { dirname, join } from 'node:path';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { isAxiosError } from 'axios';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import type { SparkMode } from '../types/spark.ts';

const samplerType = 'application/x-spark-sampler';
const maxProfileBytes = 50 * 1024 * 1024;
const skillSections = ['Usage', 'Workflow', 'Reading the output', 'Reporting'];
const compareSkillSections = [...skillSections, 'Comparing two profiles'];
const skillDir = new URL('../../skills/spark-analyzer/', import.meta.url);
const scriptPath = fileURLToPath(new URL('scripts/spark_analyze.py', skillDir));
const skills = new Map<SparkMode, Promise<string>>();

export function runScript(python: string, args: string[], maxOutput: number | null): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(
      python,
      [scriptPath, ...args],
      { timeout: 2 * 60 * 1000, maxBuffer: 64 * 1024 * 1024, env: { ...process.env, PYTHONIOENCODING: 'utf-8' } },
      (error, stdout, stderr) => {
        if (!error && maxOutput === null) return resolve(stdout);
        let output = [stdout, stderr].filter(Boolean).join('\n').trim();
        if (maxOutput !== null && output.length > maxOutput) {
          output = `${output.slice(0, maxOutput)}\n[output truncated, narrow it with top, treeMin or treeDepth]`;
        }
        if (!error) return resolve(output);
        const reason = error.killed ? 'timed out' : `exited with code ${error.code}`;
        reject(new PolyHelperError(`spark_analyze.py ${reason}\n${output.slice(0, 2000)}`));
      }
    );
  });
}

export function loadSkill(mode: SparkMode): Promise<string> {
  const sections = mode === 'compare' ? compareSkillSections : skillSections;
  let skill = skills.get(mode);
  if (!skill) {
    skill = readFile(new URL('SKILL.md', skillDir), 'utf-8').then((text) =>
      text
        .split(/\r?\n(?=## )/)
        .filter((section) => sections.some((name) => section.startsWith(`## ${name}`)))
        .join('\n')
        .trim()
    );
    skills.set(mode, skill);
  }
  return skill;
}

export const sparkRegex = /https?:\/\/(?:spark|bytebin)\.lucko\.me\/([a-z0-9]+)/i;

export function getSparkURL(id: string): string {
  return `https://spark.lucko.me/${id}`;
}

export function findSparkId(text: string): string | undefined {
  return text.match(sparkRegex)?.[1];
}

export async function downloadProfile(id: string): Promise<Buffer> {
  const response = await Application.request<ArrayBuffer>(`https://bytebin.lucko.me/${id}`, {
    responseType: 'arraybuffer',
    maxContentLength: maxProfileBytes
  }).catch((error) => {
    if (isAxiosError(error) && error.response?.status === 404) {
      throw new PolyHelperError('Could not find that spark profile. It may have expired');
    }
    if (isAxiosError(error) && error.message.includes('maxContentLength')) {
      throw new PolyHelperError('That spark profile is too large to analyze');
    }
    throw error;
  });
  const type = String(response.headers['content-type'] ?? '');
  if (!type.startsWith(samplerType)) {
    throw new PolyHelperError(`That link is not a spark profiler report (\`${type || 'unknown type'}\`)`);
  }
  return Buffer.from(response.data);
}

export async function saveProfile(id: string, data: Buffer): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'polyhelper-spark-'));
  const path = join(dir, `${id}.bin`);
  await writeFile(path, data);
  return path;
}

export async function removeProfile(path: string): Promise<void> {
  await rm(dirname(path), { recursive: true, force: true });
}
