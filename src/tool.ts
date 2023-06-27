import { ExtensionContext, workspace } from 'coc.nvim';

import fs from 'fs';
import path from 'path';
import which from 'which';

import { EXTENSION_NS } from './constant';

export function getPythonEnvPath(): string {
  let pythonPath = '';

  pythonPath = which.sync('python3', { nothrow: true }) || '';
  if (pythonPath) {
    return pythonPath;
  }

  pythonPath = which.sync('python', { nothrow: true }) || '';
  if (pythonPath) {
    return pythonPath;
  }

  return pythonPath;
}

export function getPythonBultinInstallPath(): string {
  let pythonPath = workspace.getConfiguration(EXTENSION_NS).get<string>('builtin.pythonPath', '');
  if (pythonPath) {
    return pythonPath;
  }

  pythonPath = which.sync('python3', { nothrow: true }) || '';
  if (pythonPath) {
    pythonPath = fs.realpathSync(pythonPath);
    return pythonPath;
  }

  pythonPath = which.sync('python', { nothrow: true }) || '';
  if (pythonPath) {
    pythonPath = fs.realpathSync(pythonPath);
    return pythonPath;
  }

  return pythonPath;
}

export function getMypyLspMypyPath(context: ExtensionContext) {
  let toolPath: string | undefined = undefined;

  if (
    fs.existsSync(path.join(context.storagePath, 'vscode-mypy', 'venv', 'Scripts', 'mypy.exe')) ||
    fs.existsSync(path.join(context.storagePath, 'vscode-mypy', 'venv', 'bin', 'mypy'))
  ) {
    if (process.platform === 'win32') {
      toolPath = path.join(context.storagePath, 'vscode-mypy', 'venv', 'Scripts', 'mypy.exe');
    } else {
      toolPath = path.join(context.storagePath, 'vscode-mypy', 'venv', 'bin', 'mypy');
    }
  }

  return toolPath;
}

export function getMypyLspPythonPath(context: ExtensionContext) {
  let pythonCommandPath: string | undefined = undefined;

  if (
    fs.existsSync(path.join(context.storagePath, 'vscode-mypy', 'venv', 'Scripts', 'python.exe')) ||
    fs.existsSync(path.join(context.storagePath, 'vscode-mypy', 'venv', 'bin', 'python'))
  ) {
    if (process.platform === 'win32') {
      pythonCommandPath = path.join(context.storagePath, 'vscode-mypy', 'venv', 'Scripts', 'python.exe');
    } else {
      pythonCommandPath = path.join(context.storagePath, 'vscode-mypy', 'venv', 'bin', 'python');
    }
  }

  return pythonCommandPath;
}

export function getMypyLspServerPath(context: ExtensionContext) {
  let serverScriptPath: string | undefined = undefined;

  if (fs.existsSync(path.join(context.storagePath, 'vscode-mypy', 'bundled', 'tool', 'lsp_server.py'))) {
    serverScriptPath = path.join(context.storagePath, 'vscode-mypy', 'bundled', 'tool', 'lsp_server.py');
  }

  return serverScriptPath;
}
