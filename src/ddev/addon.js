import { join } from 'node:path';
import { chmod } from 'node:fs/promises';
import { safeWriteText } from '../utils/fs-helpers.js';

const DEFAULT_SERVICE_NAME = 'mcp-playwright';

function normalizeServiceName(serviceName) {
  return serviceName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
}

export function buildDdevAddonFiles({ serviceName = DEFAULT_SERVICE_NAME } = {}) {
  const cleanServiceName = normalizeServiceName(serviceName);

  return [
    {
      relativePath: `.ddev/docker-compose.${cleanServiceName}.yaml`,
      content: `services:
  ${cleanServiceName}:
    image: mcr.microsoft.com/playwright:v1.51.1-noble
    container_name: ddev-\${DDEV_SITENAME}-${cleanServiceName}
    working_dir: /var/www/html
    user: root
    command: ["sleep", "infinity"]
    volumes:
      - ..:/var/www/html
    labels:
      com.ddev.site-name: \${DDEV_SITENAME}
      com.ddev.approot: \${DDEV_APPROOT}
`,
      executable: false,
    },
    {
      relativePath: `.ddev/commands/host/${cleanServiceName}-check`,
      content: `#!/usr/bin/env bash
## Description: Check Playwright MCP package inside the ${cleanServiceName} DDEV service
set -euo pipefail

ddev exec --service ${cleanServiceName} bash -lc 'npx -y @playwright/mcp@latest --help >/dev/null'
echo "Playwright MCP is available in DDEV service: ${cleanServiceName}"
`,
      executable: true,
    },
    {
      relativePath: `.ddev/commands/host/${cleanServiceName}-start`,
      content: `#!/usr/bin/env bash
## Description: Start Playwright MCP in stdio mode inside the ${cleanServiceName} DDEV service
set -euo pipefail

exec ddev exec --service ${cleanServiceName} npx -y @playwright/mcp@latest
`,
      executable: true,
    },
    {
      relativePath: `.ddev/${cleanServiceName}/README.md`,
      content: `# ${cleanServiceName}

This DDEV add-on provides a dedicated Playwright runtime for MCP server checks and manual startup.

## Commands

- \`ddev ${cleanServiceName}-check\`: verifies \`@playwright/mcp\` can run in the service.
- \`ddev ${cleanServiceName}-start\`: starts Playwright MCP in stdio mode.

## Usage

1. Start your project: \`ddev start\`
2. Validate environment: \`ddev ${cleanServiceName}-check\`
3. Start MCP server when needed: \`ddev ${cleanServiceName}-start\`
`,
      executable: false,
    },
  ];
}

export async function writeDdevAddon(projectDir, options = {}) {
  const files = buildDdevAddonFiles(options);
  const writtenFiles = [];

  for (const file of files) {
    const outputPath = join(projectDir, file.relativePath);
    await safeWriteText(outputPath, file.content);
    if (file.executable) {
      await chmod(outputPath, 0o755);
    }
    writtenFiles.push({
      filePath: outputPath,
      executable: file.executable,
    });
  }

  return {
    projectDir,
    serviceName: normalizeServiceName(options.serviceName || DEFAULT_SERVICE_NAME),
    writtenFiles,
  };
}
