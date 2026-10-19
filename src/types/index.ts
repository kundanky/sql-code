export type DatabaseType = 
  | 'postgres'
  | 'mysql'
  | 'sqlite'
  | 'oracle'
  | 'sqlserver'
  | 'mariadb'
  | 'mongodb';

export type Environment = 'dev' | 'staging' | 'prod';

export type SSLMode = 'disable' | 'require' | 'verify-ca' | 'verify-full';

export interface SSHTunnelConfig {
  enabled: boolean;
  host: string;
  port: number;
  username: string;
  authType: 'password' | 'privateKey';
  password?: string;
  privateKey?: string;
}

export interface DatabaseConnection {
  id: string;
  name: string;
  type: DatabaseType;
  host: string;
  port: number;
  database: string;
  username: string;
  password?: string;
  ssl: SSLMode;
  sshTunnel: SSHTunnelConfig;
  environment: Environment;
  readOnly: boolean;
  color?: string;
  createdAt: string;
  lastUsed?: string;
}

export interface EditorTab {
  id: string;
  title: string;
  content: string;
  dialect: DatabaseType;
  connectionId: string;
  isDirty: boolean;
  filePath?: string;
  cursorPosition?: { line: number; ch: number };
}

export interface QueryResultColumn {
  name: string;
  type: string;
}

export interface QueryResult {
  columns: QueryResultColumn[];
  rows: Record<string, any>[];
  executionTimeMs: number;
  rowCount: number;
  affectedRows?: number;
  command?: string;
}

export interface ExplainPlanNode {
  id?: number;
  parent?: number;
  detail?: string;
  nodeType: string;
  relationName?: string;
  alias?: string;
  startupCost?: number;
  totalCost?: number;
  planRows?: number;
  planWidth?: number;
  actualStartupTime?: number;
  actualTotalTime?: number;
  actualRows?: number;
  actualLoops?: number;
  filter?: string;
  condition?: string;
  children?: ExplainPlanNode[];
}

export interface ColumnDefinition {
  name: string;
  type: string;
  nullable: boolean;
  isPrimaryKey: boolean;
  isForeignKey?: boolean;
  foreignKeyTarget?: { table: string; column: string };
  defaultValue?: string;
  comment?: string;
}

export interface IndexDefinition {
  name: string;
  columns: string[];
  isUnique: boolean;
  type: string;
}

export interface TableDefinition {
  name: string;
  schema: string;
  type: 'table' | 'view';
  columns: ColumnDefinition[];
  indexes: IndexDefinition[];
  rowCountEstimate: number;
}

export interface ProcedureDefinition {
  name: string;
  schema: string;
  returnType: string;
  parameters: { name: string; type: string; mode: 'IN' | 'OUT' | 'INOUT' }[];
}

export interface DatabaseSchema {
  name: string;
  tables: TableDefinition[];
  views: TableDefinition[];
  procedures: ProcedureDefinition[];
}

export interface ThemeConfig {
  id: string;
  name: string;
  isDark: boolean;
  bgPrimary: string;
  bgSecondary: string;
  bgTertiary: string;
  bgSidebar: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  syntax: {
    keyword: string;
    string: string;
    function: string;
    number: string;
    comment: string;
    operator: string;
    variable: string;
    type: string;
  };
}

export interface TypographySettings {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  ligatures: boolean;
}

export interface GitFileStatus {
  path: string;
  status: 'modified' | 'untracked' | 'added' | 'deleted';
  staged: boolean;
  originalContent: string;
  currentContent: string;
}

export interface GitCommit {
  hash: string;
  message: string;
  author: string;
  date: string;
  branch: string;
}

export interface QueryHistoryItem {
  id: string;
  query: string;
  connectionName: string;
  databaseType: DatabaseType;
  executionTimeMs: number;
  rowCount: number;
  status: 'success' | 'error';
  errorMessage?: string;
  timestamp: string;
  isPinned?: boolean;
}

export interface FileItem {
  id: string;
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileItem[];
  content?: string;
  updatedAt?: number;
  size?: number;
}

export interface StorageInfo {
  type: 'native' | 'fsa' | 'indexeddb';
  location: string;
  permission: 'granted' | 'denied' | 'prompt' | 'unsupported';
  persisted: boolean;
}

export interface SnippetItem {
  id: string;
  title: string;
  prefix: string;
  description: string;
  sql: string;
  isCustom?: boolean;
}

export interface PracticeProgress {
  completedIds: string[];
  streak: number;
  lastCompletedDate?: string;
}

export type ActiveNavTab = 'files' | 'editor' | 'explorer' | 'git' | 'connections' | 'history' | 'practice' | 'settings' | 'about' | 'docs';
export type DeviceViewMode = 'mobile' | 'tablet' | 'desktop';


