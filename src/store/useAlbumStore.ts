import { create } from "zustand";
import type {
  Album,
  Track,
  StorageData,
  TrackNote,
} from "../lib/types/album";
import type {
  AgentRequest,
  AgentResponse,
} from "../lib/types/agent";
import type { GeneratedPrompt, ResultFeedback, PromptRefinement } from "../lib/types/prompt";
import type { SunoResult } from "../lib/types/suno";
import {
  loadData,
  saveDataCAS,
  VersionConflictError,
} from "../lib/storage/fileStore";
import {
  createAlbum as dmCreateAlbum,
  updateAlbum as dmUpdateAlbum,
  deleteAlbum as dmDeleteAlbum,
  createTrack as dmCreateTrack,
  updateTrack as dmUpdateTrack,
  deleteTrack as dmDeleteTrack,
  getTrackEffectiveGenre as dmGetTrackEffectiveGenre,
  appendToTrack,
} from "../lib/core/dataModel";

type AlbumStore = {
  albums: Album[];
  tracks: Track[];
  isLoaded: boolean;
  _version: number;

  init: () => Promise<void>;
  startPolling: () => void;
  stopPolling: () => void;

  // Album
  createAlbum: (input: {
    title: string;
    genre: string;
    concept: string;
  }) => Promise<Album>;
  updateAlbum: (
    id: string,
    patch: Partial<Pick<Album, "title" | "genre" | "concept">>
  ) => Promise<void>;
  deleteAlbum: (id: string) => Promise<void>;
  getAlbumById: (id: string) => Album | undefined;

  // Track
  createTrack: (
    albumId: string,
    input: {
      title: string;
      genre?: string;
      bpm?: number;
      key?: string;
      concept?: string;
      lyrics?: string;
    }
  ) => Promise<Track>;
  updateTrack: (
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
  ) => Promise<void>;
  deleteTrack: (id: string) => Promise<void>;
  getTracksByAlbum: (albumId: string) => Track[];
  getTrackById: (id: string) => Track | undefined;
  getTrackEffectiveGenre: (trackId: string) => string;

  // Track workflow appends
  addAgentRequest: (trackId: string, request: AgentRequest) => Promise<void>;
  addAgentResponse: (trackId: string, response: AgentResponse) => Promise<void>;
  addPrompt: (trackId: string, prompt: GeneratedPrompt) => Promise<void>;
  addSunoResult: (trackId: string, result: SunoResult) => Promise<void>;
  addFeedback: (trackId: string, feedback: ResultFeedback) => Promise<void>;
  addRefinement: (trackId: string, refinement: PromptRefinement) => Promise<void>;
  addNote: (trackId: string, note: TrackNote) => Promise<void>;
};

async function withCAS(
  set: (fn: (s: AlbumStore) => Partial<AlbumStore>) => void,
  transform: (data: StorageData) => StorageData
): Promise<void> {
  const maxRetries = 3;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const current = await loadData();
    const next = transform(current);
    try {
      await saveDataCAS(next, current.version);
      set(() => ({ albums: next.albums, tracks: next.tracks }));
      return;
    } catch (err) {
      if (err instanceof VersionConflictError && attempt < maxRetries - 1) {
        continue;
      }
      throw err;
    }
  }
}

let _pollTimer: ReturnType<typeof setInterval> | null = null;

export const useAlbumStore = create<AlbumStore>((set, get) => ({
  albums: [],
  tracks: [],
  isLoaded: false,
  _version: -1,

  async init() {
    const data = await loadData();
    set({ albums: data.albums, tracks: data.tracks, isLoaded: true, _version: data.version });
  },

  startPolling() {
    if (_pollTimer) return;
    _pollTimer = setInterval(async () => {
      const data = await loadData();
      if (data.version !== get()._version) {
        set({ albums: data.albums, tracks: data.tracks, _version: data.version });
      }
    }, 2000);
  },

  stopPolling() {
    if (_pollTimer) {
      clearInterval(_pollTimer);
      _pollTimer = null;
    }
  },

  async createAlbum(input) {
    let created!: Album;
    await withCAS(set, (data) => {
      const { data: next, album } = dmCreateAlbum(data, input);
      created = album;
      return next;
    });
    return created;
  },

  async updateAlbum(id, patch) {
    await withCAS(set, (data) => dmUpdateAlbum(data, id, patch));
  },

  async deleteAlbum(id) {
    await withCAS(set, (data) => dmDeleteAlbum(data, id));
  },

  getAlbumById(id) {
    return get().albums.find((a) => a.id === id);
  },

  async createTrack(albumId, input) {
    let created!: Track;
    await withCAS(set, (data) => {
      const { data: next, track } = dmCreateTrack(data, albumId, input);
      created = track;
      return next;
    });
    return created;
  },

  async updateTrack(id, patch) {
    await withCAS(set, (data) => dmUpdateTrack(data, id, patch));
  },

  async deleteTrack(id) {
    await withCAS(set, (data) => dmDeleteTrack(data, id));
  },

  getTracksByAlbum(albumId) {
    return get().tracks.filter((t) => t.albumId === albumId);
  },

  getTrackById(id) {
    return get().tracks.find((t) => t.id === id);
  },

  getTrackEffectiveGenre(trackId) {
    const track = get().tracks.find((t) => t.id === trackId);
    if (!track) return "";
    const album = get().albums.find((a) => a.id === track.albumId);
    if (!album) return track.genre ?? "";
    return dmGetTrackEffectiveGenre(track, album);
  },

  async addAgentRequest(trackId, request) {
    await withCAS(set, (data) =>
      appendToTrack(data, trackId, "agentRequests", request)
    );
  },

  async addAgentResponse(trackId, response) {
    await withCAS(set, (data) =>
      appendToTrack(data, trackId, "agentResponses", response)
    );
  },

  async addPrompt(trackId, prompt) {
    await withCAS(set, (data) =>
      appendToTrack(data, trackId, "prompts", prompt)
    );
  },

  async addSunoResult(trackId, result) {
    await withCAS(set, (data) =>
      appendToTrack(data, trackId, "sunoResults", result)
    );
  },

  async addFeedback(trackId, feedback) {
    await withCAS(set, (data) =>
      appendToTrack(data, trackId, "feedbacks", feedback)
    );
  },

  async addRefinement(trackId, refinement) {
    await withCAS(set, (data) =>
      appendToTrack(data, trackId, "refinements", refinement)
    );
  },

  async addNote(trackId, note) {
    await withCAS(set, (data) =>
      appendToTrack(data, trackId, "notes", note)
    );
  },
}));
