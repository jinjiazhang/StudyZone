#!/usr/bin/env node

import { readRootEnv, run } from './utils.mjs';

const env = readRootEnv();
for (const [key, value] of Object.entries(env)) {
  process.env[key] ??= value;
}

if (!env.NEXT_PUBLIC_API_URL || !env.VITE_API_URL) {
  console.error('Missing NEXT_PUBLIC_API_URL or VITE_API_URL in .env.');
  console.error('Start from .env.production.example and set both to the public HTTPS origin.');
  process.exit(1);
}

run('pnpm', ['install', '--frozen-lockfile']);

if (!process.argv.includes('--skip-db')) {
  run('pnpm', ['db:import']);
}

run('pnpm', ['build']);
run('node', ['scripts/deploy/publish-admin.mjs']);

if (!process.argv.includes('--skip-restart')) {
  run('systemctl', ['restart', 'studyzone-api', 'studyzone-web']);
  run('systemctl', ['reload', 'nginx']);
}
