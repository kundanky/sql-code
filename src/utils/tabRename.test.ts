import { test } from 'node:test';
import assert from 'node:assert';
import { validateTabName } from './tabRename.ts';

test('validateTabName: appends .sql extension to bare name like "clients"', () => {
  const result = validateTabName('clients', ['Untitled-1.sql']);
  assert.strictEqual(result.valid, true);
  assert.strictEqual(result.finalName, 'clients.sql');
  assert.strictEqual(result.error, undefined);
});

test('validateTabName: preserves existing .sql extension', () => {
  const result = validateTabName('orders.sql', []);
  assert.strictEqual(result.valid, true);
  assert.strictEqual(result.finalName, 'orders.sql');
});

test('validateTabName: rejects empty or whitespace name', () => {
  const result = validateTabName('   ', []);
  assert.strictEqual(result.valid, false);
  assert.strictEqual(result.error, 'Name cannot be empty');
});

test('validateTabName: rejects invalid characters like "/" and "\\"', () => {
  const slashResult = validateTabName('my/query', []);
  assert.strictEqual(slashResult.valid, false);
  assert.strictEqual(slashResult.error, 'Invalid characters: / \\ : * ? " < > |');

  const colonResult = validateTabName('query:1', []);
  assert.strictEqual(colonResult.valid, false);
  assert.strictEqual(colonResult.error, 'Invalid characters: / \\ : * ? " < > |');
});

test('validateTabName: rejects duplicate names case-insensitively', () => {
  const result = validateTabName('Clients', ['clients.sql', 'schema.sql']);
  assert.strictEqual(result.valid, false);
  assert.strictEqual(result.error, 'Name already exists');
});
