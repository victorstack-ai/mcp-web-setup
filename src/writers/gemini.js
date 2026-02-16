import { join } from 'node:path';
import { homedir } from 'node:os';
import { backup, safeWriteJSON } from '../utils/fs-helpers.js';
import { mergeIntoJSONFile } from '../utils/merge.js';
import { toGeminiConfig, buildConfigBlock } from '../servers/transforms.js';

const GLOBAL_CONFIG = join(homedir(), '.gemini', 'settings.json');

function projectConfigPath(dir) {
  return join(dir, '.gemini', 'settings.json');
}

export async function writeGeminiGlobal(globalServers, credentialValues) {
  const newServers = buildConfigBlock(globalServers, credentialValues, toGeminiConfig);
  const merged = await mergeIntoJSONFile(GLOBAL_CONFIG, newServers);
  const backupPath = await backup(GLOBAL_CONFIG);
  await safeWriteJSON(GLOBAL_CONFIG, merged);
  return { filePath: GLOBAL_CONFIG, backupPath };
}

export async function writeGeminiProject(dir, projectServers, credentialValues) {
  const filePath = projectConfigPath(dir);
  const newServers = buildConfigBlock(projectServers, credentialValues, toGeminiConfig);
  const merged = await mergeIntoJSONFile(filePath, newServers);
  const backupPath = await backup(filePath);
  await safeWriteJSON(filePath, merged);
  return { filePath, backupPath };
}

export async function buildGeminiGlobal(globalServers, credentialValues) {
  const newServers = buildConfigBlock(globalServers, credentialValues, toGeminiConfig);
  const merged = await mergeIntoJSONFile(GLOBAL_CONFIG, newServers);
  return { filePath: GLOBAL_CONFIG, data: merged, format: 'json' };
}

export async function buildGeminiProject(dir, projectServers, credentialValues) {
  const filePath = projectConfigPath(dir);
  const newServers = buildConfigBlock(projectServers, credentialValues, toGeminiConfig);
  const merged = await mergeIntoJSONFile(filePath, newServers);
  return { filePath, data: merged, format: 'json' };
}
