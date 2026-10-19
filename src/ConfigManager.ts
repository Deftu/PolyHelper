import BasicConfigManager from './private/BasicConfigManager.ts';
import { Config, ConfigChangeType, type MigrationMap } from './types/config.ts';

class ConfigManager extends BasicConfigManager<Config> {
  protected readonly configPath = 'config.json';
  protected readonly defaultConfigPath = 'config.example.json';
  protected readonly schema = Config;
  protected readonly versions: Record<number, MigrationMap> = {
    2: { 'logger.errorLogChannel': { key: 'discord.channels.errorLog', change: ConfigChangeType.Move } },
    3: { 'other.backupConfigs': { key: 'other.configBackups.enabled', change: ConfigChangeType.Move } }
  };
}

export default ConfigManager;
