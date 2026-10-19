import test from 'node:test';
import assert from 'node:assert/strict';
import { getSqlCompletions, formatSqlSimple, tokenizeSqlForHighlight } from './sqlTokenizer.ts';
const testSchema = {
  name: 'test_db',
  tables: [
    {
      name: 'customers',
      schema: 'main',
      type: 'table' as const,
      columns: [
        { name: 'id', type: 'INTEGER', nullable: false, isPrimaryKey: true },
        { name: 'email', type: 'TEXT', nullable: false, isPrimaryKey: false },
      ],
      indexes: [],
      rowCountEstimate: 10,
    },
  ],
  views: [],
  procedures: [],
};

test('getSqlCompletions: returns keyword suggestions for prefix', () => {
  const completions = getSqlCompletions('SEL', 3, testSchema);
  assert.ok(completions.some(c => c.label === 'SELECT' && c.type === 'keyword'));
});

test('getSqlCompletions: returns schema table suggestions', () => {
  const completions = getSqlCompletions('cust', 4, testSchema);
  assert.ok(completions.some(c => c.label === 'customers' && c.type === 'table'));
});

test('getSqlCompletions: returns column suggestions', () => {
  const completions = getSqlCompletions('email', 5, testSchema);
  assert.ok(completions.some(c => c.label === 'email' && c.type === 'column'));
});

test('formatSqlSimple: uppercases common keywords', () => {
  const unformatted = 'select id, email from customers where is_active = true limit 10;';
  const formatted = formatSqlSimple(unformatted);
  assert.ok(formatted.includes('SELECT'));
  assert.ok(formatted.includes('FROM'));
  assert.ok(formatted.includes('WHERE'));
  assert.ok(formatted.includes('LIMIT'));
});

test('tokenizeSqlForHighlight: handles unclosed strings and comments gracefully', () => {
  const tokens1 = tokenizeSqlForHighlight("SELECT 'unclosed string");
  assert.ok(tokens1.some((t: any) => t.type === 'string'));

  const tokens2 = tokenizeSqlForHighlight("/* unclosed block comment\nSELECT 1");
  assert.ok(tokens2.some((t: any) => t.type === 'comment'));

  const tokens3 = tokenizeSqlForHighlight("SELECT * FROM tbl WHERE id = ");
  assert.ok(tokens3.some((t: any) => t.type === 'operator' && t.text === '='));
});
