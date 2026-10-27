import Application from '../Application.ts';
import PolyHelperError from '../private/error.ts';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { mkdir, readFile, readdir, rm, stat, utimes, writeFile } from 'node:fs/promises';
import { parseClassFile } from './classFileUtils.ts';
import { unzipSync } from 'fflate';
import type { ClassFileInfo } from './classFileUtils.ts';
import type { ModrinthVersionFile } from '../types/modrinth.ts';

const pluginInterface = 'org/spongepowered/asm/mixin/extensibility/IMixinConfigPlugin';

const ignoredModIds = new Set(['minecraft', 'java', 'fabricloader', 'fabric', 'mixinextras', 'quilt_loader']);

const inFlight = new Map<string, Promise<Uint8Array>>();

async function trimCache(dir: string, maxBytes: number) {
  const entries = await Promise.all(
    (await readdir(dir)).map(async (name) => {
      const path = join(dir, name);
      const info = await stat(path);
      return { path, size: info.size, time: info.mtimeMs };
    })
  );
  let total = entries.reduce((sum, entry) => sum + entry.size, 0);
  for (const entry of entries.sort((a, b) => a.time - b.time)) {
    if (total <= maxBytes) break;
    await rm(entry.path, { force: true });
    total -= entry.size;
  }
}

async function fetchJar(file: ModrinthVersionFile, cacheDir: string, maxCacheBytes: number): Promise<Uint8Array> {
  const path = join(cacheDir, `${file.hashes.sha1}.jar`);
  try {
    const data = await readFile(path);
    const now = new Date();
    await utimes(path, now, now);
    return data;
  } catch {
    const response = await Application.request<ArrayBuffer>(file.url, {
      responseType: 'arraybuffer',
      maxContentLength: file.size + 1024
    });
    const data = new Uint8Array(response.data);
    if (createHash('sha1').update(data).digest('hex') !== file.hashes.sha1) {
      throw new PolyHelperError(`Checksum mismatch for ${file.filename}`);
    }
    await mkdir(cacheDir, { recursive: true });
    await writeFile(path, data);
    await trimCache(cacheDir, maxCacheBytes);
    return data;
  }
}

function parseJson(data: Uint8Array | undefined): Record<string, unknown> | null {
  if (!data) return null;
  try {
    const parsed: unknown = JSON.parse(new TextDecoder().decode(data));
    return typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : [];
}

function mixinConfigName(entry: unknown): string | null {
  if (typeof entry === 'string') return entry;
  if (typeof entry === 'object' && entry !== null && 'config' in entry) return String(entry.config);
  return null;
}

function mixinConfigNames(modJson: Record<string, unknown> | null, files: string[]): string[] {
  const listed = Array.isArray(modJson?.mixins)
    ? modJson.mixins.map(mixinConfigName).filter((entry): entry is string => entry !== null)
    : [];
  const discovered = files.filter((file) => /mixins?[^/]*\.json$/i.test(file));
  return [...new Set([...listed, ...discovered])];
}

function isLoaderCheck(info: ClassFileInfo): boolean {
  return info.methodRefs.some(
    ({ owner, name }) =>
      name === 'isModLoaded' ||
      (name === 'isLoaded' && owner.endsWith('ModList')) ||
      (name === 'getModContainer' && /Loader$/.test(owner))
  );
}

export interface MixinConfig {
  file: string;
  packageName: string;
  plugin: string | null;
  mixins: string[];
}

export interface JarContents {
  modId: string | null;
  modVersion: string | null;
  classes: Map<string, ClassFileInfo>;
  mixinConfigs: MixinConfig[];
}

export type GateKind = 'loader check' | 'mixin plugin' | 'mod ID constant';

export interface Gate {
  className: string;
  kinds: GateKind[];
  modIds: string[];
}

export function toDotted(internalName: string): string {
  return internalName.replaceAll('/', '.');
}

export function toInternal(className: string): string {
  return className.replace(/\.class$/, '').replaceAll('.', '/');
}

export function downloadJar(
  file: ModrinthVersionFile,
  cacheDir: string,
  maxJarBytes: number,
  maxCacheBytes: number
): Promise<Uint8Array> {
  if (file.size > maxJarBytes) {
    return Promise.reject(new PolyHelperError(`${file.filename} is too large to scan`));
  }
  const existing = inFlight.get(file.hashes.sha1);
  if (existing) return existing;
  const promise = fetchJar(file, cacheDir, maxCacheBytes).finally(() => inFlight.delete(file.hashes.sha1));
  inFlight.set(file.hashes.sha1, promise);
  return promise;
}

export function readJar(data: Uint8Array): JarContents {
  const files = unzipSync(data, {
    filter: (file) => file.name.endsWith('.class') || (file.name.endsWith('.json') && file.originalSize < 1024 * 1024)
  });
  const modJson = parseJson(files['fabric.mod.json'] ?? files['quilt.mod.json']);
  const loaderJson =
    modJson && typeof modJson.quilt_loader === 'object' ? (modJson.quilt_loader as Record<string, unknown>) : modJson;

  const mixinConfigs: MixinConfig[] = [];
  for (const file of mixinConfigNames(loaderJson, Object.keys(files))) {
    const config = parseJson(files[file]);
    if (!config || typeof config.package !== 'string') continue;
    mixinConfigs.push({
      file,
      packageName: config.package,
      plugin: typeof config.plugin === 'string' ? config.plugin : null,
      mixins: [...stringList(config.mixins), ...stringList(config.client), ...stringList(config.server)].map(
        (mixin) => `${config.package}.${mixin}`
      )
    });
  }

  const classes = new Map<string, ClassFileInfo>();
  for (const [name, bytes] of Object.entries(files)) {
    if (!name.endsWith('.class') || name.startsWith('META-INF/')) continue;
    try {
      const info = parseClassFile(bytes);
      classes.set(info.name, info);
    } catch {
      continue;
    }
  }

  return {
    modId: typeof loaderJson?.id === 'string' ? loaderJson.id : null,
    modVersion: typeof loaderJson?.version === 'string' ? loaderJson.version : null,
    classes,
    mixinConfigs
  };
}

export function findGate(info: ClassFileInfo, loadedMods: Set<string>, selfId: string | null): Gate | null {
  const kinds: GateKind[] = [];
  if (isLoaderCheck(info)) kinds.push('loader check');
  if (info.interfaces.includes(pluginInterface)) kinds.push('mixin plugin');
  const modIds = [
    ...new Set(
      info.strings.filter(
        (value) => value.length >= 3 && value !== selfId && !ignoredModIds.has(value) && loadedMods.has(value)
      )
    )
  ];
  if (modIds.length > 0 && kinds.length === 0) kinds.push('mod ID constant');
  return kinds.length > 0 ? { className: info.name, kinds, modIds } : null;
}

export function findMixinsForHook(jar: JarContents, handler: string, target: string | null): ClassFileInfo[] {
  const mixinNames = new Set(jar.mixinConfigs.flatMap((config) => config.mixins.map(toInternal)));
  const candidates = [...jar.classes.values()].filter(
    (info) =>
      info.methods.some((method) => method === handler || method.endsWith(`$${handler}`)) &&
      (mixinNames.size === 0 || mixinNames.has(info.name))
  );
  if (!target || candidates.length <= 1) return candidates;
  const simpleTarget = target.split('$')[0] ?? target;
  const matching = candidates.filter((info) =>
    info.utf8.some((value) => value.endsWith(`/${simpleTarget};`) || value.endsWith(`/${simpleTarget}`))
  );
  return matching.length > 0 ? matching : candidates;
}

export function getReferencedClasses(jar: JarContents, info: ClassFileInfo): ClassFileInfo[] {
  const owners = new Set(info.methodRefs.map((ref) => ref.owner));
  owners.delete(info.name);
  return [...owners]
    .map((owner) => jar.classes.get(owner))
    .filter((entry): entry is ClassFileInfo => entry !== undefined);
}

export function getPluginClasses(jar: JarContents, mixin: ClassFileInfo): ClassFileInfo[] {
  return jar.mixinConfigs
    .filter((config) => config.plugin && config.mixins.map(toInternal).includes(mixin.name))
    .map((config) => jar.classes.get(toInternal(config.plugin as string)))
    .filter((entry): entry is ClassFileInfo => entry !== undefined);
}
