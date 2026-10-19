import { SnippetItem } from '../types/index.ts';

export const DEFAULT_SNIPPETS: SnippetItem[] = [
  {
    id: 'snip-select',
    title: 'SELECT with LIMIT',
    prefix: 'sel',
    description: 'Basic SELECT statement with limit and sorting',
    sql: 'SELECT * FROM table_name\nWHERE 1=1\nORDER BY id DESC\nLIMIT 50;',
  },
  {
    id: 'snip-join',
    title: 'INNER JOIN Query',
    prefix: 'join',
    description: 'Join two tables on primary and foreign keys',
    sql: 'SELECT a.*, b.*\nFROM table_a a\nJOIN table_b b ON a.id = b.a_id\nLIMIT 50;',
  },
  {
    id: 'snip-cte',
    title: 'Common Table Expression (WITH)',
    prefix: 'cte',
    description: 'Modular Common Table Expression for readable subqueries',
    sql: 'WITH aggregated_data AS (\n  SELECT category_id, COUNT(*) AS item_count, AVG(price) AS avg_price\n  FROM products\n  GROUP BY category_id\n)\nSELECT *\nFROM aggregated_data\nWHERE item_count > 5;',
  },
  {
    id: 'snip-window',
    title: 'Window Function (ROW_NUMBER)',
    prefix: 'win',
    description: 'Calculate row ranks partitioned by group',
    sql: 'SELECT id, category_id, price,\n  ROW_NUMBER() OVER (PARTITION BY category_id ORDER BY price DESC) AS rank_in_cat\nFROM products;',
  },
  {
    id: 'snip-create-table',
    title: 'CREATE TABLE with Constraints',
    prefix: 'create',
    description: 'Create a table with primary key, foreign key, and checks',
    sql: 'CREATE TABLE IF NOT EXISTS items (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  name TEXT NOT NULL,\n  sku TEXT UNIQUE NOT NULL,\n  price REAL NOT NULL CHECK (price >= 0),\n  created_at TEXT DEFAULT (datetime(\'now\'))\n);',
  },
  {
    id: 'snip-create-index',
    title: 'CREATE INDEX',
    prefix: 'idx',
    description: 'Create an index for fast lookup performance',
    sql: 'CREATE INDEX IF NOT EXISTS idx_items_sku ON items (sku);',
  },
  {
    id: 'snip-transaction',
    title: 'Atomic Transaction',
    prefix: 'txn',
    description: 'Wrap operations in a safe BEGIN ... COMMIT block',
    sql: 'BEGIN TRANSACTION;\n\n-- Statements here\n\nCOMMIT;',
  },
  {
    id: 'snip-group-having',
    title: 'GROUP BY with HAVING',
    prefix: 'group',
    description: 'Group rows and filter aggregated metrics',
    sql: 'SELECT category, COUNT(*) AS total_count, SUM(amount) AS total_val\nFROM sales\nGROUP BY category\nHAVING COUNT(*) > 1\nORDER BY total_val DESC;',
  },
];
