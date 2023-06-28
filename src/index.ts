import { ExtensionContext, LanguageClient, services, window, workspace } from 'coc.nvim';

import fs from 'fs';

import { createLanguageClient } from './client';
import * as installServerCommandFeature from './commands/installServer';
import * as restartCommandFeature from './commands/restart';
import * as showOutputCommandFeature from './commands/showOutput';
import * as versionCommandFeature from './commands/version';
import { EXTENSION_NS } from './constant';
import * as showDocumentationCodeActionFeature from './features/showDocumentation';
import { getMypyLspMypyPath } from './tool';

let client: LanguageClient | undefined;

export async function activate(context: ExtensionContext): Promise<void> {
  if (!workspace.getConfiguration(EXTENSION_NS).get('enable')) return;

  const extensionStoragePath = context.storagePath;
  if (!fs.existsSync(extensionStoragePath)) {
    fs.mkdirSync(extensionStoragePath, { recursive: true });
  }

  const mypyLspMypyCommandPath = getMypyLspMypyPath(context);

  if (!mypyLspMypyCommandPath) {
    installServerCommandFeature.register(context, client);
    window.showWarningMessage(
      `coc-mypy | mypy language server does not exist. please execute ":CocCommand ${EXTENSION_NS}.installServer"`
    );
    return;
  }

  client = await createLanguageClient(context);
  if (!client) return;
  context.subscriptions.push(services.registLanguageClient(client));

  installServerCommandFeature.register(context, client);
  restartCommandFeature.register(context, client);
  showOutputCommandFeature.register(context, client);
  versionCommandFeature.register(context);
  showDocumentationCodeActionFeature.register(context, client);

  // **MEMO**:
  //
  // The language server of microsoft/vscode-mypy terminates the dmypy process
  // when the language server is stopped.
  // https://github.com/microsoft/vscode-mypy/blob/87491cf9576c9c9f428ca6468cdc448b94a08f32/bundled/tool/lsp_server.py#L285-L291
  //
  // Unfortunately, "deactivate" by coc.nvim does not address this issue and
  // the dmypy process remains...
  //
  // To handle this, we directly set the VimLeavePre event to terminate the
  // language server
  if (workspace.getConfiguration(EXTENSION_NS).get<boolean>('useDmypy', true)) {
    workspace.registerAutocmd({
      event: 'VimLeavePre',
      request: true,
      callback: async () => {
        if (client) {
          await client.stop();
        }
      },
    });
  }
}

export async function deactivate(): Promise<void> {
  if (client) {
    await client.stop();
  }
}
