import fs from 'node:fs';

const FEATCH_URL = 'https://api.github.com/repos/microsoft/vscode-mypy/tags';
const RESOURCE_FILE_NAME = 'vscode-mypy-tags.json';

await (async () => {
  const res = await fetch(FEATCH_URL);
  if (!res.ok) return;
  const remoteJson = await res.json();
  const remoteJsonStr = JSON.stringify(remoteJson, null, 2);

  const resourcePath = new URL(`../resources/${RESOURCE_FILE_NAME}`, import.meta.url).pathname;
  let localJsonStr = await fs.promises.readFile(resourcePath, { encoding: 'utf-8' });
  const localJson = JSON.parse(localJsonStr);
  localJsonStr = JSON.stringify(localJson, null, 2);

  if (remoteJsonStr === localJsonStr) {
    console.log('OK');
    process.exit(0);
  } else {
    console.log('NG');
    process.exit(1);
  }
})();
