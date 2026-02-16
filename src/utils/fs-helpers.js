import { readFile, writeFile, mkdir, copyFile, access } from 'node:fs/promises';
import { dirname } from 'node:path';

export async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function ensureDir(filePath) {
  await mkdir(dirname(filePath), { recursive: true });
}

export async function readJSON(filePath) {
  try {
    const raw = await readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function readText(filePath) {
  try {
    return await readFile(filePath, 'utf8');
  } catch {
    return null;
  }
}

export async function backup(filePath) {
  if (await fileExists(filePath)) {
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `${filePath}.backup-${ts}`;
    await copyFile(filePath, backupPath);
    return backupPath;
  }
  return null;
}

export async function safeWriteJSON(filePath, data) {
  await ensureDir(filePath);
  await writeFile(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

export async function safeWriteText(filePath, text) {
  await ensureDir(filePath);
  await writeFile(filePath, text, 'utf8');
}
