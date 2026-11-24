import { mkdirSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const raw = process.env.ANDROID_API_URL?.trim();

if (!raw) {
  console.error('ERROR: ANDROID_API_URL es obligatorio.');
  process.exit(1);
}

let url;

try {
  url = new URL(raw);
} catch {
  console.error('ERROR: ANDROID_API_URL no es una URL valida.');
  process.exit(1);
}

const hostname = url.hostname.toLowerCase();

const invalidHosts = [
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '[::1]'
];

if (
  url.protocol !== 'https:' ||
  invalidHosts.includes(hostname) ||
  hostname.startsWith('127.') ||
  hostname.endsWith('.localhost') ||
  url.username ||
  url.password ||
  url.search ||
  url.hash
) {
  console.error(
    'ERROR: Se requiere una URL HTTPS de QA, sin credenciales ni localhost.'
  );
  process.exit(1);
}

const pathname = url.pathname.replace(/\/+$/, '');

if (!pathname.endsWith('/api/v1')) {
  console.error(
    'ERROR: ANDROID_API_URL debe terminar en /api/v1.'
  );
  process.exit(1);
}

const apiUrl = `${url.origin}${pathname}`;

const directory = new URL('../src/environments/', import.meta.url);
const generated = new URL(
  '../src/environments/environment.android.generated.ts',
  import.meta.url
);

mkdirSync(directory, { recursive: true });

writeFileSync(
  generated,
  '// Archivo generado por scripts/build-android.mjs\n' +
  'export const environment = {\n' +
  `  apiUrl: ${JSON.stringify(apiUrl)},\n` +
  '};\n',
  'utf8'
);

console.log('Configuracion Android generada correctamente.');

const cli = fileURLToPath(
  new URL('../node_modules/@angular/cli/bin/ng.js', import.meta.url)
);

const result = spawnSync(
  process.execPath,
  [cli, 'build', '--configuration', 'android'],
  {
    cwd: root,
    stdio: 'inherit'
  }
);

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
