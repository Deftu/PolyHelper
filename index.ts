import ConfigManager from './src/ConfigManager.ts';
import { mkdir } from 'node:fs/promises';
import './src/private/logger.ts';

await mkdir('./data/', { recursive: true });

const configManager = new ConfigManager();
const config = await configManager.init();

const { default: Application } = await import('./src/Application.ts');
const application = new Application(config);
application.database.checkForDatabase();
await application.database.checkForMigrations();
await application.scripts.init();
await application.discord.connect();
