import BasicScript from '../BasicScript.ts';
import type ScriptManager from '../ScriptManager.ts';

class ExampleScript extends BasicScript {
  constructor(scripts: ScriptManager) {
    super(scripts, { id: 'example' });
  }

  override execute() {
    console.log('Hey!! This is an example script!');
  }
}

export default ExampleScript;
