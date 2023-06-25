import { commands, ExtensionContext, LanguageClient } from 'coc.nvim';

import { EXTENSION_NS } from '../constant';

export async function register(context: ExtensionContext, client: LanguageClient) {
  await client.onReady();

  context.subscriptions.push(
    commands.registerCommand(`${EXTENSION_NS}.showOutput`, () => {
      if (client.outputChannel) {
        client.outputChannel.show();
      }
    })
  );
}
