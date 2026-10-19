import test from 'node:test';
import assert from 'node:assert/strict';
import initSqlJs from 'sql.js';
import { executeSqlScript, extractSchema, seedSampleData } from './sqliteCore.ts';

test('sqliteCore: real SQLite execution with CHECK constraint and persistence', async () => {
  const SQL = await initSqlJs();
  const db = new SQL.Database();

  // 1. CREATE TABLE clients
  const createRes = executeSqlScript(
    db,
    'CREATE TABLE clients (id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE, age INTEGER CHECK (age >= 18));'
  );
  assert.equal(createRes.error, undefined);
  assert.equal(createRes.isMutated, true);

  // 2. INSERT two valid rows
  const insert1 = executeSqlScript(
    db,
    "INSERT INTO clients (name, email, age) VALUES ('Alice', 'alice@test.com', 25);"
  );
  assert.equal(insert1.error, undefined);

  const insert2 = executeSqlScript(
    db,
    "INSERT INTO clients (name, email, age) VALUES ('Bob', 'bob@test.com', 30);"
  );
  assert.equal(insert2.error, undefined);

  // 3. INSERT invalid row with age 15 -> must fail with real CHECK error
  const insertFail = executeSqlScript(
    db,
    "INSERT INTO clients (name, email, age) VALUES ('Charlie', 'charlie@test.com', 15);"
  );
  assert.ok(insertFail.error, 'Expected an error to be returned');
  assert.ok(
    insertFail.error.toLowerCase().includes('check constraint failed'),
    `Expected CHECK constraint failed in error, got: ${insertFail.error}`
  );

  // 4. SELECT * FROM clients -> shows exactly the 2 valid rows
  const selectRes = executeSqlScript(db, 'SELECT * FROM clients ORDER BY id ASC;');
  assert.equal(selectRes.error, undefined);
  assert.ok(selectRes.result);
  assert.equal(selectRes.result.rowCount, 2);
  assert.equal(selectRes.result.rows[0].name, 'Alice');
  assert.equal(selectRes.result.rows[0].age, 25);
  assert.equal(selectRes.result.rows[1].name, 'Bob');
  assert.equal(selectRes.result.rows[1].age, 30);

  // 5. Binary Export & Reload (Persistence confirmation)
  const binarySnapshot = db.export();
  assert.ok(binarySnapshot.byteLength > 0);

  const reloadedDb = new SQL.Database(binarySnapshot);
  const reloadedSelect = executeSqlScript(reloadedDb, 'SELECT * FROM clients ORDER BY id ASC;');
  assert.equal(reloadedSelect.error, undefined);
  assert.ok(reloadedSelect.result);
  assert.equal(reloadedSelect.result.rowCount, 2);
  assert.equal(reloadedSelect.result.rows[0].name, 'Alice');

  // 6. Schema Extraction
  const schema = extractSchema(reloadedDb, 'main');
  assert.equal(schema.tables.length, 1);
  assert.equal(schema.tables[0].name, 'clients');
  assert.equal(schema.tables[0].columns.length, 4);
  assert.equal(schema.tables[0].columns[0].isPrimaryKey, true);

  // 7. Read-Only Mode enforcement
  const readOnlyBlocked = executeSqlScript(
    reloadedDb,
    "INSERT INTO clients (name, email, age) VALUES ('Dave', 'dave@test.com', 40);",
    { isReadOnly: true }
  );
  assert.ok(readOnlyBlocked.error);
  assert.ok(readOnlyBlocked.error.includes('Read-Only mode'));

  // Cleanup
  db.close();
  reloadedDb.close();
});

test('sqliteCore: EXPLAIN QUERY PLAN extracts real plan steps', async () => {
  const SQL = await initSqlJs();
  const db = new SQL.Database();

  db.exec('CREATE TABLE products (id INTEGER PRIMARY KEY, sku TEXT, price REAL);');
  db.exec('CREATE INDEX idx_products_sku ON products(sku);');

  const explainRes = executeSqlScript(db, 'EXPLAIN QUERY PLAN SELECT * FROM products WHERE sku = "TEST";');
  assert.equal(explainRes.error, undefined);
  assert.ok(explainRes.explainPlan);
  assert.ok(explainRes.result);
  assert.ok(explainRes.result.rows.length > 0);

  db.close();
});
