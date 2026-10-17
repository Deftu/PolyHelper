import zod from 'zod';

export interface MetadataEntry<K extends string> {
  key: K;
  value: string;
}

export const DatabaseBoolean = zod
  .union([zod.literal(0), zod.literal(1)])
  .meta({ description: "Boolean type isn't support by sql so we need to use 0 1 as a boolean" });

export const DatabasePanel = zod.object({
  id: zod.string(),
  name: zod.string(),
  title: zod.string(),
  description: zod.string(),
  channel: zod.string(),
  buttonLabel: zod.string(),
  buttonEmoji: zod.string().nullable(),
  openingMessage: zod.string(),
  pingSupportRoleOnOpen: DatabaseBoolean,
  enabled: DatabaseBoolean
});
export type DatabasePanel = zod.infer<typeof DatabasePanel>;
