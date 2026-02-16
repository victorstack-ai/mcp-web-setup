import { parse, stringify } from 'smol-toml';
import { readJSON, readText } from './fs-helpers.js';

// Merge mcpServers into an existing Claude/Gemini JSON config.
// Preserves all existing keys; only merges into mcpServers.
export function mergeJSON(existing, newServers, serversKey = 'mcpServers') {
  const merged = existing ? { ...existing } : {};
  merged[serversKey] = {
    ...(merged[serversKey] || {}),
    ...newServers,
  };
  return merged;
}

// Merge mcp_servers into an existing Codex TOML config.
// Preserves all existing keys; only merges into mcp_servers.
export function mergeTOML(existingText, newServers) {
  let existing = {};
  if (existingText) {
    try {
      existing = parse(existingText);
    } catch {
      existing = {};
    }
  }
  if (!existing.mcp_servers) {
    existing.mcp_servers = {};
  }
  for (const [name, config] of Object.entries(newServers)) {
    existing.mcp_servers[name] = config;
  }
  return stringify(existing);
}

// Load existing JSON config file and merge new servers in.
export async function mergeIntoJSONFile(filePath, newServers, serversKey = 'mcpServers') {
  const existing = await readJSON(filePath);
  return mergeJSON(existing, newServers, serversKey);
}

// Load existing TOML config file and merge new servers in.
export async function mergeIntoTOMLFile(filePath, newServers) {
  const existingText = await readText(filePath);
  return mergeTOML(existingText, newServers);
}
