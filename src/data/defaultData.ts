import { DatabaseConnection, EditorTab, GitCommit, GitFileStatus, ThemeConfig, TypographySettings } from '../types/index.ts';

export const DEFAULT_CONNECTIONS: DatabaseConnection[] = [
  {
    id: 'conn-local-sqlite',
    name: 'SQLite (this device)',
    type: 'sqlite',
    host: 'localhost',
    port: 0,
    database: 'local_database.db',
    username: 'sqlite_local',
    ssl: 'disable',
    sshTunnel: { enabled: false, host: '', port: 22, username: '', authType: 'password' },
    environment: 'dev',
    readOnly: false,
    color: '#10b981',
    createdAt: '2024-03-01T09:00:00Z',
    lastUsed: 'Just now'
  }
];

export const SAMPLE_CONNECTIONS: DatabaseConnection[] = [];

export const DEFAULT_TABS: EditorTab[] = [
  {
    id: 'tab-untitled-1',
    title: 'Untitled-1.sql',
    dialect: 'sqlite',
    connectionId: 'conn-local-sqlite',
    isDirty: false,
    content: ''
  }
];

export const THEMES: ThemeConfig[] = [
  {
    id: 'theme-vscode-dark',
    name: 'VS Code Dark Modern',
    isDark: true,
    bgPrimary: '#1e1e1e',
    bgSecondary: '#252526',
    bgTertiary: '#2d2d2d',
    bgSidebar: '#181818',
    border: '#333333',
    textPrimary: '#cccccc',
    textSecondary: '#858585',
    textMuted: '#6e7681',
    accent: '#0078d4',
    syntax: {
      keyword: '#569cd6',
      string: '#ce9178',
      function: '#dcdcaa',
      number: '#b5cea8',
      comment: '#6a9955',
      operator: '#d4d4d4',
      variable: '#9cdcfe',
      type: '#4ec9b0'
    }
  },
  {
    id: 'theme-dracula',
    name: 'Dracula Pro',
    isDark: true,
    bgPrimary: '#282a36',
    bgSecondary: '#21222c',
    bgTertiary: '#343746',
    bgSidebar: '#191a21',
    border: '#44475a',
    textPrimary: '#f8f8f2',
    textSecondary: '#6272a4',
    textMuted: '#6272a4',
    accent: '#bd93f9',
    syntax: {
      keyword: '#ff79c6',
      string: '#f1fa8c',
      function: '#50fa7b',
      number: '#bd93f9',
      comment: '#6272a4',
      operator: '#ff79c6',
      variable: '#f8f8f2',
      type: '#8be9fd'
    }
  },
  {
    id: 'theme-monokai',
    name: 'Monokai Classic',
    isDark: true,
    bgPrimary: '#272822',
    bgSecondary: '#1e1f1c',
    bgTertiary: '#3e3d32',
    bgSidebar: '#171814',
    border: '#49483e',
    textPrimary: '#f8f8f2',
    textSecondary: '#75715e',
    textMuted: '#75715e',
    accent: '#a6e22e',
    syntax: {
      keyword: '#f92672',
      string: '#e6db74',
      function: '#a6e22e',
      number: '#ae81ff',
      comment: '#75715e',
      operator: '#f92672',
      variable: '#66d9ef',
      type: '#66d9ef'
    }
  },
  {
    id: 'theme-solarized-dark',
    name: 'Solarized Dark',
    isDark: true,
    bgPrimary: '#002b36',
    bgSecondary: '#073642',
    bgTertiary: '#0a4250',
    bgSidebar: '#00212b',
    border: '#0d5568',
    textPrimary: '#839496',
    textSecondary: '#586e75',
    textMuted: '#586e75',
    accent: '#268bd2',
    syntax: {
      keyword: '#859900',
      string: '#2aa198',
      function: '#268bd2',
      number: '#d33682',
      comment: '#586e75',
      operator: '#859900',
      variable: '#b58900',
      type: '#cb4b16'
    }
  },
  {
    id: 'theme-github-light',
    name: 'GitHub Light',
    isDark: false,
    bgPrimary: '#ffffff',
    bgSecondary: '#f6f8fa',
    bgTertiary: '#eaeef2',
    bgSidebar: '#f0f3f6',
    border: '#d0d7de',
    textPrimary: '#1f2328',
    textSecondary: '#656d76',
    textMuted: '#8c959f',
    accent: '#0969da',
    syntax: {
      keyword: '#cf222e',
      string: '#0a3069',
      function: '#8250df',
      number: '#0550ae',
      comment: '#6e7781',
      operator: '#cf222e',
      variable: '#24292f',
      type: '#953800'
    }
  }
];

export const DEFAULT_TYPOGRAPHY: TypographySettings = {
  fontFamily: 'JetBrains Mono',
  fontSize: 13,
  lineHeight: 1.5,
  ligatures: true
};

export const DEFAULT_GIT_FILES: GitFileStatus[] = [];

export const DEFAULT_GIT_COMMITS: GitCommit[] = [];

