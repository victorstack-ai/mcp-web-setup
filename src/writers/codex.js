import { join } from 'node:path';
import { homedir } from 'node:os';
import { backup, safeWriteText } from '../utils/fs-helpers.js';
import { mergeIntoTOMLFile } from '../utils/merge.js';
import { toCodexConfig, buildConfigBlock } from '../servers/transforms.js';

const GLOBAL_CONFIG = join(homedir(), '.codex', 'config.toml');

function projectConfigPath(dir) {
  return join(dir, '.codex', 'config.toml');
}

export async function writeCodexGlobal(globalServers, credentialValues) {
  const newServers = buildConfigBlock(globalServers, credentialValues, toCodexConfig);
  const tomlText = await mergeIntoTOMLFile(GLOBAL_CONFIG, newServers);
  const backupPath = await backup(GLOBAL_CONFIG);
  await safeWriteText(GLOBAL_CONFIG, tomlText + '\n');
  return { filePath: GLOBAL_CONFIG, backupPath };
}

export async function writeCodexProject(dir, projectServers, credentialValues) {
  const filePath = projectConfigPath(dir);
  const newServers = buildConfigBlock(projectServers, credentialValues, toCodexConfig);
  const tomlText = await mergeIntoTOMLFile(filePath, newServers);
  const backupPath = await backup(filePath);
  await safeWriteText(filePath, tomlText + '\n');
  return { filePath, backupPath };
}

export async function buildCodexGlobal(globalServers, credentialValues) {
  const newServers = buildConfigBlock(globalServers, credentialValues, toCodexConfig);
  const tomlText = await mergeIntoTOMLFile(GLOBAL_CONFIG, newServers);
  return { filePath: GLOBAL_CONFIG, data: tomlText, format: 'toml' };
}

export async function buildCodexProject(dir, projectServers, credentialValues) {
  const filePath = projectConfigPath(dir);
  const newServers = buildConfigBlock(projectServers, credentialValues, toCodexConfig);
  const tomlText = await mergeIntoTOMLFile(filePath, newServers);
  return { filePath, data: tomlText, format: 'toml' };
}
