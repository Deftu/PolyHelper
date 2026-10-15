import ConfigManager from '../../src/ConfigManager.ts';
import '../../src/private/logger.ts';

await ConfigManager.validateExampleConfig();
process.exit(0);
