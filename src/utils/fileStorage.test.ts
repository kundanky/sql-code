import 'fake-indexeddb/auto';
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createFile,
  readFile,
  saveFile,
  renameItem,
  deleteItem,
  createFolder,
  listFiles,
  duplicateFile,
  searchFiles,
} from './fileStorage.ts';

test('fileStorage: create and read file', async () => {
  const path = '/projects/Default/test_query.sql';
  const initialSql = 'SELECT 1 AS alive;';
  await createFile(path, initialSql);

  const readBack = await readFile(path);
  assert.equal(readBack, initialSql);
});

test('fileStorage: save updated content to file', async () => {
  const path = '/projects/Default/test_save.sql';
  await createFile(path, 'SELECT 1;');

  const updatedSql = 'SELECT * FROM users WHERE active = true;';
  await saveFile(path, updatedSql);

  const readBack = await readFile(path);
  assert.equal(readBack, updatedSql);
});

test('fileStorage: rename file', async () => {
  const oldPath = '/projects/Default/rename_me.sql';
  const newPath = '/projects/Default/renamed_done.sql';
  await createFile(oldPath, 'SELECT * FROM accounts;');

  await renameItem(oldPath, newPath);

  const readBack = await readFile(newPath);
  assert.equal(readBack, 'SELECT * FROM accounts;');

  let oldExists = true;
  try {
    await readFile(oldPath);
  } catch {
    oldExists = false;
  }
  assert.equal(oldExists, false);
});

test('fileStorage: delete file', async () => {
  const path = '/projects/Default/delete_me.sql';
  await createFile(path, 'DROP ME;');

  await deleteItem(path);

  let exists = true;
  try {
    await readFile(path);
  } catch {
    exists = false;
  }
  assert.equal(exists, false);
});

test('fileStorage: duplicate file and search', async () => {
  const path = '/projects/Default/dup_source.sql';
  await createFile(path, 'SELECT count(*) FROM orders;');

  const dupPath = await duplicateFile(path);
  assert.ok(dupPath.includes('dup_source_copy'));

  const dupContent = await readFile(dupPath);
  assert.equal(dupContent, 'SELECT count(*) FROM orders;');

  // Search by name
  const nameResults = await searchFiles('dup_source', false);
  assert.ok(nameResults.length >= 2);

  // Search by content
  const contentResults = await searchFiles('count(*)', true);
  assert.ok(contentResults.some((r) => r.path === path));
});
