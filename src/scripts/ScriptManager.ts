import { Collection } from 'discord.js';
import { readdir } from 'node:fs/promises';
import type Application from '../Application.ts';
import type BasicScript from './BasicScript.ts';

class ScriptManager {
  readonly scripts: Collection<string, BasicScript> = new Collection<string, BasicScript>();
  constructor(readonly application: Application) {}

  async init() {
    const scriptFiles = await readdir('./src/scripts/scripts/', { recursive: true, encoding: 'utf-8' }).then((files) =>
      files.filter((file) => file.endsWith('.ts'))
    );
    for (const file of scriptFiles) {
      const script: BasicScript = new (await import(`./scripts/${file}`)).default(this);
      this.scripts.set(script.id, script);
    }
    console.scripts(`Successfully loaded ${this.scripts.size} script(s).`);
  }

  getScript<Script = BasicScript>(id: string): Script | undefined {
    return this.scripts.get(id) as Script | undefined;
  }
}

export default ScriptManager;
