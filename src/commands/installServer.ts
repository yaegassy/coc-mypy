import { commands, ExtensionContext, window } from 'coc.nvim';

import child_process from 'child_process';
import { randomBytes } from 'crypto';
import extract from 'extract-zip';
import fs from 'fs';
import { HttpsProxyAgent } from 'https-proxy-agent';
import fetch from 'node-fetch';
import path from 'path';
import rimraf from 'rimraf';
import stream from 'stream';
import util from 'util';

import { EXTENSION_NS, UPSTREAM_NAME, VSCODE_MYPY_VERSION } from '../constant';
import { getPythonPath } from '../tool';

const pipeline = util.promisify(stream.pipeline);
const agent = process.env.https_proxy ? new HttpsProxyAgent(process.env.https_proxy as string) : null;
const exec = util.promisify(child_process.exec);

export function register(context: ExtensionContext) {
  context.subscriptions.push(commands.registerCommand(`${EXTENSION_NS}.installServer`, handleInstallServer(context)));
}

function handleInstallServer(context: ExtensionContext) {
  return async () => {
    const msg = `Install/Upgrade ${UPSTREAM_NAME}'s language server?`;

    const ret = await window.showPrompt(msg);
    if (ret) {
      const pythonCommand = getPythonPath();

      await doDownload(context).catch(() => {});
      await doExtract(context).catch(() => {});
      await doInstall(pythonCommand, context).catch(() => {});

      commands.executeCommand('editor.action.restart');
    } else {
      //
    }
  };
}

async function doDownload(context: ExtensionContext): Promise<void> {
  const statusItem = window.createStatusBarItem(0, { progress: true });
  statusItem.text = `Downloading ${UPSTREAM_NAME}`;
  statusItem.show();

  const downloadUrl = `https://github.com/microsoft/vscode-mypy/archive/refs/tags/${VSCODE_MYPY_VERSION}.zip`;

  // @ts-ignore
  const resp = await fetch(downloadUrl, { agent });
  if (!resp.ok) {
    statusItem.hide();
    throw new Error('Download failed');
  }

  let cur = 0;
  const len = Number(resp.headers.get('content-length'));
  resp.body.on('data', (chunk: Buffer) => {
    cur += chunk.length;
    const p = ((cur / len) * 100).toFixed(2);
    statusItem.text = `${p}% Downloading ${UPSTREAM_NAME}`;
  });

  const _path = path.join(context.storagePath, `${UPSTREAM_NAME}.zip`);
  const randomHex = randomBytes(5).toString('hex');
  const tempFile = path.join(context.storagePath, `${UPSTREAM_NAME}-${randomHex}.zip`);

  const destFileStream = fs.createWriteStream(tempFile, { mode: 0o755 });
  await pipeline(resp.body, destFileStream);
  await new Promise<void>((resolve) => {
    destFileStream.on('close', resolve);
    destFileStream.destroy();
    setTimeout(resolve, 1000);
  });

  await fs.promises.unlink(_path).catch((err) => {
    if (err.code !== 'ENOENT') throw err;
  });
  await fs.promises.rename(tempFile, _path);

  statusItem.hide();
}

async function doExtract(context: ExtensionContext) {
  const zipPath = path.join(context.storagePath, `${UPSTREAM_NAME}.zip`);
  const extractPath = path.join(context.storagePath);
  const extractedFilenames: string[] = [];
  const targetPath = path.join(context.storagePath, `${UPSTREAM_NAME}`);

  rimraf.sync(targetPath);

  if (fs.existsSync(zipPath)) {
    await extract(zipPath, {
      dir: extractPath,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      onEntry(entry, _zipfile) {
        extractedFilenames.push(entry.fileName);
      },
    });

    const extractedBaseDirName = extractedFilenames[0];
    const extractedBasePath = path.join(context.storagePath, extractedBaseDirName);

    fs.renameSync(extractedBasePath, targetPath);
    rimraf.sync(zipPath);
  }
}

async function doInstall(pythonCommand: string, context: ExtensionContext): Promise<void> {
  const requirementsTxtPath = path.join(context.storagePath, UPSTREAM_NAME, 'requirements.txt');
  const pathVenv = path.join(context.storagePath, UPSTREAM_NAME, 'venv');

  let pathVenvPython = path.join(context.storagePath, UPSTREAM_NAME, 'venv', 'bin', 'python');
  if (process.platform === 'win32') {
    pathVenvPython = path.join(context.storagePath, UPSTREAM_NAME, 'venv', 'Scripts', 'python');
  }

  const statusItem = window.createStatusBarItem(0, { progress: true });
  statusItem.text = `Installing mypy language server in progress...`;
  statusItem.show();

  const installCmd =
    `"${pythonCommand}" -m venv ${pathVenv} && ` + `${pathVenvPython} -m pip install -U pip -r ${requirementsTxtPath}`;

  rimraf.sync(pathVenv);
  try {
    window.showInformationMessage(`Installing mypy language server in progress...`);
    await exec(installCmd);
    statusItem.hide();
    window.showInformationMessage(`Installation of mypy language server is now complete!`);
  } catch (error) {
    statusItem.hide();
    window.showErrorMessage(`Installation of mypy language server failed. | ${error}`);
    throw new Error();
  }
}
