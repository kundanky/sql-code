export interface OpenSourceLicense {
  name: string;
  version: string;
  license: string;
  description: string;
  author: string;
  repository?: string;
}

export const OPEN_SOURCE_LICENSES: OpenSourceLicense[] = [
  {
    name: 'sql.js',
    version: '1.12.0',
    license: 'MIT',
    description: 'SQLite compiled to WebAssembly for client-side relational database execution',
    author: 'Alon Zakai, sql.js contributors',
    repository: 'https://github.com/sql-js/sql.js',
  },
  {
    name: '@codemirror/view & @codemirror/state',
    version: '6.43.14',
    license: 'MIT',
    description: 'Extensible text and code editor architecture for the modern web',
    author: 'Marijn Haverbeke',
    repository: 'https://github.com/codemirror/dev',
  },
  {
    name: '@codemirror/lang-sql',
    version: '6.10.0',
    license: 'MIT',
    description: 'SQL language support for CodeMirror with multi-dialect parser',
    author: 'Marijn Haverbeke',
    repository: 'https://github.com/codemirror/lang-sql',
  },
  {
    name: 'react & react-dom',
    version: '19.0.1',
    license: 'MIT',
    description: 'Declarative component-driven user interface framework',
    author: 'Meta Platforms, Inc.',
    repository: 'https://github.com/facebook/react',
  },
  {
    name: '@capacitor/core & @capacitor/filesystem',
    version: '8.5.3',
    license: 'MIT',
    description: 'Cross-platform native runtime and bridge for iOS and Android',
    author: 'Ionic',
    repository: 'https://github.com/ionic-team/capacitor',
  },
  {
    name: 'isomorphic-git',
    version: '1.44.3',
    license: 'MIT',
    description: 'Pure JavaScript implementation of Git for client-side version control',
    author: 'William Hilton and contributors',
    repository: 'https://github.com/isomorphic-git/isomorphic-git',
  },
  {
    name: 'sql-formatter',
    version: '15.9.0',
    license: 'MIT',
    description: 'Multi-dialect SQL query pretty-printer and beautifier',
    author: 'nene, sql-formatter contributors',
    repository: 'https://github.com/sql-formatter-org/sql-formatter',
  },
  {
    name: 'lucide-react',
    version: '0.546.0',
    license: 'ISC',
    description: 'Clean, consistent SVG icon set optimized for modern React apps',
    author: 'Lucide Contributors',
    repository: 'https://github.com/lucide-icons/lucide',
  },
  {
    name: 'tailwindcss',
    version: '4.3.3',
    license: 'MIT',
    description: 'Utility-first modern CSS framework',
    author: 'Tailwind Labs, Inc.',
    repository: 'https://github.com/tailwindlabs/tailwindcss',
  },
];
