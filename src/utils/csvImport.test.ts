import test from 'node:test';
import assert from 'node:assert/strict';
import { 
  parseCsvRows, detectDelimiter, detectColumnTypes, 
  generateCsvImportSql, exportToSqlInserts 
} from './csvImport.ts';

test('csvImport: parseCsvRows parses comma delimited text with quotes', () => {
  const csv = 'name,age,notes\n"Alice, M.",30,"Likes ""SQL"""\nBob,25,"Normal note"';
  const rows = parseCsvRows(csv, ',');
  assert.equal(rows.length, 3);
  assert.deepEqual(rows[0], ['name', 'age', 'notes']);
  assert.equal(rows[1][0], 'Alice, M.');
  assert.equal(rows[1][1], '30');
  assert.equal(rows[1][2], 'Likes "SQL"');
  assert.equal(rows[2][0], 'Bob');
});

test('csvImport: detectDelimiter detects commas, tabs, and semicolons', () => {
  assert.equal(detectDelimiter('id,name,email\n1,a,b'), ',');
  assert.equal(detectDelimiter('id;name;email\n1;a;b'), ';');
  assert.equal(detectDelimiter('id\tname\temail\n1\ta\tb'), '\t');
});

test('csvImport: detectColumnTypes detects INTEGER, REAL, and TEXT', () => {
  const headers = ['id', 'price', 'username'];
  const rows = [
    ['1', '19.99', 'user_alpha'],
    ['2', '45.50', 'user_beta'],
    ['3', '100.00', 'user_gamma'],
  ];
  const types = detectColumnTypes(headers, rows);
  assert.equal(types[0].name, 'id');
  assert.equal(types[0].type, 'INTEGER');
  assert.equal(types[1].name, 'price');
  assert.equal(types[1].type, 'REAL');
  assert.equal(types[2].name, 'username');
  assert.equal(types[2].type, 'TEXT');
});

test('csvImport: generateCsvImportSql produces valid CREATE TABLE and INSERT statements', () => {
  const cols = [
    { name: 'id', type: 'INTEGER' },
    { name: 'name', type: 'TEXT' },
  ];
  const rows = [
    ['10', "O'Reilly"],
    ['20', 'Ada'],
  ];
  const sql = generateCsvImportSql('authors', cols, rows, { createNewTable: true });
  assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS "authors"'));
  assert.ok(sql.includes('INSERT INTO "authors" ("id", "name") VALUES (10, \'O\'\'Reilly\');'));
});

test('csvImport: exportToSqlInserts formats rows properly', () => {
  const cols = ['id', 'title', 'active'];
  const rows = [
    { id: 1, title: 'Item 1', active: true },
    { id: 2, title: 'Item 2', active: false },
  ];
  const sql = exportToSqlInserts('items', cols, rows);
  assert.ok(sql.includes('INSERT INTO "items" ("id", "title", "active") VALUES (1, \'Item 1\', 1);'));
  assert.ok(sql.includes('INSERT INTO "items" ("id", "title", "active") VALUES (2, \'Item 2\', 0);'));
});
