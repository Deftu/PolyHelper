import zod from 'zod';

export enum ConfigChangeType {
  Move,
  Delete,
  Transform
}

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
export interface JsonObject {
  [key: string]: JsonValue;
}

export type TransformFunction = (value: JsonValue, config: JsonObject) => JsonValue;

export interface MigrationRule {
  key?: string;
  change: ConfigChangeType;
  transform?: TransformFunction;
}

export type MigrationMap = Record<string, MigrationRule>;

export const ConfigDiscordEmbedsColors = zod.enum(['Pink', 'Red', 'Green', 'Yellow']);
export type ConfigDiscordEmbedsColors = zod.infer<typeof ConfigDiscordEmbedsColors>;
export const ConfigDiscordEmbeds = zod.object({
  colors: zod.record(ConfigDiscordEmbedsColors, zod.string()).meta({ description: 'The default colors for embeds' })
});
export const ConfigDiscord = zod.object({
  token: zod.string().meta({ description: 'The Discord bot token used to authenticate' }),
  embeds: ConfigDiscordEmbeds.meta({
    description:
      "Configuration options for embeds. Note that embeds aren't normally used in this project but the colors are used still"
  })
});

export const ConfigLogger = zod.object({
  saveToFiles: zod.boolean().meta({ description: 'Whether log output should be written to files' }),
  location: zod.string().meta({ description: 'The location of where these files should be saved' }),
  errorLogChannel: zod
    .string()
    .nullable()
    .meta({
      description: 'A discord channel id where error logs will be sent. Not providing one disables logging to a channel'
    })
});

export const ConfigOther = zod.object({
  backupConfigs: zod.boolean().meta({ description: 'Whether backup copies of config files should be created' }),
  sqlitedb: zod.string().meta({ description: 'Path to the sqlite database' })
});

export const Config = zod.object({
  $schema: zod.string().meta({ description: '!IMPORTANT DO NOT TOUCH\nConfig schema format path' }),
  configVersion: zod
    .number()
    .int()
    .positive()
    .meta({ description: '!IMPORTANT DO NOT TOUCH\nConfig format version number' }),
  discord: ConfigDiscord.meta({ description: 'Configuration options for discord related stuff' }),
  logger: ConfigLogger.meta({ description: 'Configuration options for the logger' }),
  other: ConfigOther.meta({
    description: "Configuration options for misc/other stuff or things that don't have a good location"
  })
});
export type Config = zod.infer<typeof Config>;
