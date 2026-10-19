export interface SqlSafetyCheck {
  isDestructive: boolean;
  riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical';
  reasons: string[];
  requiredConfirmationPhrase?: string;
}

/**
 * Analyzes a SQL string for destructive statements or missing WHERE clauses.
 */
export function analyzeSqlSafety(sql: string): SqlSafetyCheck {
  if (!sql || sql.trim().length === 0) {
    return { isDestructive: false, riskLevel: 'safe', reasons: [] };
  }

  // Strip comments and normalize whitespace
  const sanitized = sql
    .replace(/--.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .trim();

  const reasons: string[] = [];
  const isCritical = /\bDROP\s+(DATABASE|SCHEMA)\b/i.test(sanitized);
  const isHighDrop = /\bDROP\s+TABLE\b/i.test(sanitized);
  const isMediumDrop = /\bDROP\s+(VIEW|INDEX|PROCEDURE|FUNCTION|TRIGGER)\b/i.test(sanitized);
  const isTruncate = /\bTRUNCATE(\s+TABLE)?\b/i.test(sanitized);
  const isUnboundedDelete = /\bDELETE\s+FROM\s+([`"[\]\w.]+)(?!\s+WHERE\b)/i.test(sanitized) && !/\bWHERE\b/i.test(sanitized);
  const isUnboundedUpdate = /\bUPDATE\s+([`"[\]\w.]+)\s+SET\b/i.test(sanitized) && !/\bWHERE\b/i.test(sanitized);
  const isAlterDrop = /\bALTER\s+TABLE\s+([`"[\]\w.]+)\s+DROP\b/i.test(sanitized);

  if (isCritical) {
    reasons.push('Contains DROP DATABASE or DROP SCHEMA statement which permanently destroys entire catalogs');
  }
  if (isHighDrop) {
    reasons.push('Contains DROP TABLE statement which will erase table definitions and all stored data');
  }
  if (isMediumDrop) {
    reasons.push('Contains DROP statement for database objects');
  }
  if (isTruncate) {
    reasons.push('Contains TRUNCATE statement which removes all rows immediately');
  }
  if (isUnboundedDelete) {
    reasons.push('DELETE statement detected without a WHERE clause — this will delete ALL records in the table');
  }
  if (isUnboundedUpdate) {
    reasons.push('UPDATE statement detected without a WHERE clause — this will overwrite values across ALL records');
  }
  if (isAlterDrop) {
    reasons.push('ALTER TABLE DROP statement removes columns or constraints');
  }

  let riskLevel: SqlSafetyCheck['riskLevel'] = 'safe';
  if (isCritical) {
    riskLevel = 'critical';
  } else if (isHighDrop || isTruncate || isUnboundedDelete || isUnboundedUpdate) {
    riskLevel = 'high';
  } else if (isMediumDrop || isAlterDrop) {
    riskLevel = 'medium';
  }

  const isDestructive = reasons.length > 0;
  let requiredConfirmationPhrase: string | undefined;

  if (riskLevel === 'critical') {
    requiredConfirmationPhrase = 'CONFIRM DROP DATABASE';
  } else if (riskLevel === 'high') {
    requiredConfirmationPhrase = 'EXECUTE DESTRUCTIVE';
  } else if (riskLevel === 'medium') {
    requiredConfirmationPhrase = 'APPLY SCHEMA CHANGE';
  }

  return {
    isDestructive,
    riskLevel,
    reasons,
    requiredConfirmationPhrase,
  };
}
