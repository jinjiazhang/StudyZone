#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const stateDir = resolve(rootDir, '.studyzone-dev');
const pidFile = resolve(stateDir, 'services.json');

const args = new Set(process.argv.slice(2));

if (args.has('--help') || args.has('-h')) {
  console.log(`Usage: pnpm services:stop [--keep-docker]

Stops services started by pnpm services:start.
By default this also runs docker compose down for local infra.`);
  process.exit(0);
}

const state = readState();
const services = state.services ?? [];

if (services.length === 0) {
  console.log('No saved StudyZone service pids found.');
} else {
  for (const service of services) {
    stopProcessGroup(service);
  }
  rmSync(pidFile, { force: true });
}

if (!args.has('--keep-docker')) {
  run('docker', ['compose', '-f', 'infra/docker/docker-compose.yml', 'down']);
}

console.log('StudyZone services stopped.');

function stopProcessGroup(service) {
  const pid = service.pid;
  if (!pid) return;

  try {
    process.kill(-pid, 'SIGTERM');
    console.log(`Stopped ${service.name} pid=${pid}`);
    return;
  } catch {
    // Fall through and try the direct pid. This helps if the process was not
    // launched as the group leader on a given platform.
  }

  try {
    process.kill(pid, 'SIGTERM');
    console.log(`Stopped ${service.name} pid=${pid}`);
  } catch {
    console.log(`Skipped ${service.name}; pid ${pid} is not running`);
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
