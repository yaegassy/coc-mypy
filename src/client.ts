import { ExtensionContext, LanguageClient, LanguageClientOptions, ServerOptions, workspace } from 'coc.nvim';

import which from 'which';

import { getMypyLspMypyPath, getMypyLspPythonPath, getMypyLspServerPath } from './tool';
import { EXTENSION_NS } from './constant';

export function createLanguageClient(context: ExtensionContext) {
  const mypyLspPythonCommandPathcommand = getMypyLspPythonPath(context);
  const mypyLspServerScriptPath = getMypyLspServerPath(context);
  if (!mypyLspPythonCommandPathcommand || !mypyLspServerScriptPath) return;

  const serverOptions: ServerOptions = {
    command: mypyLspPythonCommandPathcommand,
    args: [mypyLspServerScriptPath],
  };

  const initializationOptions = getInitializationOptions(context);

  const clientOptions: LanguageClientOptions = {
    synchronize: {
      configurationSection: [EXTENSION_NS],
    },
    documentSelector: ['python'],
    initializationOptions,
  };

  const client = new LanguageClient(EXTENSION_NS, 'mypy-lsp', serverOptions, clientOptions);
  return client;
}

type ImportStrategy = 'fromEnvironment' | 'useBundled';
type Severity = 'Error' | 'Hint' | 'Information' | 'Warning';
type ShowNotifications = 'off' | 'onError' | 'onWarning' | 'always';

type MypyLspInitializationOptions = {
  globalSettings: {
    args: string[];
    path: string[];
    importStrategy: ImportStrategy;
    interpreter: string[];
    severity: Severity;
    showNotifications: ShowNotifications;
  };
};

function convertFromWorkspaceConfigToInitializationOptions() {
  const settings = workspace.getConfiguration(EXTENSION_NS);

  const initializationOptions = <MypyLspInitializationOptions>{
    globalSettings: {
      args: settings.get('args'),
      path: settings.get('path'),
      importStrategy: settings.get<ImportStrategy>(`importStrategy`) ?? 'fromEnvironment',
      interpreter: settings.get('interpreter'),
      severity: settings.get<Severity>('severity'),
      showNotifications: settings.get<ShowNotifications>('showNotifications'),
    },
    settings: {},
  };

  return initializationOptions;
}

function getInitializationOptions(context: ExtensionContext) {
  const initializationOptions = convertFromWorkspaceConfigToInitializationOptions();

  // **MEMO**:
  //
  // The current default for microsoft/vscode-mypy's langauge server is to use
  // dmypy. However, there seems to be a problem with using dmypy with coc-mypy,
  // where the daemon process remains after exiting Vim/Neovim...
  //
  // microsoft/vscode-mypy's langauge server uses mypy by specifying the mypy
  // command path in the `mypy-type-checker.path` configuration.
  //
  // In coc-mypy, the mypy command is adjusted to be used by default.
  if (!workspace.getConfiguration(EXTENSION_NS).get<boolean>('useDmypy', false)) {
    if (initializationOptions.globalSettings.path.length === 0) {
      const envMypyCommandPath = which.sync('mypy', { nothrow: true });
      if (envMypyCommandPath) {
        initializationOptions.globalSettings.path = [envMypyCommandPath];
      } else {
        const mypyPath = getMypyLspMypyPath(context);
        if (mypyPath) initializationOptions.globalSettings.path = [mypyPath];
      }
    }
  }

  return initializationOptions;
}
