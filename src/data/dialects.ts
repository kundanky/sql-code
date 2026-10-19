import { DatabaseType } from '../types/index.ts';
import { PickerOption } from '../components/common/Picker.tsx';

export const SQL_DIALECT_OPTIONS: PickerOption<DatabaseType>[] = [
  {
    value: 'postgres',
    label: 'PostgreSQL',
    secondaryLabel: 'v16, port 5432',
    colorDot: '#3b82f6', // PostgreSQL blue
  },
  {
    value: 'mysql',
    label: 'MySQL',
    secondaryLabel: 'v8.4 LTS, port 3306',
    colorDot: '#06b6d4', // Cyan
  },
  {
    value: 'sqlite',
    label: 'SQLite',
    secondaryLabel: 'v3.45, embedded file',
    colorDot: '#10b981', // Emerald
  },
  {
    value: 'oracle',
    label: 'Oracle PL/SQL',
    secondaryLabel: '19c / 21c, port 1521',
    colorDot: '#f59e0b', // Amber
  },
  {
    value: 'sqlserver',
    label: 'SQL Server (T-SQL)',
    secondaryLabel: 'v2022, port 1433',
    colorDot: '#ec4899', // Pink
  },
  {
    value: 'mariadb',
    label: 'MariaDB',
    secondaryLabel: 'v11.4, port 3306',
    colorDot: '#8b5cf6', // Purple
  },
  {
    value: 'mongodb',
    label: 'MongoDB (SQL)',
    secondaryLabel: 'Atlas Data Lake / BI Connector',
    colorDot: '#22c55e', // Green
  },
];
