import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { offlineStorage } from './indexedDBStorage.ts';

test('offlineStorage: sets and retrieves item in memory fallback', async () => {
  await offlineStorage.setItem('test_key', { foo: 'bar', timestamp: 12345 });
  const val = await offlineStorage.getItem('test_key', null);
  assert.deepEqual(val, { foo: 'bar', timestamp: 12345 });
});

test('offlineStorage: returns defaultValue when item is not set', async () => {
  const defaultVal = { empty: true };
  const val = await offlineStorage.getItem('non_existent_key_xyz', defaultVal);
  assert.deepEqual(val, defaultVal);
});

test('PWA manifest: contains required installability fields', () => {
  const manifestPath = path.resolve('public/manifest.webmanifest');
  assert.ok(fs.existsSync(manifestPath), 'manifest.webmanifest exists');

  const content = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  assert.equal(content.name, 'SQL CODE');
  assert.equal(content.short_name, 'SQL CODE');
  assert.equal(content.display, 'standalone');
  assert.equal(content.start_url, '/');
  assert.equal(content.scope, '/');
  assert.ok(content.icons && content.icons.length >= 3, 'Manifest has required icon resolutions');

  const has192 = content.icons.some((i: any) => i.sizes === '192x192');
  const has512 = content.icons.some((i: any) => i.sizes === '512x512');
  const hasMaskable = content.icons.some((i: any) => i.purpose === 'maskable');

  assert.ok(has192, 'Manifest includes 192x192 icon');
  assert.ok(has512, 'Manifest includes 512x512 icon');
  assert.ok(hasMaskable, 'Manifest includes maskable icon');
});

test('PWA Service Worker: sw.js file exists with caching strategies', () => {
  const swPath = path.resolve('public/sw.js');
  assert.ok(fs.existsSync(swPath), 'public/sw.js exists');

  const content = fs.readFileSync(swPath, 'utf-8');
  assert.ok(content.includes('CACHE_VERSION'), 'Contains CACHE_VERSION');
  assert.ok(content.includes('caches.open'), 'Contains caches.open');
  assert.ok(content.includes('SKIP_WAITING'), 'Handles SKIP_WAITING update message');
});

test('Capacitor configuration: capacitor.config.ts matches bundle ID and webDir', () => {
  const capPath = path.resolve('capacitor.config.ts');
  assert.ok(fs.existsSync(capPath), 'capacitor.config.ts exists');

  const content = fs.readFileSync(capPath, 'utf-8');
  assert.ok(content.includes('com.sqlcode.app'), 'Includes appId com.sqlcode.app');
  assert.ok(content.includes('SQL CODE'), 'Includes appName SQL CODE');
  assert.ok(content.includes("'dist'"), 'Points webDir to dist');
});
