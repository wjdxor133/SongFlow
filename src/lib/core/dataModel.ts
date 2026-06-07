import type { Album, Track, StorageData } from "../types/album";

export function emptyStorage(): StorageData {
  return { version: 0, albums: [], tracks: [] };
}

export function createAlbum(
  data: StorageData,
  input: { title: string; genre: string; concept: string }
): { data: StorageData; album: Album } {
  const now = new Date().toISOString();
  const album: Album = {
    id: crypto.randomUUID(),
    title: input.title,
    genre: input.genre,
    concept: input.concept,
    createdAt: now,
    updatedAt: now,
  };
  return {
    data: { ...data, albums: [...data.albums, album] },
    album,
  };
}

export function updateAlbum(
  data: StorageData,
  id: string,
  patch: Partial<Pick<Album, "title" | "genre" | "concept">>
): StorageData {
  return {
    ...data,
    albums: data.albums.map((a) =>
      a.id === id ? { ...a, ...patch, updatedAt: new Date().toISOString() } : a
    ),
  };
}

export function deleteAlbum(data: StorageData, id: string): StorageData {
  return {
    ...data,
    albums: data.albums.filter((a) => a.id !== id),
    tracks: data.tracks.filter((t) => t.albumId !== id),
  };
}

export function createTrack(
  data: StorageData,
  albumId: string,
  input: {
    title: string;
    genre?: string;
    bpm?: number;
    key?: string;
    concept?: string;
    lyrics?: string;
  }
): { data: StorageData; track: Track } {
  const now = new Date().toISOString();
  const track: Track = {
    id: crypto.randomUUID(),
    albumId,
    title: input.title,
    genre: input.genre,
    bpm: input.bpm,
    key: input.key,
    concept: input.concept,
    lyrics: input.lyrics,
    references: [],
    referenceAnalyses: [],
    chordProgressions: [],
    groovePatterns: [],
    prompts: [],
    sunoResults: [],
    feedbacks: [],
    refinements: [],
    agentRequests: [],
    agentResponses: [],
    notes: [],
    createdAt: now,
    updatedAt: now,
  };
  return {
    data: { ...data, tracks: [...data.tracks, track] },
    track,
  };
}

export function updateTrack(
  data: StorageData,
  id: string,
  patch: Partial<
    Pick<
      Track,
      | "title"
      | "genre"
      | "bpm"
      | "key"
      | "concept"
      | "lyrics"
      | "selectedChordProgressionId"
      | "selectedGroovePatternId"
      | "soundKeywords"
      | "prompts"
      | "sunoResults"
      | "feedbacks"
      | "refinements"
      | "agentRequests"
      | "agentResponses"
      | "notes"
      | "references"
      | "referenceAnalyses"
      | "chordProgressions"
      | "groovePatterns"
    >
  >
): StorageData {
  return {
    ...data,
    tracks: data.tracks.map((t) =>
      t.id === id ? { ...t, ...patch, updatedAt: new Date().toISOString() } : t
    ),
  };
}

export function deleteTrack(data: StorageData, id: string): StorageData {
  return {
    ...data,
    tracks: data.tracks.filter((t) => t.id !== id),
  };
}

export function getAlbumTracks(data: StorageData, albumId: string): Track[] {
  return data.tracks.filter((t) => t.albumId === albumId);
}

export function getTrackEffectiveGenre(track: Track, album: Album): string {
  return track.genre ?? album.genre;
}

export function appendToTrack<K extends keyof Track>(
  data: StorageData,
  trackId: string,
  field: K,
  item: Track[K] extends Array<infer I> ? I : never
): StorageData {
  return {
    ...data,
    tracks: data.tracks.map((t) => {
      if (t.id !== trackId) return t;
      const arr = t[field] as unknown[];
      return {
        ...t,
        [field]: [...arr, item],
        updatedAt: new Date().toISOString(),
      };
    }),
  };
}
