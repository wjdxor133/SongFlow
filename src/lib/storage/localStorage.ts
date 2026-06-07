// @deprecated This module is no longer used. Data is now stored via fileStore.ts.
// Kept as a stub so legacy imports in useProjectStore don't break during cleanup phase.
import type { SongProject } from "../types/project";

export function loadProjects(): SongProject[] {
  try {
    const raw = localStorage.getItem("songflow_projects");
    return raw ? (JSON.parse(raw) as SongProject[]) : [];
  } catch {
    return [];
  }
}

export function saveProjects(projects: SongProject[]): void {
  localStorage.setItem("songflow_projects", JSON.stringify(projects));
}
