import 'fake-indexeddb/auto';
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ensureRepoInit,
  stageFile,
  commitChanges,
  getCommitHistory,
  createBranch,
  listBranches,
  switchBranch,
  getCurrentBranch,
  mergeBranch,
} from './gitService.ts';
import { createFile, saveFile, readFile } from './fileStorage.ts';

const TEST_DIR = '/projects/GitTestRepo';

test('gitService: commit staged changes and log history', async () => {
  await ensureRepoInit(TEST_DIR);

  const testFile = `${TEST_DIR}/schema.sql`;
  await createFile(testFile, 'CREATE TABLE users (id INT PRIMARY KEY);');
  await stageFile('schema.sql', TEST_DIR);

  const commitSha = await commitChanges('Initial commit: add users table', TEST_DIR);
  assert.ok(commitSha && commitSha.length > 0);

  const history = await getCommitHistory(TEST_DIR);
  assert.ok(history.length >= 1);
  assert.ok(history[0].message.includes('Initial commit'));
});

test('gitService: branch creation and switching', async () => {
  await ensureRepoInit(TEST_DIR);

  // Create branch
  const branchName = 'feature/products';
  await createBranch(branchName, TEST_DIR);

  const branches = await listBranches(TEST_DIR);
  assert.ok(branches.includes(branchName));

  // Switch branch
  await switchBranch(branchName, TEST_DIR);
  const current = await getCurrentBranch(TEST_DIR);
  assert.equal(current, branchName);

  // Add commit on feature branch
  await createFile(`${TEST_DIR}/products.sql`, 'CREATE TABLE products (sku TEXT);');
  await stageFile('products.sql', TEST_DIR);
  await commitChanges('feat: add products schema', TEST_DIR);
});

test('gitService: merge feature branch into main', async () => {
  await ensureRepoInit(TEST_DIR);

  // Switch back to main
  await switchBranch('main', TEST_DIR);
  const current = await getCurrentBranch(TEST_DIR);
  assert.equal(current, 'main');

  // Merge feature branch
  const result = await mergeBranch('feature/products', TEST_DIR);
  assert.equal(result.success, true);

  // Verify merged file exists in working tree
  const productsSql = await readFile(`${TEST_DIR}/products.sql`);
  assert.ok(productsSql.includes('CREATE TABLE products'));
});
