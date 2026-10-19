import { 
  DatabaseSchema, TableDefinition, ColumnDefinition, IndexDefinition, 
  QueryResult, ExplainPlanNode 
} from '../types/index.ts';

/**
 * Checks if SQL statement contains mutation commands.
 */
export function isWriteStatement(sql: string): boolean {
  const sanitized = sql
    .replace(/--.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .trim();
  return /\b(INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE|REPLACE|VACUUM|REINDEX)\b/i.test(sanitized);
}

/**
 * Parses SQLite error messages and extracts line numbers if available.
 */
export function parseSqliteError(err: any): { message: string; line?: number } {
  const msg = err?.message || String(err || 'Unknown SQLite error');
  // SQLite error pattern: "near \"XYZ\": syntax error at line 4" or similar
  const lineMatch = msg.match(/\bat line (\d+)\b/i) || msg.match(/:(\d+):/);
  const line = lineMatch ? parseInt(lineMatch[1], 10) : undefined;
  return { message: msg, line };
}

/**
 * Parses EXPLAIN QUERY PLAN output from SQLite into ExplainPlanNode tree.
 */
export function parseExplainPlan(columns: string[], values: any[][]): ExplainPlanNode | null {
  if (!values || values.length === 0) return null;

  // Expected columns: [id, parent, notused, detail]
  const idIdx = columns.indexOf('id');
  const parentIdx = columns.indexOf('parent');
  const detailIdx = columns.indexOf('detail');

  const nodesMap = new Map<number, ExplainPlanNode>();
  const rootNodes: ExplainPlanNode[] = [];

  for (const row of values) {
    const id = idIdx >= 0 ? Number(row[idIdx]) : 0;
    const parent = parentIdx >= 0 ? Number(row[parentIdx]) : 0;
    const detail = detailIdx >= 0 ? String(row[detailIdx]) : String(row[0]);

    // Determine nodeType from detail text
    let nodeType = 'STEP';
    let relationName: string | undefined;

    if (/^SCAN\s+([`"[\]\w.]+)/i.test(detail)) {
      const match = detail.match(/^SCAN\s+([`"[\]\w.]+)/i);
      nodeType = 'TABLE SCAN';
      relationName = match ? match[1] : undefined;
    } else if (/^SEARCH\s+([`"[\]\w.]+)/i.test(detail)) {
      const match = detail.match(/^SEARCH\s+([`"[\]\w.]+)/i);
      nodeType = 'INDEX SEARCH';
      relationName = match ? match[1] : undefined;
    } else if (/USE TEMP B-TREE/i.test(detail)) {
      nodeType = 'SORT / B-TREE';
    } else if (/SUBQUERY/i.test(detail)) {
      nodeType = 'SUBQUERY';
    } else if (/COMPOUND QUERY/i.test(detail)) {
      nodeType = 'COMPOUND';
    }

    const node: ExplainPlanNode = {
      id,
      parent,
      detail,
      nodeType,
      relationName,
      children: [],
    };

    nodesMap.set(id, node);
  }

  // Build tree
  for (const node of nodesMap.values()) {
    if (node.parent && node.parent !== 0 && nodesMap.has(node.parent)) {
      nodesMap.get(node.parent)!.children!.push(node);
    } else {
      rootNodes.push(node);
    }
  }

  if (rootNodes.length === 1) {
    return rootNodes[0];
  }

  // Wrap in virtual root if multiple top-level steps
  return {
    nodeType: 'QUERY EXECUTION PLAN',
    detail: 'SQLite Query Planner Order',
    children: rootNodes,
  };
}

/**
 * Extracts complete real database schema from sqlite_master and PRAGMA table_info.
 */
export function extractSchema(db: any, dbName: string): DatabaseSchema {
  try {
    // 1. Fetch all user tables and views from sqlite_master
    const masterQuery = `
      SELECT type, name, tbl_name 
      FROM sqlite_master 
      WHERE type IN ('table', 'view') 
        AND name NOT LIKE 'sqlite_%'
      ORDER BY name ASC;
    `;
    const masterRes = db.exec(masterQuery);

    const tables: TableDefinition[] = [];
    const views: TableDefinition[] = [];

    if (!masterRes || masterRes.length === 0 || !masterRes[0].values) {
      return { name: dbName, tables: [], views: [], procedures: [] };
    }

    const rows = masterRes[0].values;
    for (const row of rows) {
      const type = String(row[0]);
      const name = String(row[1]);

      // 2. Fetch column definitions using PRAGMA table_info
      const colsRes = db.exec(`PRAGMA table_info("${name.replace(/"/g, '""')}");`);
      const columns: ColumnDefinition[] = [];

      // 3. Fetch foreign keys using PRAGMA foreign_key_list
      const fkRes = db.exec(`PRAGMA foreign_key_list("${name.replace(/"/g, '""')}");`);
      const fksByColumn = new Map<string, { table: string; column: string }>();

      if (fkRes && fkRes.length > 0 && fkRes[0].values) {
        // columns: id, seq, table, from, to, on_update, on_delete, match
        const fromIdx = fkRes[0].columns.indexOf('from');
        const toIdx = fkRes[0].columns.indexOf('to');
        const targetTblIdx = fkRes[0].columns.indexOf('table');

        for (const fkRow of fkRes[0].values) {
          const fromCol = String(fkRow[fromIdx]);
          const toCol = String(fkRow[toIdx] || 'id');
          const targetTable = String(fkRow[targetTblIdx]);
          fksByColumn.set(fromCol, { table: targetTable, column: toCol });
        }
      }

      if (colsRes && colsRes.length > 0 && colsRes[0].values) {
        // PRAGMA table_info columns: cid, name, type, notnull, dflt_value, pk
        const nameIdx = colsRes[0].columns.indexOf('name');
        const typeIdx = colsRes[0].columns.indexOf('type');
        const notnullIdx = colsRes[0].columns.indexOf('notnull');
        const dfltIdx = colsRes[0].columns.indexOf('dflt_value');
        const pkIdx = colsRes[0].columns.indexOf('pk');

        for (const cRow of colsRes[0].values) {
          const colName = String(cRow[nameIdx]);
          const colType = String(cRow[typeIdx] || 'TEXT').toUpperCase();
          const notNull = Number(cRow[notnullIdx]) === 1;
          const defaultValue = cRow[dfltIdx] !== null ? String(cRow[dfltIdx]) : undefined;
          const isPrimaryKey = Number(cRow[pkIdx]) > 0;
          const fk = fksByColumn.get(colName);

          columns.push({
            name: colName,
            type: colType || 'TEXT',
            nullable: !notNull,
            isPrimaryKey,
            defaultValue,
            isForeignKey: !!fk,
            foreignKeyTarget: fk,
          });
        }
      }

      // 4. Fetch indexes using PRAGMA index_list
      const indexes: IndexDefinition[] = [];
      try {
        const idxRes = db.exec(`PRAGMA index_list("${name.replace(/"/g, '""')}");`);
        if (idxRes && idxRes.length > 0 && idxRes[0].values) {
          const idxNameIdx = idxRes[0].columns.indexOf('name');
          const uniqueIdx = idxRes[0].columns.indexOf('unique');

          for (const idxRow of idxRes[0].values) {
            const idxName = String(idxRow[idxNameIdx]);
            const isUnique = Number(idxRow[uniqueIdx]) === 1;

            // Fetch columns of index
            const infoRes = db.exec(`PRAGMA index_info("${idxName.replace(/"/g, '""')}");`);
            const idxCols: string[] = [];
            if (infoRes && infoRes.length > 0 && infoRes[0].values) {
              const colNameIdx = infoRes[0].columns.indexOf('name');
              for (const infoRow of infoRes[0].values) {
                idxCols.push(String(infoRow[colNameIdx]));
              }
            }

            indexes.push({
              name: idxName,
              columns: idxCols,
              isUnique,
              type: isUnique ? 'UNIQUE' : 'BTREE',
            });
          }
        }
      } catch {
        // Indexes check may fail for some views, which is safe to ignore
      }

      // 5. Get accurate row count
      let rowCount = 0;
      try {
        const countRes = db.exec(`SELECT COUNT(*) FROM "${name.replace(/"/g, '""')}";`);
        if (countRes && countRes[0]?.values?.[0]?.[0] !== undefined) {
          rowCount = Number(countRes[0].values[0][0]);
        }
      } catch {
        rowCount = 0;
      }

      const tableDef: TableDefinition = {
        name,
        schema: 'main',
        type: type === 'view' ? 'view' : 'table',
        columns,
        indexes,
        rowCountEstimate: rowCount,
      };

      if (type === 'view') {
        views.push(tableDef);
      } else {
        tables.push(tableDef);
      }
    }

    return {
      name: dbName,
      tables,
      views,
      procedures: [],
    };
  } catch (err) {
    console.warn('[SQLite] Error extracting schema:', err);
    return { name: dbName, tables: [], views: [], procedures: [] };
  }
}

/**
 * Executes a SQL string in SQLite.
 */
export function executeSqlScript(
  db: any,
  sql: string,
  options?: { isReadOnly?: boolean }
): {
  result?: QueryResult;
  explainPlan?: ExplainPlanNode;
  error?: string;
  affectedRows: number;
  isMutated: boolean;
  executionTimeMs: number;
} {
  const startTime = performance.now();
  const trimmed = sql.trim();

  if (!trimmed) {
    return {
      result: {
        columns: [],
        rows: [],
        rowCount: 0,
        affectedRows: 0,
        executionTimeMs: 0,
        command: 'EMPTY',
      },
      affectedRows: 0,
      isMutated: false,
      executionTimeMs: 0,
    };
  }

  // 1. Check Read-Only Mode enforcement
  if (options?.isReadOnly && isWriteStatement(trimmed)) {
    return {
      error: 'Database is in Read-Only mode. Write operations are blocked.',
      affectedRows: 0,
      isMutated: false,
      executionTimeMs: Math.round((performance.now() - startTime) * 100) / 100,
    };
  }

  const isExplain = /^EXPLAIN(\s+QUERY\s+PLAN)?\b/i.test(trimmed);

  try {
    const rawResults = db.exec(trimmed);
    const executionTimeMs = Math.round((performance.now() - startTime) * 100) / 100;
    const affectedRows = db.getRowsModified ? db.getRowsModified() : 0;
    const isMutated = isWriteStatement(trimmed);

    // If query was EXPLAIN QUERY PLAN, build plan node
    let explainPlan: ExplainPlanNode | undefined;
    if (isExplain && rawResults && rawResults.length > 0) {
      const planRes = rawResults[0];
      const parsedPlan = parseExplainPlan(planRes.columns, planRes.values);
      if (parsedPlan) {
        explainPlan = parsedPlan;
      }
    }

    // Process output rows
    if (rawResults && rawResults.length > 0) {
      // Pick last statement result set if multiple were executed
      const lastResult = rawResults[rawResults.length - 1];
      const columns = lastResult.columns.map((c: string) => ({
        name: c,
        type: 'TEXT',
      }));

      const rows = lastResult.values.map((row: any[]) => {
        const obj: Record<string, any> = {};
        lastResult.columns.forEach((col: string, idx: number) => {
          obj[col] = row[idx];
        });
        return obj;
      });

      return {
        result: {
          columns,
          rows,
          rowCount: rows.length,
          affectedRows,
          executionTimeMs,
          command: isExplain ? 'EXPLAIN' : 'SELECT',
        },
        explainPlan,
        affectedRows,
        isMutated,
        executionTimeMs,
      };
    }

    // DDL or DML without returned rows
    const firstWordMatch = trimmed.match(/^([A-Z]+)/i);
    const command = firstWordMatch ? firstWordMatch[1].toUpperCase() : 'OK';

    return {
      result: {
        columns: [
          { name: 'status', type: 'TEXT' },
          { name: 'affected_rows', type: 'INTEGER' },
        ],
        rows: [
          {
            status: `${command} completed successfully`,
            affected_rows: affectedRows,
          },
        ],
        rowCount: 1,
        affectedRows,
        executionTimeMs,
        command,
      },
      affectedRows,
      isMutated,
      executionTimeMs,
    };
  } catch (err: any) {
    const executionTimeMs = Math.round((performance.now() - startTime) * 100) / 100;
    const parsed = parseSqliteError(err);
    return {
      error: parsed.message,
      affectedRows: 0,
      isMutated: false,
      executionTimeMs,
    };
  }
}

/**
 * Seeds a clean, realistic e-commerce database with foreign keys and sample rows.
 */
export function seedSampleData(db: any): void {
  const script = `
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      sku TEXT UNIQUE NOT NULL,
      price REAL NOT NULL CHECK (price >= 0),
      stock INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      tier TEXT DEFAULT 'bronze',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
      order_date TEXT DEFAULT (datetime('now')),
      total_amount REAL NOT NULL DEFAULT 0.0,
      status TEXT DEFAULT 'pending'
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES products(id) ON DELETE RESTRICT,
      quantity INTEGER NOT NULL CHECK (quantity > 0),
      unit_price REAL NOT NULL
    );

    -- Seed Data
    INSERT OR IGNORE INTO categories (id, name, slug) VALUES 
      (1, 'Electronics', 'electronics'),
      (2, 'Accessories', 'accessories'),
      (3, 'Apparel', 'apparel');

    INSERT OR IGNORE INTO products (id, category_id, name, sku, price, stock) VALUES
      (1, 1, 'Mechanical Keyboard', 'KB-MECH-01', 129.99, 45),
      (2, 1, 'UltraWide Monitor', 'MON-34-UW', 499.00, 18),
      (3, 2, 'Ergonomic Mousepad', 'PAD-ERGO-XL', 24.50, 120),
      (4, 2, 'USB-C Multi-Hub', 'HUB-USBC-7', 59.99, 80),
      (5, 3, 'Developer Hoodie', 'HOOD-DEV-BLK', 68.00, 35);

    INSERT OR IGNORE INTO customers (id, name, email, tier) VALUES
      (1, 'Alice Developer', 'alice@example.com', 'platinum'),
      (2, 'Bob Architect', 'bob@example.com', 'gold'),
      (3, 'Charlie Engineer', 'charlie@example.com', 'silver'),
      (4, 'Diana Systems', 'diana@example.com', 'bronze');

    INSERT OR IGNORE INTO orders (id, customer_id, total_amount, status) VALUES
      (101, 1, 628.99, 'delivered'),
      (102, 2, 84.49, 'delivered'),
      (103, 3, 499.00, 'processing'),
      (104, 1, 24.50, 'shipped');

    INSERT OR IGNORE INTO order_items (id, order_id, product_id, quantity, unit_price) VALUES
      (1, 101, 1, 1, 129.99),
      (2, 101, 2, 1, 499.00),
      (3, 102, 3, 1, 24.50),
      (4, 102, 4, 1, 59.99),
      (5, 103, 2, 1, 499.00),
      (6, 104, 3, 1, 24.50);

    -- Sample View
    CREATE VIEW IF NOT EXISTS v_customer_spending AS
    SELECT 
      c.id AS customer_id,
      c.name,
      c.email,
      c.tier,
      COUNT(o.id) AS total_orders,
      COALESCE(SUM(o.total_amount), 0) AS lifetime_spent
    FROM customers c
    LEFT JOIN orders o ON c.id = o.customer_id
    GROUP BY c.id;
  `;

  db.exec(script);
}

/**
 * Checks a user's practice query against expected solution on an isolated database.
 */
export function checkPracticeChallenge(
  SQL: any,
  seedSql: string,
  userSql: string,
  solutionSql: string
): {
  passed: boolean;
  userRows: any[];
  expectedRows: any[];
  userColumns: string[];
  expectedColumns: string[];
  error?: string;
  diffMessage?: string;
} {
  let userDb: any = null;
  let solDb: any = null;

  try {
    userDb = new SQL.Database();
    solDb = new SQL.Database();

    // 1. Run seedSql on both databases
    userDb.exec(seedSql);
    solDb.exec(seedSql);

    // 2. Run user query
    let userResult: any[] = [];
    try {
      userResult = userDb.exec(userSql);
    } catch (e: any) {
      return {
        passed: false,
        userRows: [],
        expectedRows: [],
        userColumns: [],
        expectedColumns: [],
        error: `SQL Error: ${e.message}`,
      };
    }

    // 3. Run solution query
    const solResult = solDb.exec(solutionSql);

    const userLast = userResult.length > 0 ? userResult[userResult.length - 1] : null;
    const solLast = solResult.length > 0 ? solResult[solResult.length - 1] : null;

    if (!userLast && !solLast) {
      return {
        passed: true,
        userRows: [],
        expectedRows: [],
        userColumns: [],
        expectedColumns: [],
      };
    }

    if (!userLast && solLast) {
      return {
        passed: false,
        userRows: [],
        expectedRows: solLast.values,
        userColumns: [],
        expectedColumns: solLast.columns,
        diffMessage: 'Query produced no rows, but rows were expected.',
      };
    }

    if (userLast && !solLast) {
      return {
        passed: false,
        userRows: userLast.values,
        expectedRows: [],
        userColumns: userLast.columns,
        expectedColumns: [],
        diffMessage: 'Expected no rows, but query produced results.',
      };
    }

    const userCols: string[] = userLast.columns.map((c: string) => c.toLowerCase());
    const solCols: string[] = solLast.columns.map((c: string) => c.toLowerCase());
    const userVals: any[][] = userLast.values;
    const solVals: any[][] = solLast.values;

    // Compare column counts
    if (userCols.length !== solCols.length) {
      return {
        passed: false,
        userRows: userVals,
        expectedRows: solVals,
        userColumns: userLast.columns,
        expectedColumns: solLast.columns,
        diffMessage: `Expected ${solCols.length} column(s) [${solCols.join(', ')}], but got ${userCols.length} column(s) [${userCols.join(', ')}].`,
      };
    }

    // Compare row counts
    if (userVals.length !== solVals.length) {
      return {
        passed: false,
        userRows: userVals,
        expectedRows: solVals,
        userColumns: userLast.columns,
        expectedColumns: solLast.columns,
        diffMessage: `Expected ${solVals.length} row(s), but got ${userVals.length} row(s).`,
      };
    }

    // Compare row contents (normalized JSON comparison)
    const normUser = JSON.stringify(userVals);
    const normSol = JSON.stringify(solVals);

    if (normUser === normSol) {
      return {
        passed: true,
        userRows: userVals,
        expectedRows: solVals,
        userColumns: userLast.columns,
        expectedColumns: solLast.columns,
      };
    }

    // Values mismatch
    return {
      passed: false,
      userRows: userVals,
      expectedRows: solVals,
      userColumns: userLast.columns,
      expectedColumns: solLast.columns,
      diffMessage: 'Result values do not match expected output.',
    };
  } finally {
    if (userDb) userDb.close();
    if (solDb) solDb.close();
  }
}
