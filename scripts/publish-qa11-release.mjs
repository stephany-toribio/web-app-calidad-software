import { readFileSync, readdirSync, mkdirSync, copyFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const label = process.argv[2];
if (!label || !/^[A-Za-z0-9_-]{1,50}$/.test(label)) {
  console.error('Uso: node scripts/publish-qa11-release.mjs QA11-A');
  process.exit(1);
}
const root = fileURLToPath(new URL('../', import.meta.url));
const source = join(root, 'dist', 'qa11-releases', label, 'browser');
const destination = join(root, 'dist', 'creo-angular-qa', 'browser');
const manifest = JSON.parse(readFileSync(join(source, 'ngsw.json'), 'utf8'));
if (manifest.appData?.release !== label) throw new Error('Release inconsistente.');
// Keep old hashed assets for existing tabs. Never delete the live directory:
// Nginx already bind-mounts it. Publish ngsw.json after all referenced assets.
function copyTree(from, to, top = false) {
  mkdirSync(to, { recursive: true });
  for (const item of readdirSync(from, { withFileTypes: true })) {
    if (top && ['ngsw.json', 'index.html'].includes(item.name)) continue;
    if (item.isDirectory()) copyTree(join(from, item.name), join(to, item.name));
    else copyFileSync(join(from, item.name), join(to, item.name));
  }
}
copyTree(source, destination, true);
copyFileSync(join(source, 'index.html'), join(destination, 'index.html'));
copyFileSync(join(source, 'ngsw.json'), join(destination, 'ngsw.json'));
console.log(`Publicado ${label} en ${destination}. Mantener Nginx y tunel activos.`);
