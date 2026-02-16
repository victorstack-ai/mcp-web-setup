// Transform server definitions into tool-specific config formats.

function buildEnv(server, credentialValues) {
  const env = { ...server.staticEnv };
  for (const cred of server.credentials) {
    env[cred.key] = credentialValues[cred.key] || cred.default || '';
  }
  return Object.keys(env).length > 0 ? env : undefined;
}

// Claude Code format: JSON with "type"/"url" for HTTP, "command"/"args"/"env" for stdio
export function toClaudeConfig(server, credentialValues = {}) {
  if (server.transport === 'http') {
    return { type: 'http', url: server.url };
  }
  const entry = { command: server.command, args: [...server.args] };
  const env = buildEnv(server, credentialValues);
  if (env) entry.env = env;
  return entry;
}

// Codex CLI format: TOML with "url" for HTTP, "command"/"args"/[env] for stdio
export function toCodexConfig(server, credentialValues = {}) {
  if (server.transport === 'http') {
    return { url: server.url };
  }
  const entry = { command: server.command, args: [...server.args] };
  const env = buildEnv(server, credentialValues);
  if (env) entry.env = env;
  return entry;
}

// Gemini CLI format: JSON with "httpUrl" for HTTP, "command"/"args"/"env" for stdio
export function toGeminiConfig(server, credentialValues = {}) {
  if (server.transport === 'http') {
    return { httpUrl: server.url };
  }
  const entry = { command: server.command, args: [...server.args] };
  const env = buildEnv(server, credentialValues);
  if (env) entry.env = env;
  return entry;
}

// Build a full mcpServers object for a list of servers
export function buildConfigBlock(servers, credentialValues, transformFn) {
  const block = {};
  for (const server of servers) {
    block[server.name] = transformFn(server, credentialValues[server.name] || {});
  }
  return block;
}
