# Configuration

This document is generated from the Zod config schema in [`src/types/config.ts`](/src/types/config.ts)

# <Root>

| Key             | Type     | Description                                                                          |
| --------------- | -------- | ------------------------------------------------------------------------------------ |
| `$schema`       | `string` | !IMPORTANT DO NOT TOUCH Config schema format path                                    |
| `configVersion` | `number` | !IMPORTANT DO NOT TOUCH Config format version number                                 |
| `discord`       | `object` | Configuration options for discord related stuff                                      |
| `logger`        | `object` | Configuration options for the logger                                                 |
| `other`         | `object` | Configuration options for misc/other stuff or things that don't have a good location |

## discord

| Key      | Type     | Description                                                                                                           |
| -------- | -------- | --------------------------------------------------------------------------------------------------------------------- |
| `token`  | `string` | The Discord bot token used to authenticate                                                                            |
| `embeds` | `object` | Configuration options for embeds. Note that embeds aren't normally used in this project but the colors are used still |

### embeds

| Key      | Type                     | Description                   |
| -------- | ------------------------ | ----------------------------- |
| `colors` | `record<string, string>` | The default colors for embeds |

## logger

| Key               | Type             | Description                                                                                         |
| ----------------- | ---------------- | --------------------------------------------------------------------------------------------------- |
| `saveToFiles`     | `boolean`        | Whether log output should be written to files                                                       |
| `location`        | `string`         | The location of where these files should be saved                                                   |
| `errorLogChannel` | `string OR null` | A discord channel id where error logs will be sent. Not providing one disables logging to a channel |

## other

| Key             | Type      | Description                                             |
| --------------- | --------- | ------------------------------------------------------- |
| `backupConfigs` | `boolean` | Whether backup copies of config files should be created |
| `sqlitedb`      | `string`  | Path to the sqlite database                             |

---

This document is [auto generated](/scripts/docs/Configuration.ts) and was last updated on
`Thu, 15 Oct 2026 11:03:13 GMT` (`1792062193325`)

To update this document please run `pnpm docgen` or contact a maintainer and ask them to update it.

---

Feel free to reach out to the maintainers directly on Discord.
[@amber.rip](https://discord.com/users/1276524855445164098), [@ruintd](https://discord.com/users/157917665162297344)
