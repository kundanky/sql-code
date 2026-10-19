export interface ChangelogEntry {
  version: string;
  releaseDate: string;
  highlights: string[];
}

export const APP_CHANGELOG: ChangelogEntry[] = [
  {
    version: '1.2.0',
    releaseDate: 'October 2026',
    highlights: [
      'Real on-device SQLite WebAssembly engine (sql.js) with zero remote dependency',
      'Web Worker background execution with instantaneous query cancellation',
      'Real EXPLAIN QUERY PLAN visualization directly from the SQLite query planner',
      'Multi-database manager with IndexedDB persistence & switch/create/rename/delete',
      'Full CSV import wizard with auto-type detection, delimiter selection, & live preview',
      'CSV, JSON, and SQL INSERT data export for query results and tables',
      'Full database (.db / .sqlite) export and import',
      'SQL writing helpers: built-in and custom snippet library, SQL formatter, run selection/current statement',
      'Destructive query guard and read-only mode protection',
      'Biometric and app PIN security lock with background auto-lock',
      'Offline SQL Practice mode with 30 interactive challenges across 3 skill tiers',
      'About screen with verified privacy pledge and open source licenses',
    ],
  },
  {
    version: '1.1.0',
    releaseDate: 'September 2026',
    highlights: [
      'Mobile-first VS Code styling with edge-to-edge dark theme',
      'Git source control with on-device commit and history',
      'Mobile touch toolbar with quick SQL symbols and operators',
      'IndexedDB tab autosaving and state persistence',
    ],
  },
];
