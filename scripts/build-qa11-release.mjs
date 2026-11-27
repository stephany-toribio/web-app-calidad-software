import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const label = process.argv[2];
if (!label || !/^[A-Za-z0-9_-]{1,50}$/.test(label)) {
  console.error('Uso: node scripts/build-qa11-release.mjs QA11-A');
  process.exit(1);
}
const root = new URL('../', import.meta.url);
const configPath = new URL('ngsw-config.json', root);
const original = readFileSync(configPath);
const releasePath = new URL('src/app/core/pwa/build-release.ts', root);
const originalRelease = readFileSync(releasePath);
let status = 1;
try {
  const config = JSON.parse(original.toString('utf8'));
  config.appData = { ...config.appData, release: label };
  writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
  writeFileSync(releasePath, `export const PWA_RELEASE = ${JSON.stringify(label)};\n`);
  const result = spawnSync(process.execPath, [
    fileURLToPath(new URL('node_modules/@angular/cli/bin/ng.js', root)),
    'build', '--configuration', 'qa', '--output-path', `dist/qa11-releases/${label}`
  ], { cwd: fileURLToPath(root), stdio: 'inherit' });
  if (result.error) throw result.error;
  status = result.status ?? 1;
  if (status === 0) {
    const path = new URL(`dist/qa11-releases/${label}/browser/ngsw.json`, root);
    const manifest = JSON.parse(readFileSync(path, 'utf8'));
    const hash = createHash('sha1').update(JSON.stringify(manifest)).digest('hex');
    console.log(`Release: ${label}\nNGSW version: ${hash}`);
    writeFileSync(new URL(`dist/qa11-releases/${label}/version.json`, root),
      JSON.stringify({ label, ngswVersion: hash }, null, 2) + '\n');
  }
} finally {
  writeFileSync(configPath, original);
  writeFileSync(releasePath, originalRelease);
}
process.exitCode = status;
