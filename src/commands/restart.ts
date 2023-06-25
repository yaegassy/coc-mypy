import { commands, ExtensionContext, LanguageClient, ServiceStat } from 'coc.nvim';

import { EXTENSION_NS } from '../constant';

export function register(context: ExtensionContext, client: LanguageClient) {
  context.subscriptions.push(
    commands.registerCommand(`${EXTENSION_NS}.restart`, async () => {
      if (client) {
        if (client.serviceState !== ServiceStat.Stopped) {
          await client.stop();
        }
      }
      client.start();
    })
  );
}
