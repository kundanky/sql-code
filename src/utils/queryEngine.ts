import { DatabaseSchema, ExplainPlanNode, QueryResult } from '../types/index.ts';
import { sqliteManager } from './sqliteManager.ts';
import { seedSampleData, extractSchema } from './sqliteCore.ts';

export const EMPTY_SCHEMA: DatabaseSchema = {
  name: 'main',
  tables: [],
  views: [],
  procedures: [],
};

// Kept for backward compatibility with components expecting SAMPLE_SCHEMA initially
export const SAMPLE_SCHEMA: DatabaseSchema = EMPTY_SCHEMA;

export interface QueryEngineResponse {
  result?: QueryResult;
  explainPlan?: ExplainPlanNode;
  error?: string;
  affectedRows?: number;
  isMutated?: boolean;
  freshSchema?: DatabaseSchema;
}

/**
 * Executes a SQL statement on the real on-device SQLite WebAssembly engine.
 */
export async function executeQuery(
  sql: string,
  options?: { isReadOnly?: boolean }
): Promise<QueryEngineResponse> {
  const res = await sqliteManager.execute(sql, options);
  return {
    result: res.result,
    explainPlan: res.explainPlan,
    error: res.error,
    affectedRows: res.affectedRows,
    isMutated: res.isMutated,
    freshSchema: res.freshSchema,
  };
}

// Alias for compatibility
export const executeQuerySimulated = executeQuery;

export { sqliteManager, seedSampleData, extractSchema };
