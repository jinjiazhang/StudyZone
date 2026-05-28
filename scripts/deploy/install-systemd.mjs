#!/usr/bin/env node

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  commandOutput,
  option,
  readRootEnv,
  renderTemplate,
  rootDir,
  run,
} from './utils.mjs';

const env = readRootEnv();
const systemdDir = option('systemd-dir', '/etc/systemd/system');
const pnpmBin = option('pnpm', commandOutput('which', ['pnpm']) ?? '/usr/bin/pnpm');
const webPort = option('web-port', env.WEB_PORT ?? '3000');

const values = {
  ROOT_DIR: rootDir,
  PNPM_BIN: pnpmBin,
  WEB_PORT: webPort,
};

mkdirSync(resolve(rootDir, '.studyzone-prod/logs'), { recursive: true });

for (const name of ['studyzone-api.service', 'studyzone-web.service']) {
  const templatePath = resolve(rootDir, 'deploy', `${name}.template`);
  const outputPath = resolve(systemdDir, name);
  const rendered = renderTemplate(readFileSync(templatePath, 'utf8'), values);
  writeFileSync(outputPath, rendered);
  console.log(`Wrote ${outputPath}`);
}

run('systemctl', ['daemon-reload']);
run('systemctl', ['enable', 'studyzone-api', 'studyzone-web']);

if (process.argv.includes('--restart')) {
  run('systemctl', ['restart', 'studyzone-api', 'studyzone-web']);
}
