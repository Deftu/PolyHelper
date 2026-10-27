import zod from 'zod';

export const ModrinthProject = zod.object({
  id: zod.string(),
  slug: zod.string(),
  title: zod.string(),
  description: zod.string(),
  icon_url: zod.string().nullish(),
  source_url: zod.string().nullish(),
  issues_url: zod.string().nullish()
});
export type ModrinthProject = zod.infer<typeof ModrinthProject>;

export const ModrinthSearchResponse = zod.object({ hits: zod.array(zod.object({ slug: zod.string() })) });
export type ModrinthSearchResponse = zod.infer<typeof ModrinthSearchResponse>;

export const ModrinthVersionFile = zod.object({
  url: zod.string(),
  filename: zod.string(),
  primary: zod.boolean(),
  size: zod.number(),
  hashes: zod.object({ sha1: zod.string() })
});
export type ModrinthVersionFile = zod.infer<typeof ModrinthVersionFile>;

export const ModrinthVersion = zod.object({
  id: zod.string(),
  version_number: zod.string(),
  game_versions: zod.array(zod.string()),
  loaders: zod.array(zod.string()),
  files: zod.array(ModrinthVersionFile)
});
export type ModrinthVersion = zod.infer<typeof ModrinthVersion>;
