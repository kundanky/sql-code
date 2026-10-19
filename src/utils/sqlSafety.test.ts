import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeSqlSafety } from './sqlSafety.ts';

test('analyzeSqlSafety: identifies safe SELECT queries', () => {
  const query = 'SELECT id, email, full_name FROM customers WHERE is_active = true ORDER BY created_at DESC LIMIT 50;';
  const result = analyzeSqlSafety(query);
  assert.equal(result.isDestructive, false);
  assert.equal(result.riskLevel, 'safe');
  assert.equal(result.reasons.length, 0);
});

test('analyzeSqlSafety: identifies DROP TABLE as high risk', () => {
  const query = 'DROP TABLE customers CASCADE;';
  const result = analyzeSqlSafety(query);
  assert.equal(result.isDestructive, true);
  assert.equal(result.riskLevel, 'high');
  assert.equal(result.requiredConfirmationPhrase, 'EXECUTE DESTRUCTIVE');
});

test('analyzeSqlSafety: identifies DROP DATABASE as critical risk', () => {
  const query = 'DROP DATABASE production_sales;';
  const result = analyzeSqlSafety(query);
  assert.equal(result.isDestructive, true);
  assert.equal(result.riskLevel, 'critical');
  assert.equal(result.requiredConfirmationPhrase, 'CONFIRM DROP DATABASE');
});

test('analyzeSqlSafety: catches DELETE without WHERE clause', () => {
  const query = 'DELETE FROM order_items;';
  const result = analyzeSqlSafety(query);
  assert.equal(result.isDestructive, true);
  assert.equal(result.riskLevel, 'high');
  assert.ok(result.reasons.some(r => r.includes('without a WHERE clause')));
});

test('analyzeSqlSafety: allows DELETE with WHERE clause without flagging unbounded delete', () => {
  const query = 'DELETE FROM order_items WHERE order_id = 9002;';
  const result = analyzeSqlSafety(query);
  assert.equal(result.isDestructive, false);
});

test('analyzeSqlSafety: catches UPDATE without WHERE clause', () => {
  const query = 'UPDATE products SET stock_quantity = 0;';
  const result = analyzeSqlSafety(query);
  assert.equal(result.isDestructive, true);
  assert.equal(result.riskLevel, 'high');
});
