#!/usr/bin/env node

import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { option, rootDir } from './utils.mjs';

const source = resolve(rootDir, 'apps/admin/dist');
const target = option('target', process.env.ADMIN_DIST_DIR ?? '/var/www/studyzone-admin');

if (!existsSync(source)) {
  console.error(`Admin build output does not exist: ${source}`);
  console.error('Run: pnpm --filter @studyzone/admin build');
  process.exit(1);
}

mkdirSync(target, { recursive: true });
rmSync(target, { recursive: true, force: true });
mkdirSync(target, { recursive: true });
cpSync(source, target, { recursive: true });

console.log(`Published Admin static files to ${target}`);
