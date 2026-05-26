#!/usr/bin/env node

import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, openSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const stateDir = resolve(rootDir, '.studyzone-dev');
const logDir = resolve(stateDir, 'logs');
const pidFile = resolve(stateDir, 'services.json');

const services = [
  { name: 'api', script: 'dev:api', url: 'http://localhost:4000' },
  { name: 'web', script: 'dev:web', url: 'http://localhost:3000' },
  { name: 'admin', script: 'dev:admin', url: 'http://localhost:3001' },
];

const args = new Set(process.argv.slice(2));

if (args.has('--help') || args.has('-h')) {
  console.log(`Usage: pnpm services:start [--no-docker]

Starts local StudyZone services in the background:
  - Docker infra: Postgres, Redis, MinIO
  - API:   http://localhost:4000
  - Web:   http://localhost:3000
  - Admin: http://localhost:3001

Logs and process ids are written to .studyzone-dev/.
Stop them with: pnpm services:stop`);
  process.exit(0);
}

mkdirSync(logDir, { recursive: true });

const existing = readState();
const running = existing.services?.filter((service) => isRunning(service.pid)) ?? [];
if (running.length > 0) {
  console.log('Some StudyZone services are already running:');
  for (const service of running) {
    console.log(`  ${service.name} pid=${service.pid} log=${relative(service.log)}`);
  }
  console.log('Stop them first with: pnpm services:stop');
  process.exit(0);
}

if (!args.has('--no-docker')) {
  run('docker', ['compose', '-f', 'infra/docker/docker-compose.yml', 'up', '-d']);
}

const started = [];
for (const service of services) {
  const log = resolve(logDir, `${service.name}.log`);
  const fd = openSync(log, 'a');
  const child = spawn('pnpm', [service.script], {
    cwd: rootDir,
    detached: true,
    env: process.env,
    stdio: ['ignore', fd, fd],
  });
  child.unref();
  started.push({ ...service, pid: child.pid, log });
  console.log(`Started ${service.name.padEnd(5)} pid=${child.pid} log=${relative(log)}`);
}

writeFileSync(
  pidFile,
  JSON.stringify({ startedAt: new Date().toISOString(), services: started }, null, 2),
);

console.log('\nServices are starting in the background:');
for (const service of started) {
  console.log(`  ${service.name.padEnd(5)} ${service.url}`);
}
console.log('\nStop them with: pnpm services:stop');

function run(command, commandArgs) {
  const result = spawnSync(command, commandArgs, {
    cwd: rootDir,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function readState() {
  if (!existsSync(pidFile)) return {};
  try {
    return JSON.parse(readFileSync(pidFile, 'utf8'));
  } catch {
    return {};
  }
}

function isRunning(pid) {
  if (!pid) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function relative(path) {
  return path.replace(`${rootDir}/`, '');
}
