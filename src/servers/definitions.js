// All MCP server definitions as transport-agnostic data objects.
// Each server is defined once and transformed per-tool in transforms.js.

export const servers = [
  // --- Design ---
  {
    name: 'figma-desktop',
    transport: 'http',
    url: 'http://127.0.0.1:3845/mcp',
    category: 'design',
    scope: 'global',
    credentials: [],
    staticEnv: {},
  },
  {
    name: 'figma-developer',
    transport: 'stdio',
    command: 'npx',
    args: ['-y', 'figma-developer-mcp', '--stdio'],
    category: 'design',
    scope: 'global',
    credentials: [
      { key: 'FIGMA_API_KEY', label: 'Figma personal access token', secret: true },
    ],
    staticEnv: {},
  },

  // --- Database ---
  {
    name: 'mysql',
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@benborla29/mcp-server-mysql'],
    category: 'database',
    scope: 'global',
    credentials: [
      { key: 'MYSQL_HOST', label: 'MySQL host', secret: false, default: '127.0.0.1' },
      { key: 'MYSQL_PORT', label: 'MySQL port', secret: false, default: '3306' },
      { key: 'MYSQL_USER', label: 'MySQL user', secret: false, default: 'root' },
      { key: 'MYSQL_PASS', label: 'MySQL password', secret: true, default: '' },
      { key: 'MYSQL_DB', label: 'MySQL database name', secret: false, default: '' },
    ],
    staticEnv: {
      ALLOW_INSERT_OPERATION: 'false',
      ALLOW_UPDATE_OPERATION: 'false',
      ALLOW_DELETE_OPERATION: 'false',
    },
  },

  // --- Browser / Testing ---
  {
    name: 'playwright',
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@playwright/mcp@latest'],
    category: 'browser',
    scope: 'global',
    credentials: [],
    staticEnv: { PLAYWRIGHT_BROWSERS_PATH: '0' },
  },
  {
    name: 'chrome-devtools',
    transport: 'stdio',
    command: 'npx',
    args: ['-y', 'chrome-devtools-mcp@latest'],
    category: 'browser',
    scope: 'global',
    credentials: [],
    staticEnv: {},
  },
  {
    name: 'browser-tools',
    transport: 'stdio',
    command: 'npx',
    args: ['-y', 'browser-tools-mcp@latest'],
    category: 'browser',
    scope: 'global',
    credentials: [],
    staticEnv: {},
  },

  // --- Performance / SEO ---
  {
    name: 'lighthouse',
    transport: 'stdio',
    command: 'npx',
    args: ['-y', 'lighthouse-mcp'],
    category: 'performance',
    scope: 'global',
    credentials: [],
    staticEnv: {},
  },
  {
    name: 'pagespeed',
    transport: 'stdio',
    command: 'npx',
    args: ['-y', 'pagespeed-mcp-server'],
    category: 'performance',
    scope: 'global',
    credentials: [
      { key: 'PAGESPEED_API_KEY', label: 'Google PageSpeed API key', secret: true },
    ],
    staticEnv: {},
  },

  // --- Accessibility ---
  {
    name: 'a11y',
    transport: 'stdio',
    command: 'npx',
    args: ['-y', 'a11y-mcp'],
    category: 'a11y',
    scope: 'global',
    credentials: [],
    staticEnv: {},
  },

  // --- CSS / Styling ---
  {
    name: 'css',
    transport: 'stdio',
    command: 'npx',
    args: ['-y', 'css-mcp'],
    category: 'css',
    scope: 'global',
    credentials: [],
    staticEnv: {},
  },
  {
    name: 'tailwindcss',
    transport: 'stdio',
    command: 'npx',
    args: ['-y', 'tailwindcss-mcp-server'],
    category: 'css',
    scope: 'global',
    credentials: [],
    staticEnv: {},
  },

  // --- Linting ---
  {
    name: 'eslint',
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@eslint/mcp@latest'],
    category: 'linting',
    scope: 'global',
    credentials: [],
    staticEnv: {},
  },

  // --- Images ---
  {
    name: 'image-optimizer',
    transport: 'stdio',
    command: 'npx',
    args: ['-y', 'mcp-image-optimizer'],
    category: 'images',
    scope: 'global',
    credentials: [],
    staticEnv: {},
  },

  // --- Components ---
  {
    name: 'storybook',
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@storybook/mcp@latest'],
    category: 'components',
    scope: 'global',
    credentials: [],
    staticEnv: {},
  },

  // --- Source Control ---
  {
    name: 'github',
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-github'],
    category: 'source-control',
    scope: 'global',
    credentials: [
      { key: 'GITHUB_PERSONAL_ACCESS_TOKEN', label: 'GitHub personal access token', secret: true },
    ],
    staticEnv: {},
  },

  // --- Utilities ---
  {
    name: 'sequential-thinking',
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-sequential-thinking'],
    category: 'utilities',
    scope: 'global',
    credentials: [],
    staticEnv: {},
  },

  // --- Project-level: Atlassian / Bitbucket / GTM ---
  {
    name: 'atlassian',
    transport: 'stdio',
    command: 'npx',
    args: ['-y', 'mcp-remote', 'https://mcp.atlassian.com/v1/mcp'],
    category: 'project',
    scope: 'project',
    credentials: [],
    staticEnv: {},
  },
  {
    name: 'bitbucket',
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@aashari/mcp-server-atlassian-bitbucket'],
    category: 'project',
    scope: 'project',
    credentials: [
      { key: 'ATLASSIAN_USER_EMAIL', label: 'Atlassian email for this workspace', secret: false },
      { key: 'ATLASSIAN_API_TOKEN', label: 'Atlassian API token for this workspace', secret: true },
    ],
    staticEnv: {},
  },
  {
    name: 'gtm',
    transport: 'stdio',
    command: 'npx',
    args: ['-y', 'mcp-remote', 'https://gtm-mcp.stape.ai/mcp'],
    category: 'project',
    scope: 'project',
    credentials: [],
    staticEnv: {},
  },
];

export function getServer(name) {
  return servers.find((s) => s.name === name);
}

export function getServersByScope(scope) {
  return servers.filter((s) => s.scope === scope);
}
