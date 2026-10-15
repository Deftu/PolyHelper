import ConfigManager from '../../src/ConfigManager.ts';
import '../../src/private/logger.ts';

await ConfigManager.validate();
process.exit(0);
