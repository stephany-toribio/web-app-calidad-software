import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Generator } from '@angular/service-worker/config';

test('generated NGSW prefetches shell/lazy chunks but never caches private API responses', async () => {
  const config = JSON.parse(readFileSync('ngsw-config.json', 'utf8'));
  const files = [
    '/index.html', '/main-X.js', '/chunk-Y.js', '/styles-X.css', '/manifest.webmanifest',
    '/icons/icon-192x192.png', '/api/v1/candidatos/me', '/api/v1/auth/login', '/api/v1/avatar.png', '/private.json'
  ];
  const fs = {
    list: async () => files,
    read: async () => '',
    hash: async file => 'hash-' + file,
    write: async () => {}
  };
  const manifest = await new Generator(fs, '/').process(config);
  assert.equal(manifest.dataGroups.length, 0);
  const keys = Object.keys(manifest.hashTable);
  assert.ok(keys.includes('/index.html'));
  assert.ok(keys.includes('/chunk-Y.js')); // deep routes must work without fetching lazy chunks offline
  assert.ok(!keys.some(url => url.startsWith('/api/')));
  assert.ok(!keys.includes('/private.json'));
  const isNavigation = url => manifest.navigationUrls.some(rule => rule.positive && new RegExp(rule.regex).test(url))
    && !manifest.navigationUrls.some(rule => !rule.positive && new RegExp(rule.regex).test(url));
  assert.equal(isNavigation('/creo/candidate-applications'), true);
  assert.equal(isNavigation('/api/v1/candidatos/me'), false);
  assert.equal(isNavigation('/sanctum/csrf-cookie'), false);
  assert.equal(isNavigation('/main-X.js'), false);
});

test('two build labels produce distinct service worker manifests', async () => {
  const config = JSON.parse(readFileSync('ngsw-config.json', 'utf8'));
  const fs = { list: async () => ['/index.html'], read: async () => '', hash: async () => 'same-code', write: async () => {} };
  const a = await new Generator(fs, '/').process({ ...config, appData: { release: 'QA11-A' } });
  const b = await new Generator(fs, '/').process({ ...config, appData: { release: 'QA11-B' } });
  assert.notEqual(JSON.stringify(a), JSON.stringify(b));
  assert.deepEqual(a.hashTable, b.hashTable);
});
