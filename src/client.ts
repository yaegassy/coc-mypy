import { ExtensionContext, LanguageClient, LanguageClientOptions, ServerOptions, Uri, workspace } from 'coc.nvim';

import which from 'which';

import { EXTENSION_NS } from './constant';
import {
  existsPythonImportModule,
  getMypyLspMypyPath,
  getMypyLspServerInterpreterPath,
  getMypyLspServerScriptPath,
  getPythonEnvPath,
} from './tool';

export async function createLanguageClient(context: ExtensionContext) {
  const devServerInterpreter = workspace.expand(
    workspace.getConfiguration(EXTENSION_NS).get<string>('dev.serverInterpreter', '')
  );
  const devServerScript = workspace.expand(
    workspace.getConfiguration(EXTENSION_NS).get<string>('dev.serverScript', '')
  );

  const serverInterpreter = devServerInterpreter ? devServerInterpreter : getMypyLspServerInterpreterPath(context);
  const serverScript = devServerScript ? devServerScript : getMypyLspServerScriptPath(context);
  if (!serverInterpreter || !serverScript) return;

  const serverOptions: ServerOptions = {
    command: serverInterpreter,
    args: [serverScript],
  };

  const initializationOptions = await getInitializationOptions(context);

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

const DEFAULT_SEVERITY: Record<string, string> = {
  error: 'Error',
  note: 'Information',
};

type ExtensionInitializationOptions = {
  globalSettings: {
    cwd: string;
    workspace: string;
    args: string[];
    severity: Record<string, string>;
    path: string[];
    interpreter: string[];
    importStrategy: string;
    showNotifications: string;
    extraPaths: string[];
    reportingScope: string;
    preferDaemon: boolean;
  };
};

function convertFromWorkspaceConfigToInitializationOptions() {
  const settings = workspace.getConfiguration(EXTENSION_NS);

  const initializationOptions = <ExtensionInitializationOptions>{
    globalSettings: {
      cwd: workspace.root,
      workspace: Uri.parse(workspace.root).toString(),
      args: settings.get('args'),
      severity: settings.get<Record<string, string>>('severity', DEFAULT_SEVERITY),
      path: settings.get('path'),
      interpreter: settings.get('interpreter'),
      //importStrategy: settings.get<ImportStrategy>(`importStrategy`) ?? 'fromEnvironment',
      importStrategy: settings.get<string>('importStrategy', 'useBundled'),
      showNotifications: settings.get<string>('showNotifications', 'off'),
      extraPaths: [],
      reportingScope: settings.get<string>('reportingScope', 'file'),
      preferDaemon: settings.get<boolean>('preferDaemon', true),
    },
    settings: {},
  };

  return initializationOptions;
}

async function getInitializationOptions(context: ExtensionContext) {
  const initializationOptions = convertFromWorkspaceConfigToInitializationOptions();

  // **MEMO**:
  //
  // If interpreter is not set, get the current python path and set it. If the
  // necessary tools are installed in the virtual environment, they will be
  // respected
  if (workspace.getConfiguration(EXTENSION_NS).get<string[]>('interpreter', []).length === 0) {
    const pythonPath = getPythonEnvPath();
    const existsMypyModule = await existsPythonImportModule(pythonPath, 'mypy');
    if (existsMypyModule) {
      initializationOptions.globalSettings.interpreter = [pythonPath];
    }
  }

  // **MEMO**:
  //
  // The current default for microsoft/vscode-mypy's langauge server is to use dmypy.
  //
  // microsoft/vscode-mypy's langauge server uses mypy by specifying the mypy
  // command path in the `mypy-type-checker.path` configuration.
  if (!workspace.getConfiguration(EXTENSION_NS).get('useDmypy')) {
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
