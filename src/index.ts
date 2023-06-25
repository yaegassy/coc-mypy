import { ExtensionContext, LanguageClient, services, window, workspace } from 'coc.nvim';

import fs from 'fs';

import { createLanguageClient } from './client';
import * as installServerCommandFeature from './commands/installServer';
import * as restartCommandFeature from './commands/restart';
import * as showOutputCommandFeature from './commands/showOutput';
import * as showDocumentationCodeActionFeature from './features/showDocumentation';
import { getMypyLspMypyPath } from './tool';
import { EXTENSION_NS } from './constant';

let client: LanguageClient | undefined;

export async function activate(context: ExtensionContext): Promise<void> {
  if (!workspace.getConfiguration(EXTENSION_NS).get('enable')) return;

  const extensionStoragePath = context.storagePath;
  if (!fs.existsSync(extensionStoragePath)) {
    fs.mkdirSync(extensionStoragePath, { recursive: true });
  }

  const mypyLspMypyCommandPath = getMypyLspMypyPath(context);

  if (!mypyLspMypyCommandPath) {
    installServerCommandFeature.register(context);
    window.showWarningMessage(
      `coc-mypy | mypy language server does not exist. please execute ":CocCommand ${EXTENSION_NS}.installServer"`
    );
    return;
  }

  client = createLanguageClient(context);
  if (!client) return;
  context.subscriptions.push(services.registLanguageClient(client));

  installServerCommandFeature.register(context);
  restartCommandFeature.register(context, client);
  showOutputCommandFeature.register(context, client);
  showDocumentationCodeActionFeature.register(context, client);
}

export async function deactivate(): Promise<void> {
  if (client) {
    await client.stop();
  }
}
