import {
  writeClaudeGlobal, writeClaudeProject,
  buildClaudeGlobal, buildClaudeProject,
} from './claude.js';
import {
  writeCodexGlobal, writeCodexProject,
  buildCodexGlobal, buildCodexProject,
} from './codex.js';
import {
  writeGeminiGlobal, writeGeminiProject,
  buildGeminiGlobal, buildGeminiProject,
} from './gemini.js';
import {
  displayJSONConfig, displayTOMLConfig, printSummary,
} from '../utils/display.js';

const writerMap = {
  claude: { writeGlobal: writeClaudeGlobal, writeProject: writeClaudeProject },
  codex: { writeGlobal: writeCodexGlobal, writeProject: writeCodexProject },
  gemini: { writeGlobal: writeGeminiGlobal, writeProject: writeGeminiProject },
};

const builderMap = {
  claude: { buildGlobal: buildClaudeGlobal, buildProject: buildClaudeProject },
  codex: { buildGlobal: buildCodexGlobal, buildProject: buildCodexProject },
  gemini: { buildGlobal: buildGeminiGlobal, buildProject: buildGeminiProject },
};

// Write all configs to disk.
export async function writeAll(tools, globalServers, credentialValues, workspaces, cmsTemplates, projectServers) {
  const results = [];
  for (const tool of tools) {
    const writer = writerMap[tool];
    results.push(await writer.writeGlobal(globalServers, credentialValues));

    for (const ws of workspaces) {
      results.push(await writer.writeProject(ws.dir, projectServers, ws.credentials));
    }

    for (const tpl of cmsTemplates) {
      const cmsServer = {
        name: 'mysql',
        transport: 'stdio',
        command: 'npx',
        args: ['-y', '@benborla29/mcp-server-mysql'],
        credentials: [],
        staticEnv: tpl.mysqlConfig,
      };
      results.push(await writer.writeProject(tpl.dir, [cmsServer], {}));
    }
  }
  return results;
}

// Build all configs for display (print / dry-run).
export async function buildAll(tools, globalServers, credentialValues, workspaces, cmsTemplates, projectServers) {
  const configs = [];
  for (const tool of tools) {
    const builder = builderMap[tool];
    configs.push({ tool, scope: 'global', ...(await builder.buildGlobal(globalServers, credentialValues)) });

    for (const ws of workspaces) {
      configs.push({ tool, scope: 'project', dir: ws.dir, ...(await builder.buildProject(ws.dir, projectServers, ws.credentials)) });
    }

    for (const tpl of cmsTemplates) {
      const cmsServer = {
        name: 'mysql',
        transport: 'stdio',
        command: 'npx',
        args: ['-y', '@benborla29/mcp-server-mysql'],
        credentials: [],
        staticEnv: tpl.mysqlConfig,
      };
      configs.push({ tool, scope: 'project', dir: tpl.dir, ...(await builder.buildProject(tpl.dir, [cmsServer], {})) });
    }
  }
  return configs;
}

export function displayAll(configs) {
  for (const cfg of configs) {
    const label = cfg.scope === 'project'
      ? `${cfg.tool} (${cfg.dir})`
      : `${cfg.tool} (global)`;
    if (cfg.format === 'toml') {
      displayTOMLConfig(label, cfg.filePath, cfg.data);
    } else {
      displayJSONConfig(label, cfg.filePath, cfg.data);
    }
  }
}
