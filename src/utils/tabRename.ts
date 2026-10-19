/**
 * Validates and normalizes tab names for the SQL editor.
 */
export interface TabNameValidationResult {
  valid: boolean;
  finalName: string;
  error?: string;
}

export function validateTabName(
  rawName: string,
  existingNames: string[] = []
): TabNameValidationResult {
  const trimmed = rawName.trim();

  // 1. Block empty names
  if (!trimmed) {
    return {
      valid: false,
      finalName: '',
      error: 'Name cannot be empty',
    };
  }

  // 2. Block invalid characters (/ \ : * ? " < > |)
  const invalidCharsRegex = /[/\\:*?"<>|]/;
  if (invalidCharsRegex.test(trimmed)) {
    return {
      valid: false,
      finalName: trimmed,
      error: 'Invalid characters: / \\ : * ? " < > |',
    };
  }

  // 3. Keep or append .sql extension automatically
  const hasSqlExt = trimmed.toLowerCase().endsWith('.sql');
  const finalName = hasSqlExt ? trimmed : `${trimmed}.sql`;

  // 4. Block duplicate names (case-insensitive)
  const isDuplicate = existingNames.some(
    (name) => name.toLowerCase() === finalName.toLowerCase()
  );

  if (isDuplicate) {
    return {
      valid: false,
      finalName,
      error: 'Name already exists',
    };
  }

  return {
    valid: true,
    finalName,
  };
}
