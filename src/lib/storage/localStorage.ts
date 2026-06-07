import type { SongProject } from "../types";

const STORAGE_KEY = "songflow_projects";

export function loadProjects(): SongProject[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SongProject[];
  } catch {
    return [];
  }
}

export function saveProjects(projects: SongProject[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}
