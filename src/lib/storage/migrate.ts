import { writeTextFile } from "@tauri-apps/plugin-fs";
import { appDataDir, join } from "@tauri-apps/api/path";
import type { SongProject } from "../types/project";
import type { StorageData } from "../types/album";
import { loadData, saveData } from "./fileStore";
import { createAlbum, createTrack } from "../core/dataModel";
import { emptyStorage } from "../core/dataModel";

export async function migrateLegacy(): Promise<void> {
  // Check if migration already done
  const existing = await loadData();
  if (existing.version >= 1) return;

  // Read from WebView localStorage
  const raw = localStorage.getItem("songflow_projects");
  if (!raw) {
    // No legacy data — initialize fresh storage
    await saveData({ ...emptyStorage(), version: 1 });
    return;
  }

  let projects: SongProject[];
  try {
    projects = JSON.parse(raw) as SongProject[];
  } catch {
    return;
  }

  // Backup legacy data before migration
  try {
    const dir = await appDataDir();
    const backupPath = await join(dir, "songflow-legacy-backup.json");
    await writeTextFile(backupPath, raw);
  } catch {
    // Backup failure is non-fatal but log to console
    console.warn("SongFlow: could not write legacy backup");
  }

  // Migrate each SongProject → Album + one default Track
  let data: StorageData = { ...emptyStorage(), version: 1 };

  for (const project of projects) {
    const { data: d1, album } = createAlbum(data, {
      title: project.title,
      genre: project.genre,
      concept: [project.description, project.targetVibe]
        .filter(Boolean)
        .join(" — "),
    });
    data = d1;

    const { data: d2 } = createTrack(data, album.id, {
      title: "메인 트랙",
      concept: project.description,
    });

    // Move workflow data from project to the new track
    const track = d2.tracks[d2.tracks.length - 1];
    data = {
      ...d2,
      tracks: d2.tracks.map((t) =>
        t.id === track.id
          ? {
              ...t,
              references: project.references ?? [],
              referenceAnalyses: project.referenceAnalyses ?? [],
              chordProgressions: project.chordProgressions ?? [],
              selectedChordProgressionId: project.selectedChordProgressionId,
              groovePatterns: project.groovePatterns ?? [],
              selectedGroovePatternId: project.selectedGroovePatternId,
              soundKeywords: project.soundKeywords,
              prompts: project.prompts ?? [],
              sunoResults: project.sunoResults ?? [],
              feedbacks: project.feedbacks ?? [],
              refinements: project.refinements ?? [],
              agentRequests: project.agentRequests ?? [],
              agentResponses: project.agentResponses ?? [],
              notes: (project.notes ?? []).map((n) => ({
                id: n.id,
                content: n.content,
                createdAt: n.createdAt,
                updatedAt: n.updatedAt,
              })),
            }
          : t
      ),
    };
  }

  await saveData(data);
}
