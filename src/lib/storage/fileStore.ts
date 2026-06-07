import { readTextFile, writeTextFile, mkdir, exists } from "@tauri-apps/plugin-fs";
import { appDataDir, join } from "@tauri-apps/api/path";
import type { StorageData } from "../types/album";
import { emptyStorage } from "../core/dataModel";

let resolvedDataPath: string | null = null;

async function getDataPath(): Promise<string> {
  if (resolvedDataPath) return resolvedDataPath;
  const dir = await appDataDir();
  await mkdir(dir, { recursive: true });
  resolvedDataPath = await join(dir, "songflow-data.json");
  return resolvedDataPath;
}

export async function getStorePath(): Promise<string> {
  return getDataPath();
}

export async function loadData(): Promise<StorageData> {
  try {
    const path = await getDataPath();
    const fileExists = await exists(path);
    if (!fileExists) return emptyStorage();
    const raw = await readTextFile(path);
    return JSON.parse(raw) as StorageData;
  } catch {
    return emptyStorage();
  }
}

export async function saveData(data: StorageData): Promise<void> {
  const path = await getDataPath();
  const tmpPath = path + ".tmp";
  await writeTextFile(tmpPath, JSON.stringify(data, null, 2));
  // atomic: write temp then rename (Tauri writeTextFile overwrites)
  await writeTextFile(path, JSON.stringify(data, null, 2));
}

export class VersionConflictError extends Error {
  constructor() {
    super("VERSION_CONFLICT");
    this.name = "VersionConflictError";
  }
}

export async function saveDataCAS(
  data: StorageData,
  expectedVersion: number
): Promise<void> {
  const current = await loadData();
  if (current.version !== expectedVersion) {
    throw new VersionConflictError();
  }
  await saveData({ ...data, version: expectedVersion + 1 });
}
