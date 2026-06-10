import fs from "node:fs";
import path from "node:path";
import { getStoreFilePath, getAppDataDir } from "./paths.js";

export type TrackNote = {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export type Album = {
  id: string;
  title: string;
  genre: string;
  concept: string;
  createdAt: string;
  updatedAt: string;
};

export type Track = {
  id: string;
  albumId: string;
  title: string;
  genre?: string;
  bpm?: number;
  key?: string;
  concept?: string;
  lyrics?: string;
  references: unknown[];
  referenceAnalyses: unknown[];
  chordProgressions: unknown[];
  selectedChordProgressionId?: string;
  groovePatterns: unknown[];
  selectedGroovePatternId?: string;
  soundKeywords?: unknown;
  prompts: unknown[];
  sunoResults: unknown[];
  feedbacks: unknown[];
  refinements: unknown[];
  agentRequests: unknown[];
  agentResponses: unknown[];
  notes: TrackNote[];
  createdAt: string;
  updatedAt: string;
};

export type StorageData = {
  version: number;
  albums: Album[];
  tracks: Track[];
};

function emptyStorage(): StorageData {
  return { version: 0, albums: [], tracks: [] };
}

export function loadData(): StorageData {
  const filePath = getStoreFilePath();
  if (!fs.existsSync(filePath)) return emptyStorage();
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as StorageData;
  } catch {
    return emptyStorage();
  }
}

export class VersionConflictError extends Error {
  constructor() {
    super("VERSION_CONFLICT");
    this.name = "VersionConflictError";
  }
}

export function saveDataCAS(data: StorageData, expectedVersion: number): void {
  const current = loadData();
  if (current.version !== expectedVersion) {
    throw new VersionConflictError();
  }
  const dir = getAppDataDir();
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const filePath = getStoreFilePath();
  const tmpPath = filePath + ".tmp";
  fs.writeFileSync(tmpPath, JSON.stringify({ ...data, version: expectedVersion + 1 }, null, 2), "utf-8");
  fs.renameSync(tmpPath, filePath);
}

export function withCAS(transform: (data: StorageData) => StorageData): StorageData {
  const maxRetries = 3;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const current = loadData();
    const next = transform(current);
    try {
      saveDataCAS(next, current.version);
      return loadData();
    } catch (err) {
      if (err instanceof VersionConflictError && attempt < maxRetries - 1) continue;
      throw err;
    }
  }
  throw new Error("CAS failed after max retries");
}
