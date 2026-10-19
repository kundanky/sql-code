import initSqlJs from 'sql.js';
import { 
  executeSqlScript, extractSchema, seedSampleData, checkPracticeChallenge 
} from '../utils/sqliteCore.ts';

let SQL: any = null;
let currentDb: any = null;
let currentDbName = 'main';

self.onmessage = async (e: MessageEvent) => {
  const { id, type, payload } = e.data;

  try {
    switch (type) {
      case 'INIT': {
        const { wasmUrl, binaryData, dbName } = payload;
        currentDbName = dbName || 'main';

        if (!SQL) {
          SQL = await initSqlJs({
            locateFile: () => wasmUrl || '/sql-wasm.wasm',
          });
        }

        if (currentDb) {
          try {
            currentDb.close();
          } catch {
            // Ignore close error
          }
        }

        if (binaryData && binaryData.length > 0) {
          currentDb = new SQL.Database(binaryData);
        } else {
          currentDb = new SQL.Database();
        }

        // Enable foreign keys by default in SQLite
        currentDb.run('PRAGMA foreign_keys = ON;');

        const schema = extractSchema(currentDb, currentDbName);
        self.postMessage({ id, type: 'INIT_SUCCESS', payload: { schema } });
        break;
      }

      case 'EXECUTE': {
        if (!currentDb) {
          throw new Error('SQLite database is not initialized yet');
        }

        const { sql, isReadOnly } = payload;
        const res = executeSqlScript(currentDb, sql, { isReadOnly });

        // If schema altered or mutated, extract fresh schema
        let freshSchema = null;
        if (res.isMutated) {
          freshSchema = extractSchema(currentDb, currentDbName);
        }

        self.postMessage({
          id,
          type: 'EXECUTE_SUCCESS',
          payload: {
            ...res,
            freshSchema,
          },
        });
        break;
      }

      case 'EXPORT': {
        if (!currentDb) {
          throw new Error('SQLite database is not initialized yet');
        }
        const binary = currentDb.export();
        self.postMessage({ id, type: 'EXPORT_SUCCESS', payload: { binary } });
        break;
      }

      case 'GET_SCHEMA': {
        if (!currentDb) {
          throw new Error('SQLite database is not initialized yet');
        }
        const schema = extractSchema(currentDb, currentDbName);
        self.postMessage({ id, type: 'GET_SCHEMA_SUCCESS', payload: { schema } });
        break;
      }

      case 'SEED_SAMPLE': {
        if (!currentDb) {
          throw new Error('SQLite database is not initialized yet');
        }
        seedSampleData(currentDb);
        const schema = extractSchema(currentDb, currentDbName);
        self.postMessage({
          id,
          type: 'SEED_SAMPLE_SUCCESS',
          payload: { schema },
        });
        break;
      }

      case 'IMPORT_DB': {
        if (!SQL) {
          throw new Error('SQL.js is not loaded');
        }
        const { binaryData, dbName } = payload;
        if (currentDb) {
          try {
            currentDb.close();
          } catch {
            // Ignore
          }
        }
        currentDbName = dbName || currentDbName;
        currentDb = new SQL.Database(binaryData);
        currentDb.run('PRAGMA foreign_keys = ON;');
        const schema = extractSchema(currentDb, currentDbName);
        self.postMessage({ id, type: 'IMPORT_DB_SUCCESS', payload: { schema } });
        break;
      }

      case 'CHECK_PRACTICE': {
        if (!SQL) {
          throw new Error('SQL.js is not loaded');
        }
        const { seedSql, userSql, solutionSql } = payload;
        const result = checkPracticeChallenge(SQL, seedSql, userSql, solutionSql);
        self.postMessage({ id, type: 'CHECK_PRACTICE_RESULT', payload: result });
        break;
      }

      default:
        throw new Error(`Unknown message type: ${type}`);
    }
  } catch (err: any) {
    self.postMessage({
      id,
      type: 'ERROR',
      payload: { error: err?.message || String(err) },
    });
  }
};
