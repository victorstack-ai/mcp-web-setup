import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { parse as parseTOML } from 'smol-toml';

import { servers, getServer, getServersByScope } from '../src/servers/definitions.js';
import { categories, getCategory } from '../src/servers/categories.js';
import {
  toClaudeConfig, toCodexConfig, toGeminiConfig, buildConfigBlock,
} from '../src/servers/transforms.js';
import { mergeJSON, mergeTOML } from '../src/utils/merge.js';
import {
  readJSON, readText, safeWriteJSON, safeWriteText, backup, fileExists,
} from '../src/utils/fs-helpers.js';
import { buildClaudeProject } from '../src/writers/claude.js';
import { buildCodexProject } from '../src/writers/codex.js';
import { buildGeminiProject } from '../src/writers/gemini.js';
import { buildAll } from '../src/writers/index.js';

// ---------------------------------------------------------------------------
// 1. Server Definitions
// ---------------------------------------------------------------------------
describe('Server Definitions', () => {
  it('every server has required fields', () => {
    for (const s of servers) {
      assert.ok(s.name, `server missing name`);
      assert.ok(['http', 'stdio'].includes(s.transport), `${s.name}: bad transport`);
      assert.ok(s.category, `${s.name}: missing category`);
      assert.ok(['global', 'project'].includes(s.scope), `${s.name}: bad scope`);
      assert.ok(Array.isArray(s.credentials), `${s.name}: credentials not array`);
      assert.ok(typeof s.staticEnv === 'object' && s.staticEnv !== null, `${s.name}: missing staticEnv`);
    }
  });

  it('HTTP servers have url, stdio servers have command + args', () => {
    for (const s of servers) {
      if (s.transport === 'http') {
        assert.ok(typeof s.url === 'string', `${s.name}: HTTP server missing url`);
      } else {
        assert.ok(typeof s.command === 'string', `${s.name}: stdio server missing command`);
        assert.ok(Array.isArray(s.args), `${s.name}: stdio server missing args`);
      }
    }
  });

  it('getServer returns correct server by name', () => {
    const pw = getServer('playwright');
    assert.equal(pw.name, 'playwright');
    assert.equal(pw.transport, 'stdio');
  });

  it('getServer returns undefined for unknown name', () => {
    assert.equal(getServer('nonexistent'), undefined);
  });

  it('getServersByScope(global) returns only global servers', () => {
    const global = getServersByScope('global');
    assert.ok(global.length > 0);
    for (const s of global) assert.equal(s.scope, 'global');
  });

  it('getServersByScope(project) returns only project servers', () => {
    const project = getServersByScope('project');
    assert.ok(project.length > 0);
    for (const s of project) assert.equal(s.scope, 'project');
  });
});

// ---------------------------------------------------------------------------
// 2. Categories
// ---------------------------------------------------------------------------
describe('Categories', () => {
  it('every server referenced in categories exists in definitions', () => {
    const definedNames = new Set(servers.map((s) => s.name));
    for (const cat of categories) {
      for (const name of cat.servers) {
        assert.ok(definedNames.has(name), `${name} in category ${cat.id} not in definitions`);
      }
    }
  });

  it('no duplicate server names across categories', () => {
    const seen = new Set();
    for (const cat of categories) {
      for (const name of cat.servers) {
        assert.ok(!seen.has(name), `${name} appears in multiple categories`);
        seen.add(name);
      }
    }
  });

  it('getCategory returns correct category by id', () => {
    const browser = getCategory('browser');
    assert.equal(browser.id, 'browser');
    assert.ok(browser.servers.includes('playwright'));
  });

  it('getCategory returns undefined for unknown id', () => {
    assert.equal(getCategory('nonexistent'), undefined);
  });
});

// ---------------------------------------------------------------------------
// 3. Transforms
// ---------------------------------------------------------------------------
describe('Transforms', () => {
  const httpServer = {
    name: 'test-http',
    transport: 'http',
    url: 'http://localhost:3000/mcp',
    credentials: [],
    staticEnv: {},
  };

  const stdioServer = {
    name: 'test-stdio',
    transport: 'stdio',
    command: 'npx',
    args: ['-y', 'some-pkg'],
    credentials: [
      { key: 'API_KEY', label: 'key', secret: true },
    ],
    staticEnv: { FOO: 'bar' },
  };

  const stdioServerNoCreds = {
    name: 'test-stdio-no-creds',
    transport: 'stdio',
    command: 'npx',
    args: ['-y', 'another-pkg'],
    credentials: [],
    staticEnv: {},
  };

  describe('toClaudeConfig', () => {
    it('HTTP returns { type, url }', () => {
      const cfg = toClaudeConfig(httpServer);
      assert.deepEqual(cfg, { type: 'http', url: 'http://localhost:3000/mcp' });
    });

    it('stdio returns { command, args, env }', () => {
      const cfg = toClaudeConfig(stdioServer, { API_KEY: 'secret123' });
      assert.equal(cfg.command, 'npx');
      assert.deepEqual(cfg.args, ['-y', 'some-pkg']);
      assert.equal(cfg.env.API_KEY, 'secret123');
      assert.equal(cfg.env.FOO, 'bar');
    });

    it('stdio without env omits env key', () => {
      const cfg = toClaudeConfig(stdioServerNoCreds);
      assert.equal(cfg.env, undefined);
    });
  });

  describe('toCodexConfig', () => {
    it('HTTP returns { url }', () => {
      const cfg = toCodexConfig(httpServer);
      assert.deepEqual(cfg, { url: 'http://localhost:3000/mcp' });
    });

    it('stdio returns { command, args, env }', () => {
      const cfg = toCodexConfig(stdioServer, { API_KEY: 'k' });
      assert.equal(cfg.command, 'npx');
      assert.deepEqual(cfg.args, ['-y', 'some-pkg']);
      assert.equal(cfg.env.API_KEY, 'k');
      assert.equal(cfg.env.FOO, 'bar');
    });
  });

  describe('toGeminiConfig', () => {
    it('HTTP returns { httpUrl }', () => {
      const cfg = toGeminiConfig(httpServer);
      assert.deepEqual(cfg, { httpUrl: 'http://localhost:3000/mcp' });
    });

    it('stdio returns { command, args, env }', () => {
      const cfg = toGeminiConfig(stdioServer, { API_KEY: 'g' });
      assert.equal(cfg.command, 'npx');
      assert.equal(cfg.env.API_KEY, 'g');
      assert.equal(cfg.env.FOO, 'bar');
    });
  });

  describe('buildConfigBlock', () => {
    it('builds a full servers object keyed by name', () => {
      const block = buildConfigBlock(
        [httpServer, stdioServer],
        { 'test-stdio': { API_KEY: 'val' } },
        toClaudeConfig,
      );
      assert.ok('test-http' in block);
      assert.ok('test-stdio' in block);
      assert.equal(block['test-http'].type, 'http');
      assert.equal(block['test-stdio'].env.API_KEY, 'val');
    });
  });

  it('credentials merge into env correctly', () => {
    const cfg = toClaudeConfig(stdioServer, { API_KEY: 'mykey' });
    assert.equal(cfg.env.API_KEY, 'mykey');
    assert.equal(cfg.env.FOO, 'bar');
  });

  it('credential uses default when value not provided', () => {
    const serverWithDefault = {
      ...stdioServer,
      credentials: [{ key: 'API_KEY', label: 'key', secret: true, default: 'fallback' }],
    };
    const cfg = toClaudeConfig(serverWithDefault, {});
    assert.equal(cfg.env.API_KEY, 'fallback');
  });

  it('staticEnv included when present', () => {
    const cfg = toClaudeConfig(stdioServer, {});
    assert.equal(cfg.env.FOO, 'bar');
  });
});

// ---------------------------------------------------------------------------
// 4. Merge
// ---------------------------------------------------------------------------
describe('Merge', () => {
  describe('mergeJSON', () => {
    it('preserves existing keys and merges mcpServers', () => {
      const existing = { someKey: 'value', mcpServers: { old: { x: 1 } } };
      const result = mergeJSON(existing, { newServer: { y: 2 } });
      assert.equal(result.someKey, 'value');
      assert.deepEqual(result.mcpServers.old, { x: 1 });
      assert.deepEqual(result.mcpServers.newServer, { y: 2 });
    });

    it('handles null existing', () => {
      const result = mergeJSON(null, { s1: { a: 1 } });
      assert.deepEqual(result, { mcpServers: { s1: { a: 1 } } });
    });

    it('uses custom serversKey', () => {
      const result = mergeJSON(null, { s1: {} }, 'customKey');
      assert.ok('customKey' in result);
    });
  });

  describe('mergeTOML', () => {
    it('preserves existing settings and merges mcp_servers', () => {
      const existing = '[model]\nprovider = "openai"\n\n[mcp_servers.old]\nurl = "http://old"\n';
      const result = mergeTOML(existing, { newSrv: { url: 'http://new' } });
      const parsed = parseTOML(result);
      assert.equal(parsed.model.provider, 'openai');
      assert.equal(parsed.mcp_servers.old.url, 'http://old');
      assert.equal(parsed.mcp_servers.newSrv.url, 'http://new');
    });

    it('handles null existing', () => {
      const result = mergeTOML(null, { s1: { command: 'npx', args: ['-y', 'pkg'] } });
      const parsed = parseTOML(result);
      assert.equal(parsed.mcp_servers.s1.command, 'npx');
    });

    it('handles empty string existing', () => {
      const result = mergeTOML('', { s1: { url: 'http://x' } });
      const parsed = parseTOML(result);
      assert.equal(parsed.mcp_servers.s1.url, 'http://x');
    });
  });
});

// ---------------------------------------------------------------------------
// 5. FS Helpers
// ---------------------------------------------------------------------------
describe('FS Helpers', () => {
  let tmpDir;

  before(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'mcp-test-'));
  });

  after(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('readJSON returns null for nonexistent file', async () => {
    const result = await readJSON(join(tmpDir, 'nope.json'));
    assert.equal(result, null);
  });

  it('readText returns null for nonexistent file', async () => {
    const result = await readText(join(tmpDir, 'nope.txt'));
    assert.equal(result, null);
  });

  it('safeWriteJSON creates dirs and writes correctly', async () => {
    const filePath = join(tmpDir, 'sub', 'dir', 'test.json');
    await safeWriteJSON(filePath, { hello: 'world' });
    const content = await readJSON(filePath);
    assert.deepEqual(content, { hello: 'world' });
  });

  it('safeWriteText creates dirs and writes correctly', async () => {
    const filePath = join(tmpDir, 'sub2', 'test.txt');
    await safeWriteText(filePath, 'hello world');
    const content = await readText(filePath);
    assert.equal(content, 'hello world');
  });

  it('backup creates timestamped copy', async () => {
    const filePath = join(tmpDir, 'backup-test.json');
    await writeFile(filePath, '{"a":1}', 'utf8');
    const backupPath = await backup(filePath);
    assert.ok(backupPath !== null);
    assert.match(backupPath, /\.backup-/);
    const backupContent = await readFile(backupPath, 'utf8');
    assert.equal(backupContent, '{"a":1}');
  });

  it('backup returns null when file does not exist', async () => {
    const result = await backup(join(tmpDir, 'no-such-file.json'));
    assert.equal(result, null);
  });

  it('fileExists returns true for existing file', async () => {
    const filePath = join(tmpDir, 'exists.txt');
    await writeFile(filePath, 'yes', 'utf8');
    assert.equal(await fileExists(filePath), true);
  });

  it('fileExists returns false for missing file', async () => {
    assert.equal(await fileExists(join(tmpDir, 'missing.txt')), false);
  });
});

// ---------------------------------------------------------------------------
// 6. Writer build functions
// ---------------------------------------------------------------------------
describe('Writer build functions', () => {
  let tmpDir;

  before(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'mcp-writers-'));
  });

  after(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  const sampleServers = [
    {
      name: 'test-http',
      transport: 'http',
      url: 'http://localhost:3000/mcp',
      credentials: [],
      staticEnv: {},
    },
    {
      name: 'test-stdio',
      transport: 'stdio',
      command: 'npx',
      args: ['-y', 'test-pkg'],
      credentials: [],
      staticEnv: {},
    },
  ];

  it('buildClaudeProject produces JSON with mcpServers', async () => {
    const result = await buildClaudeProject(tmpDir, sampleServers, {});
    assert.equal(result.format, 'json');
    assert.ok(result.data.mcpServers);
    assert.equal(result.data.mcpServers['test-http'].type, 'http');
    assert.equal(result.data.mcpServers['test-http'].url, 'http://localhost:3000/mcp');
    assert.equal(result.data.mcpServers['test-stdio'].command, 'npx');
    assert.deepEqual(result.data.mcpServers['test-stdio'].args, ['-y', 'test-pkg']);
  });

  it('buildCodexProject produces TOML string with mcp_servers', async () => {
    const result = await buildCodexProject(tmpDir, sampleServers, {});
    assert.equal(result.format, 'toml');
    assert.ok(typeof result.data === 'string');
    const parsed = parseTOML(result.data);
    assert.ok(parsed.mcp_servers);
    assert.equal(parsed.mcp_servers['test-http'].url, 'http://localhost:3000/mcp');
    assert.equal(parsed.mcp_servers['test-stdio'].command, 'npx');
  });

  it('buildGeminiProject produces JSON with httpUrl for HTTP, command/args for stdio', async () => {
    const result = await buildGeminiProject(tmpDir, sampleServers, {});
    assert.equal(result.format, 'json');
    assert.ok(result.data.mcpServers);
    assert.equal(result.data.mcpServers['test-http'].httpUrl, 'http://localhost:3000/mcp');
    assert.equal(result.data.mcpServers['test-stdio'].command, 'npx');
    assert.deepEqual(result.data.mcpServers['test-stdio'].args, ['-y', 'test-pkg']);
  });
});

// ---------------------------------------------------------------------------
// 7. Writer orchestrator - buildAll
// ---------------------------------------------------------------------------
describe('buildAll', () => {
  let tmpDir;

  before(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'mcp-buildall-'));
  });

  after(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('produces configs for each selected tool with correct count', async () => {
    const globalServers = [getServer('playwright')];
    const projectServers = [getServer('atlassian')];
    const workspaces = [{ dir: tmpDir, credentials: {} }];
    const cmsTemplates = [];

    const configs = await buildAll(
      ['claude', 'gemini'],
      globalServers, {}, workspaces, cmsTemplates, projectServers,
    );

    // 2 tools x (1 global + 1 project) = 4
    assert.equal(configs.length, 4);

    const claudeConfigs = configs.filter((c) => c.tool === 'claude');
    const geminiConfigs = configs.filter((c) => c.tool === 'gemini');
    assert.equal(claudeConfigs.length, 2);
    assert.equal(geminiConfigs.length, 2);

    assert.ok(claudeConfigs.some((c) => c.scope === 'global'));
    assert.ok(claudeConfigs.some((c) => c.scope === 'project'));
  });

  it('includes CMS templates as additional project entries', async () => {
    const cmsDir = join(tmpDir, 'cms-site');
    await mkdir(cmsDir, { recursive: true });
    const cmsTemplates = [{
      dir: cmsDir,
      mysqlConfig: { MYSQL_HOST: '127.0.0.1', MYSQL_DB: 'wp' },
    }];

    const configs = await buildAll(
      ['claude'],
      [], {}, [], cmsTemplates, [],
    );

    // 1 tool x (1 global + 0 workspaces + 1 cms) = 2
    assert.equal(configs.length, 2);
    const projectConfigs = configs.filter((c) => c.scope === 'project');
    assert.equal(projectConfigs.length, 1);
    assert.equal(projectConfigs[0].dir, cmsDir);
  });
});
