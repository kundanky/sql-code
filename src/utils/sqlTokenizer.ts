import type { DatabaseSchema } from '../types/index.ts';

export interface SuggestionItem {
  label: string;
  type: 'keyword' | 'table' | 'column' | 'function' | 'snippet';
  detail?: string;
  insertText?: string;
}

const COMMON_KEYWORDS = [
  'SELECT', 'FROM', 'WHERE', 'JOIN', 'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN',
  'GROUP BY', 'ORDER BY', 'HAVING', 'LIMIT', 'OFFSET', 'UNION ALL', 'INSERT INTO',
  'UPDATE', 'DELETE FROM', 'CREATE TABLE', 'DROP TABLE', 'ALTER TABLE', 'INDEX',
  'VALUES', 'DISTINCT', 'AS', 'ON', 'AND', 'OR', 'NOT', 'IN', 'EXISTS', 'BETWEEN',
  'LIKE', 'IS NULL', 'IS NOT NULL', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END'
];

const COMMON_FUNCTIONS = [
  'COUNT(*)', 'SUM()', 'AVG()', 'MIN()', 'MAX()', 'COALESCE()', 'ROUND()',
  'CONCAT()', 'NOW()', 'DATE_TRUNC()', 'SUBSTRING()', 'LOWER()', 'UPPER()',
  'ROW_NUMBER() OVER ()', 'JSON_AGG()', 'TO_CHAR()'
];

const SQL_SNIPPETS: SuggestionItem[] = [
  {
    label: 'sel (Select all)',
    type: 'snippet',
    detail: 'SELECT * FROM table LIMIT 50;',
    insertText: 'SELECT *\nFROM ${1:table}\nLIMIT 50;'
  },
  {
    label: 'join (Inner Join)',
    type: 'snippet',
    detail: 'INNER JOIN t2 ON t1.id = t2.ref_id',
    insertText: 'INNER JOIN ${1:table} ON ${2:condition}'
  },
  {
    label: 'grp (Group by count)',
    type: 'snippet',
    detail: 'GROUP BY col ORDER BY count DESC',
    insertText: 'GROUP BY ${1:column}\nORDER BY count DESC;'
  }
];

/**
 * Computes autocomplete suggestions based on current word prefix and database schema.
 */
export function getSqlCompletions(
  query: string,
  cursorIndex: number,
  schema?: DatabaseSchema
): SuggestionItem[] {
  // Extract word before cursor
  const textBefore = query.slice(0, cursorIndex);
  const match = textBefore.match(/([a-zA-Z0-9_.*]+)$/);
  const currentWord = match ? match[1] : '';

  const lowerWord = currentWord.toLowerCase();
  const suggestions: SuggestionItem[] = [];

  // 1. Schema Tables and Views
  if (schema) {
    for (const table of schema.tables) {
      if (!lowerWord || table.name.toLowerCase().includes(lowerWord)) {
        suggestions.push({
          label: table.name,
          type: 'table',
          detail: `Table (${table.columns.length} cols, ~${table.rowCountEstimate} rows)`,
          insertText: table.name
        });
      }

      // If user typed table.column, or just column search
      for (const col of table.columns) {
        if (!lowerWord || col.name.toLowerCase().includes(lowerWord)) {
          suggestions.push({
            label: col.name,
            type: 'column',
            detail: `${col.type} in ${table.name}${col.isPrimaryKey ? ' [PK]' : ''}`,
            insertText: col.name
          });
        }
      }
    }

    for (const view of schema.views) {
      if (!lowerWord || view.name.toLowerCase().includes(lowerWord)) {
        suggestions.push({
          label: view.name,
          type: 'table',
          detail: `View (${view.columns.length} cols)`,
          insertText: view.name
        });
      }
    }
  }

  // 2. Keywords
  for (const kw of COMMON_KEYWORDS) {
    if (!lowerWord || kw.toLowerCase().startsWith(lowerWord) || kw.toLowerCase().includes(lowerWord)) {
      suggestions.push({
        label: kw,
        type: 'keyword',
        detail: 'SQL Keyword',
        insertText: kw
      });
    }
  }

  // 3. Functions
  for (const fn of COMMON_FUNCTIONS) {
    if (!lowerWord || fn.toLowerCase().startsWith(lowerWord)) {
      suggestions.push({
        label: fn,
        type: 'function',
        detail: 'SQL Function',
        insertText: fn.endsWith('()') ? fn.slice(0, -1) : fn
      });
    }
  }

  // 4. Snippets
  for (const snip of SQL_SNIPPETS) {
    if (!lowerWord || snip.label.toLowerCase().includes(lowerWord)) {
      suggestions.push(snip);
    }
  }

  // Limit suggestions for touch performance
  return suggestions.slice(0, 15);
}

/**
 * Simple SQL dialect formatting helper
 */
export function formatSqlSimple(sql: string): string {
  if (!sql.trim()) return '';

  const keywords = [
    'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'GROUP BY', 'ORDER BY', 
    'HAVING', 'LIMIT', 'OFFSET', 'JOIN', 'LEFT JOIN', 'RIGHT JOIN', 
    'INNER JOIN', 'OUTER JOIN', 'UNION ALL', 'UNION', 'INSERT INTO', 
    'VALUES', 'UPDATE', 'SET', 'DELETE FROM'
  ];

  let formatted = sql.trim();

  // Replace common keywords with uppercase
  for (const kw of keywords) {
    const regex = new RegExp(`\\b${kw}\\b`, 'gi');
    formatted = formatted.replace(regex, kw);
  }

  return formatted;
}

export type SqlTokenType =
  | 'keyword'
  | 'type'
  | 'function'
  | 'string'
  | 'number'
  | 'comment'
  | 'operator'
  | 'plain';

export interface SqlToken {
  text: string;
  type: SqlTokenType;
}

const HIGHLIGHT_KEYWORDS = new Set([
  'SELECT', 'FROM', 'WHERE', 'JOIN', 'INNER', 'LEFT', 'RIGHT', 'FULL', 'OUTER', 'ON',
  'AND', 'OR', 'NOT', 'IN', 'EXISTS', 'BETWEEN', 'LIKE', 'IS', 'NULL', 'GROUP', 'BY',
  'ORDER', 'HAVING', 'LIMIT', 'OFFSET', 'UNION', 'ALL', 'INSERT', 'INTO', 'VALUES',
  'UPDATE', 'SET', 'DELETE', 'CREATE', 'TABLE', 'DROP', 'ALTER', 'ADD', 'CONSTRAINT',
  'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES', 'CHECK', 'UNIQUE', 'DEFAULT', 'INDEX',
  'VIEW', 'PROCEDURE', 'FUNCTION', 'TRIGGER', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END',
  'AS', 'WITH', 'DISTINCT', 'SHOW', 'DESCRIBE', 'EXPLAIN', 'ANALYZE'
]);

const HIGHLIGHT_TYPES = new Set([
  'INT', 'INTEGER', 'BIGINT', 'SMALLINT', 'TINYINT', 'SERIAL', 'BIGSERIAL',
  'VARCHAR', 'CHAR', 'TEXT', 'BOOLEAN', 'BOOL', 'NUMERIC', 'DECIMAL', 'FLOAT',
  'DOUBLE', 'REAL', 'DATE', 'TIME', 'TIMESTAMP', 'TIMESTAMPTZ', 'UUID', 'JSON',
  'JSONB', 'BYTEA', 'BLOB', 'VOID'
]);

const HIGHLIGHT_FUNCTIONS = new Set([
  'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'ROUND', 'COALESCE', 'CONCAT', 'NOW',
  'DATE_TRUNC', 'SUBSTRING', 'LOWER', 'UPPER', 'ROW_NUMBER', 'OVER'
]);

export function tokenizeSqlForHighlight(sql: string): SqlToken[] {
  if (!sql) return [];
  // Resilient tokenizer supporting complete and incomplete/partial strings, comments, operators, numbers, and identifiers
  const regex = /(--[^\r\n]*|\/\*[\s\S]*?(?:\*\/|$)|'(?:[^'\\]|\\.)*'?|"(?:[^"\\]|\\.)*"?|\b\d+(?:\.\d+)?\b|[=<>!+\-*\/%&|^~]+|\b[A-Za-z_][A-Za-z0-9_]*\b|[^\s\w]+|\s+)/gy;
  const tokens: SqlToken[] = [];
  let match: RegExpExecArray | null;

  while (regex.lastIndex < sql.length) {
    const prevIndex = regex.lastIndex;
    match = regex.exec(sql);
    if (!match || regex.lastIndex === prevIndex) {
      // Fallback: advance 1 char if regex stalled on unknown character
      tokens.push({ text: sql[prevIndex], type: 'plain' });
      regex.lastIndex = prevIndex + 1;
      continue;
    }

    const text = match[0];
    let type: SqlTokenType = 'plain';

    if (text.startsWith('--') || text.startsWith('/*')) {
      type = 'comment';
    } else if (text.startsWith("'") || text.startsWith('"')) {
      type = 'string';
    } else if (/^\d+(\.\d+)?$/.test(text)) {
      type = 'number';
    } else if (/^[=<>!+\-*\/%&|^~]+$/.test(text)) {
      type = 'operator';
    } else {
      const upper = text.toUpperCase();
      if (HIGHLIGHT_KEYWORDS.has(upper)) {
        type = 'keyword';
      } else if (HIGHLIGHT_TYPES.has(upper)) {
        type = 'type';
      } else if (HIGHLIGHT_FUNCTIONS.has(upper)) {
        type = 'function';
      }
    }

    tokens.push({ text, type });
  }

  return tokens;
}
