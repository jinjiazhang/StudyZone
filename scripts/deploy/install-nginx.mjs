#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, symlinkSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { normalizeBase, option, readRootEnv, renderTemplate, rootDir, run } from './utils.mjs';

const env = readRootEnv();
const publicOrigin = env.PUBLIC_ORIGIN ?? env.API_PUBLIC_URL ?? env.NEXT_PUBLIC_API_URL;
const inferredDomain = publicOrigin ? new URL(publicOrigin).hostname : undefined;

const domain = option('domain', process.env.DOMAIN ?? inferredDomain);
const certificate = option('ssl-cert', process.env.SSL_CERTIFICATE);
const certificateKey = option('ssl-key', process.env.SSL_CERTIFICATE_KEY);

if (!domain) {
  console.error('Missing domain. Pass --domain=study.example.com or set PUBLIC_ORIGIN in .env.');
  process.exit(1);
}

if (!certificate || !certificateKey) {
  console.error('Missing certificate paths. Pass --ssl-cert=... and --ssl-key=... .');
  process.exit(1);
}

const sitesAvailable = option('sites-available', '/etc/nginx/sites-available');
const sitesEnabled = option('sites-enabled', '/etc/nginx/sites-enabled');
const siteName = option('site-name', 'studyzone');
const adminBase = normalizeBase(option('admin-base', env.VITE_ADMIN_BASE ?? '/admin'));

const values = {
  DOMAIN: domain,
  SSL_CERTIFICATE: certificate,
  SSL_CERTIFICATE_KEY: certificateKey,
  API_PORT: option('api-port', env.API_PORT ?? '4000'),
  WEB_PORT: option('web-port', env.WEB_PORT ?? '3000'),
  ADMIN_BASE: adminBase,
  ADMIN_DIST_DIR: option('admin-dist-dir', process.env.ADMIN_DIST_DIR ?? '/var/www/studyzone-admin'),
};

const template = readFileSync(resolve(rootDir, 'deploy/nginx.studyzone.conf.template'), 'utf8');
const outputPath = resolve(sitesAvailable, siteName);
mkdirSync(sitesAvailable, { recursive: true });
writeFileSync(outputPath, renderTemplate(template, values));
console.log(`Wrote ${outputPath}`);

mkdirSync(sitesEnabled, { recursive: true });
const enabledPath = resolve(sitesEnabled, siteName);
if (existsSync(enabledPath)) {
  unlinkSync(enabledPath);
}
symlinkSync(outputPath, enabledPath);

const defaultPath = resolve(sitesEnabled, 'default');
if (existsSync(defaultPath) && process.argv.includes('--disable-default')) {
  unlinkSync(defaultPath);
}

mkdirSync(dirname(values.ADMIN_DIST_DIR), { recursive: true });

run('nginx', ['-t']);
if (process.argv.includes('--reload')) {
  run('systemctl', ['reload', 'nginx']);
}
