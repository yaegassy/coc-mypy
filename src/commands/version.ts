import { commands, ExtensionContext, window } from 'coc.nvim';

import fs from 'fs';
import path from 'path';

import { EXTENSION_NS, UPSTREAM_NAME } from '../constant';

export function register(context: ExtensionContext) {
  context.subscriptions.push(
    commands.registerCommand(`${EXTENSION_NS}.version`, async () => {
      const versionTextPath = path.join(context.storagePath, UPSTREAM_NAME, 'version.txt');
      if (fs.existsSync(versionTextPath)) {
        const version = fs.readFileSync(versionTextPath, { encoding: 'utf8' });
        window.showInformationMessage(version);
      }
    })
  );
}
