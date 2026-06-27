#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { loadData, withCAS, type Album, type Track, type StorageData } from "./store.js";

function randomId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function now(): string {
  return new Date().toISOString();
}

const server = new Server(
  { name: "songflow-mcp", version: "0.1.0" },
  { capabilities: { tools: {} } }
);

// ─── Tool definitions ────────────────────────────────────────────────────────

const TOOLS = [
  // Album tools
  {
    name: "list_albums",
    description: "List all albums in the SongFlow workspace",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "get_album",
    description: "Get an album with its tracks",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string", description: "Album ID" } },
      required: ["id"],
    },
  },
  {
    name: "create_album",
    description: "Create a new album",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string" },
        genre: { type: "string" },
        concept: { type: "string" },
      },
      required: ["title", "genre", "concept"],
    },
  },
  {
    name: "update_album",
    description: "Update album fields",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        title: { type: "string" },
        genre: { type: "string" },
        concept: { type: "string" },
      },
      required: ["id"],
    },
  },
  {
    name: "delete_album",
    description: "Delete an album and all its tracks",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string" } },
      required: ["id"],
    },
  },
  // Track tools
  {
    name: "list_tracks",
    description: "List tracks in an album",
    inputSchema: {
      type: "object",
      properties: { albumId: { type: "string" } },
      required: ["albumId"],
    },
  },
  {
    name: "get_track",
    description: "Get a track by ID",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string" } },
      required: ["id"],
    },
  },
  {
    name: "create_track",
    description: "Create a new track in an album",
    inputSchema: {
      type: "object",
      properties: {
        albumId: { type: "string" },
        title: { type: "string" },
        genre: { type: "string" },
        bpm: { type: "number" },
        key: { type: "string", description: "Musical key, e.g. C major" },
        concept: { type: "string" },
        lyrics: { type: "string" },
      },
      required: ["albumId", "title"],
    },
  },
  {
    name: "update_track",
    description: "Update track fields including lyrics, BPM, key, concept",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        title: { type: "string" },
        genre: { type: "string" },
        bpm: { type: "number" },
        key: { type: "string" },
        concept: { type: "string" },
        lyrics: { type: "string" },
      },
      required: ["id"],
    },
  },
  {
    name: "delete_track",
    description: "Delete a track",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string" } },
      required: ["id"],
    },
  },
  // Workflow tools
  {
    name: "save_agent_response",
    description: "Save an AI agent response to a track (parses JSON if possible)",
    inputSchema: {
      type: "object",
      properties: {
        trackId: { type: "string" },
        task: { type: "string", description: "Agent task name, e.g. generate_suno_prompts" },
        rawText: { type: "string", description: "Raw text response from the agent" },
      },
      required: ["trackId", "task", "rawText"],
    },
  },
  {
    name: "get_track_prompts",
    description: "Get all generated Suno prompts for a track",
    inputSchema: {
      type: "object",
      properties: { trackId: { type: "string" } },
      required: ["trackId"],
    },
  },
  {
    name: "save_suno_result",
    description: "Save a Suno generation result linked to a track",
    inputSchema: {
      type: "object",
      properties: {
        trackId: { type: "string" },
        promptId: { type: "string" },
        url: { type: "string" },
        rating: { type: "number", description: "1-5 rating" },
        memo: { type: "string" },
        isBestVersion: { type: "boolean" },
      },
      required: ["trackId", "url", "rating"],
    },
  },
  {
    name: "get_agent_history",
    description: "Get agent request/response history for a track",
    inputSchema: {
      type: "object",
      properties: { trackId: { type: "string" } },
      required: ["trackId"],
    },
  },
  {
    name: "save_reference_brief",
    description: "Save a Reference Brief (AI-generated analysis of a reference song) to a track",
    inputSchema: {
      type: "object",
      properties: {
        trackId: { type: "string" },
        artist: { type: "string" },
        songTitle: { type: "string" },
        summary: { type: "string" },
        genreTags: { type: "array", items: { type: "string" } },
        moodTags: { type: "array", items: { type: "string" } },
        productionTraits: { type: "array", items: { type: "string" } },
        confidence: { type: "string", enum: ["low", "medium", "high"] },
        disclaimer: { type: "string" },
      },
      required: ["trackId", "artist", "songTitle", "summary"],
    },
  },
  {
    name: "get_reference_briefs",
    description: "Get all Reference Briefs for a track",
    inputSchema: {
      type: "object",
      properties: { trackId: { type: "string" } },
      required: ["trackId"],
    },
  },
  {
    name: "save_track_plan",
    description: "Save a Track Plan (AI-generated production direction guide) to a track",
    inputSchema: {
      type: "object",
      properties: {
        trackId: { type: "string" },
        referenceBriefId: { type: "string" },
        title: { type: "string" },
        directionSummary: { type: "string" },
        bpmSuggestions: { type: "array", items: { type: "number" } },
        keySuggestions: { type: "array", items: { type: "string" } },
        beginnerExplanation: { type: "string" },
        confidence: { type: "string", enum: ["low", "medium", "high"] },
      },
      required: ["trackId", "title", "directionSummary"],
    },
  },
  {
    name: "get_track_plans",
    description: "Get all Track Plans for a track",
    inputSchema: {
      type: "object",
      properties: { trackId: { type: "string" } },
      required: ["trackId"],
    },
  },
  {
    name: "save_learning_missions",
    description: "Save an array of Learning Missions to a track",
    inputSchema: {
      type: "object",
      properties: {
        trackId: { type: "string" },
        trackPlanId: { type: "string" },
        referenceBriefId: { type: "string" },
        missions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              category: { type: "string" },
              title: { type: "string" },
              objective: { type: "string" },
              explanation: { type: "string" },
              task: { type: "string" },
              beginnerHint: { type: "string" },
            },
            required: ["category", "title", "objective", "task"],
          },
        },
      },
      required: ["trackId", "missions"],
    },
  },
  {
    name: "get_learning_missions",
    description: "Get all Learning Missions for a track",
    inputSchema: {
      type: "object",
      properties: { trackId: { type: "string" } },
      required: ["trackId"],
    },
  },
  {
    name: "update_learning_mission",
    description: "Update a Learning Mission (e.g., mark as completed, add memo)",
    inputSchema: {
      type: "object",
      properties: {
        trackId: { type: "string" },
        missionId: { type: "string" },
        completed: { type: "boolean" },
        userMemo: { type: "string" },
        aiFeedback: { type: "string" },
      },
      required: ["trackId", "missionId"],
    },
  },
  {
    name: "save_chord_progressions",
    description: "Save one or more chord progressions directly to a track (appended to track.chordProgressions)",
    inputSchema: {
      type: "object",
      properties: {
        trackId: { type: "string" },
        progressions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              chords: { type: "array", items: { type: "string" }, description: "e.g. [\"Cm\", \"Ab\", \"Eb\", \"Bb\"]" },
              key: { type: "string", description: "e.g. C" },
              mode: { type: "string", enum: ["major", "minor"] },
              bpm: { type: "number" },
            },
            required: ["name", "chords", "key", "mode"],
          },
        },
      },
      required: ["trackId", "progressions"],
    },
  },
  {
    name: "save_suno_settings",
    description: "Save recommended Suno generation settings to a track (Weirdness / Style Influence / Audio Influence / expected style). Shown as a separate card in PromptLab.",
    inputSchema: {
      type: "object",
      properties: {
        trackId: { type: "string" },
        weirdness: { type: "number", description: "0-100 (%)" },
        styleInfluence: { type: "number", description: "0-100 (%)" },
        audioInfluence: { type: "number", description: "0-100 (%); omit for off (no audio reference)" },
        expectedStyle: { type: "string", description: "English one-liner describing expected output" },
      },
      required: ["trackId", "weirdness", "styleInfluence", "expectedStyle"],
    },
  },
] as const;

// ─── Tool handlers ────────────────────────────────────────────────────────────

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const a = args as Record<string, unknown>;

  try {
    switch (name) {
      case "list_albums": {
        const data = loadData();
        return { content: [{ type: "text", text: JSON.stringify(data.albums, null, 2) }] };
      }

      case "get_album": {
        const data = loadData();
        const album = data.albums.find((x) => x.id === a.id);
        if (!album) return { content: [{ type: "text", text: `Album ${a.id} not found` }], isError: true };
        const tracks = data.tracks.filter((t) => t.albumId === a.id);
        return { content: [{ type: "text", text: JSON.stringify({ album, tracks }, null, 2) }] };
      }

      case "create_album": {
        let created!: Album;
        withCAS((data) => {
          const t = now();
          created = { id: randomId(), title: String(a.title), genre: String(a.genre), concept: String(a.concept), createdAt: t, updatedAt: t };
          return { ...data, albums: [...data.albums, created] };
        });
        return { content: [{ type: "text", text: JSON.stringify(created, null, 2) }] };
      }

      case "update_album": {
        withCAS((data) => ({
          ...data,
          albums: data.albums.map((x) =>
            x.id === a.id
              ? { ...x, ...(a.title ? { title: String(a.title) } : {}), ...(a.genre ? { genre: String(a.genre) } : {}), ...(a.concept ? { concept: String(a.concept) } : {}), updatedAt: now() }
              : x
          ),
        }));
        return { content: [{ type: "text", text: "Album updated" }] };
      }

      case "delete_album": {
        withCAS((data) => ({
          ...data,
          albums: data.albums.filter((x) => x.id !== a.id),
          tracks: data.tracks.filter((t) => t.albumId !== a.id),
        }));
        return { content: [{ type: "text", text: "Album deleted" }] };
      }

      case "list_tracks": {
        const data = loadData();
        const tracks = data.tracks.filter((t) => t.albumId === a.albumId);
        return { content: [{ type: "text", text: JSON.stringify(tracks, null, 2) }] };
      }

      case "get_track": {
        const data = loadData();
        const track = data.tracks.find((t) => t.id === a.id);
        if (!track) return { content: [{ type: "text", text: `Track ${a.id} not found` }], isError: true };
        return { content: [{ type: "text", text: JSON.stringify(track, null, 2) }] };
      }

      case "create_track": {
        let created!: Track;
        withCAS((data) => {
          const t = now();
          created = {
            id: randomId(),
            albumId: String(a.albumId),
            title: String(a.title),
            ...(a.genre !== undefined ? { genre: String(a.genre) } : {}),
            ...(a.bpm !== undefined ? { bpm: Number(a.bpm) } : {}),
            ...(a.key !== undefined ? { key: String(a.key) } : {}),
            ...(a.concept !== undefined ? { concept: String(a.concept) } : {}),
            ...(a.lyrics !== undefined ? { lyrics: String(a.lyrics) } : {}),
            references: [], referenceAnalyses: [], chordProgressions: [],
            groovePatterns: [], prompts: [], sunoResults: [],
            feedbacks: [], refinements: [], agentRequests: [], agentResponses: [],
            notes: [], createdAt: t, updatedAt: t,
          };
          return { ...data, tracks: [...data.tracks, created] };
        });
        return { content: [{ type: "text", text: JSON.stringify(created, null, 2) }] };
      }

      case "update_track": {
        withCAS((data) => ({
          ...data,
          tracks: data.tracks.map((t) => {
            if (t.id !== a.id) return t;
            const patch: Partial<Track> = {};
            if (a.title !== undefined) patch.title = String(a.title);
            if (a.genre !== undefined) patch.genre = String(a.genre);
            if (a.bpm !== undefined) patch.bpm = Number(a.bpm);
            if (a.key !== undefined) patch.key = String(a.key);
            if (a.concept !== undefined) patch.concept = String(a.concept);
            if (a.lyrics !== undefined) patch.lyrics = String(a.lyrics);
            return { ...t, ...patch, updatedAt: now() };
          }),
        }));
        return { content: [{ type: "text", text: "Track updated" }] };
      }

      case "delete_track": {
        withCAS((data) => ({ ...data, tracks: data.tracks.filter((t) => t.id !== a.id) }));
        return { content: [{ type: "text", text: "Track deleted" }] };
      }

      case "save_agent_response": {
        const rawText = String(a.rawText);
        let parsedJson: unknown = undefined;
        let parseStatus: "success" | "failed" = "failed";
        let errorMessage: string | undefined;
        try {
          const cleaned = rawText.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim();
          parsedJson = JSON.parse(cleaned);
          parseStatus = "success";
        } catch (err) {
          errorMessage = err instanceof Error ? err.message : String(err);
        }
        const requestId = randomId();
        const responseId = randomId();
        const t = now();

        // generate_suno_prompts task일 때 track.prompts에도 자동 추가 (style/lyrics 분리)
        let generatedPrompt: Record<string, unknown> | null = null;
        if (String(a.task) === "generate_suno_prompts" && parseStatus === "success" && parsedJson) {
          const p = parsedJson as Record<string, unknown>;
          const style = typeof p.style === "string" ? p.style : "";
          const lyrics = typeof p.lyrics === "string" ? p.lyrics : "";
          if (style || lyrics) {
            generatedPrompt = {
              id: randomId(),
              requestId,
              style,
              lyrics,
              moreRefreshing: "",
              moreEmotional: "",
              vocalFocused: "",
              grooveFocused: "",
              createdAt: t,
            };
          }
        }

        withCAS((data) => {
          const req = { id: requestId, provider: "manual" as const, task: String(a.task), input: {}, outputSchema: "", instruction: "", createdAt: t };
          const res = { id: responseId, requestId, provider: "manual" as const, rawText, parsedJson, parseStatus, errorMessage, createdAt: t };
          const tracks = data.tracks.map((track) => {
            if (track.id !== a.trackId) return track;
            return {
              ...track,
              agentRequests: [...track.agentRequests, req],
              agentResponses: [...track.agentResponses, res],
              // 트랙당 Suno 프롬프트는 1개만 유지 — generate_suno_prompts는 기존 프롬프트를 교체
              prompts: generatedPrompt ? [generatedPrompt] : track.prompts,
              updatedAt: t,
            };
          });
          return { ...data, tracks };
        });
        return { content: [{ type: "text", text: JSON.stringify({ requestId, responseId, parseStatus, errorMessage }, null, 2) }] };
      }

      case "get_track_prompts": {
        const data = loadData();
        const track = data.tracks.find((t) => t.id === a.trackId);
        if (!track) return { content: [{ type: "text", text: `Track ${a.trackId} not found` }], isError: true };
        return { content: [{ type: "text", text: JSON.stringify(track.prompts, null, 2) }] };
      }

      case "save_suno_result": {
        const result = {
          id: randomId(),
          url: String(a.url),
          promptId: a.promptId ? String(a.promptId) : "",
          versionLabel: now().slice(0, 10),
          rating: Math.min(5, Math.max(1, Number(a.rating))) as 1 | 2 | 3 | 4 | 5,
          memo: a.memo ? String(a.memo) : "",
          isBestVersion: Boolean(a.isBestVersion),
          createdAt: now(),
        };
        withCAS((data) => ({
          ...data,
          tracks: data.tracks.map((t) =>
            t.id === a.trackId
              ? { ...t, sunoResults: [...t.sunoResults, result], updatedAt: now() }
              : t
          ),
        }));
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      case "get_agent_history": {
        const data = loadData();
        const track = data.tracks.find((t) => t.id === a.trackId);
        if (!track) return { content: [{ type: "text", text: `Track ${a.trackId} not found` }], isError: true };
        const history = track.agentRequests.map((req) => ({
          request: req,
          response: track.agentResponses.find((r) => (r as { requestId: string }).requestId === (req as { id: string }).id),
        }));
        return { content: [{ type: "text", text: JSON.stringify(history, null, 2) }] };
      }

      case "save_reference_brief": {
        const t = now();
        if (!loadData().tracks.find((tr) => tr.id === a.trackId)) {
          return { content: [{ type: "text", text: `Track ${a.trackId} not found` }], isError: true };
        }
        const brief = {
          id: randomId(),
          trackId: String(a.trackId),
          artist: String(a.artist),
          songTitle: String(a.songTitle),
          userFocus: Array.isArray(a.userFocus) ? a.userFocus : [],
          userNotes: a.userNotes ? String(a.userNotes) : undefined,
          summary: String(a.summary),
          genreTags: Array.isArray(a.genreTags) ? a.genreTags : [],
          moodTags: Array.isArray(a.moodTags) ? a.moodTags : [],
          productionTraits: Array.isArray(a.productionTraits) ? a.productionTraits : [],
          rhythmTraits: Array.isArray(a.rhythmTraits) ? a.rhythmTraits : [],
          harmonyTraits: Array.isArray(a.harmonyTraits) ? a.harmonyTraits : [],
          bassTraits: Array.isArray(a.bassTraits) ? a.bassTraits : [],
          toplineTraits: Array.isArray(a.toplineTraits) ? a.toplineTraits : [],
          vocalTraits: Array.isArray(a.vocalTraits) ? a.vocalTraits : [],
          soundTextureTraits: Array.isArray(a.soundTextureTraits) ? a.soundTextureTraits : [],
          arrangementTraits: Array.isArray(a.arrangementTraits) ? a.arrangementTraits : [],
          sourceMode: "ai_knowledge" as const,
          sourceNotes: Array.isArray(a.sourceNotes) ? a.sourceNotes : [],
          disclaimer: a.disclaimer ? String(a.disclaimer) : "이 분석은 AI 추론 기반입니다.",
          confidence: (["low", "medium", "high"].includes(String(a.confidence)) ? a.confidence : "medium") as "low" | "medium" | "high",
          createdAt: t,
          updatedAt: t,
        };
        withCAS((data) => ({
          ...data,
          tracks: data.tracks.map((track) =>
            track.id === a.trackId
              ? { ...track, referenceBriefs: [...(track.referenceBriefs ?? []), brief], updatedAt: t }
              : track
          ),
        }));
        return { content: [{ type: "text", text: JSON.stringify(brief, null, 2) }] };
      }

      case "get_reference_briefs": {
        const data = loadData();
        const track = data.tracks.find((t) => t.id === a.trackId);
        if (!track) return { content: [{ type: "text", text: `Track ${a.trackId} not found` }], isError: true };
        return { content: [{ type: "text", text: JSON.stringify(track.referenceBriefs ?? [], null, 2) }] };
      }

      case "save_chord_progressions": {
        const t = now();
        if (!loadData().tracks.find((tr) => tr.id === a.trackId)) {
          return { content: [{ type: "text", text: `Track ${a.trackId} not found` }], isError: true };
        }
        const input = Array.isArray(a.progressions) ? (a.progressions as Record<string, unknown>[]) : [];
        const created = input.map((p) => ({
          id: randomId(),
          name: String(p.name),
          chords: Array.isArray(p.chords) ? p.chords.map(String) : [],
          key: String(p.key),
          mode: (["major", "minor"].includes(String(p.mode)) ? p.mode : "minor") as "major" | "minor",
          ...(p.bpm !== undefined ? { bpm: Number(p.bpm) } : {}),
          isDefault: false,
        }));
        withCAS((data) => ({
          ...data,
          tracks: data.tracks.map((track) =>
            track.id === a.trackId
              ? { ...track, chordProgressions: [...track.chordProgressions, ...created], updatedAt: t }
              : track
          ),
        }));
        return { content: [{ type: "text", text: JSON.stringify(created, null, 2) }] };
      }

      case "save_suno_settings": {
        const t = now();
        if (!loadData().tracks.find((tr) => tr.id === a.trackId)) {
          return { content: [{ type: "text", text: `Track ${a.trackId} not found` }], isError: true };
        }
        const settings = {
          weirdness: Number(a.weirdness),
          styleInfluence: Number(a.styleInfluence),
          audioInfluence: a.audioInfluence !== undefined ? Number(a.audioInfluence) : null,
          expectedStyle: String(a.expectedStyle),
        };
        withCAS((data) => ({
          ...data,
          tracks: data.tracks.map((track) =>
            track.id === a.trackId ? { ...track, sunoSettings: settings, updatedAt: t } : track
          ),
        }));
        return { content: [{ type: "text", text: JSON.stringify(settings, null, 2) }] };
      }

      case "save_track_plan": {
        const t = now();
        if (!loadData().tracks.find((tr) => tr.id === a.trackId)) {
          return { content: [{ type: "text", text: `Track ${a.trackId} not found` }], isError: true };
        }
        const rawSoundKw = (a.soundKeywords ?? {}) as Record<string, unknown>;
        const toStrArr = (v: unknown): string[] =>
          Array.isArray(v) ? v.map(String) : [];
        const plan = {
          id: randomId(),
          trackId: String(a.trackId),
          referenceBriefId: a.referenceBriefId ? String(a.referenceBriefId) : undefined,
          title: String(a.title),
          directionSummary: String(a.directionSummary),
          bpmSuggestions: Array.isArray(a.bpmSuggestions)
            ? a.bpmSuggestions.map(Number).filter(Number.isFinite)
            : [],
          keySuggestions: Array.isArray(a.keySuggestions) ? a.keySuggestions.map(String) : [],
          chordProgressionSuggestions: Array.isArray(a.chordProgressionSuggestions) ? a.chordProgressionSuggestions : [],
          grooveSuggestions: Array.isArray(a.grooveSuggestions) ? a.grooveSuggestions : [],
          bassDirection: a.bassDirection ?? { summary: "", rootMotionIdeas: [], rhythmIdeas: [], beginnerTips: [] },
          toplineDirection: a.toplineDirection ?? { summary: "", hookIdeas: [], rhythmIdeas: [], vocalToneIdeas: [], sunoTips: [] },
          soundKeywords: {
            drums: toStrArr(rawSoundKw.drums),
            bass: toStrArr(rawSoundKw.bass),
            melody: toStrArr(rawSoundKw.melody),
            harmony: toStrArr(rawSoundKw.harmony),
            fx: toStrArr(rawSoundKw.fx),
            vocal: toStrArr(rawSoundKw.vocal),
          },
          arrangementNotes: a.arrangementNotes ?? {},
          beginnerExplanation: a.beginnerExplanation ? String(a.beginnerExplanation) : "",
          disclaimer: a.disclaimer ? String(a.disclaimer) : "이 플랜은 AI 추론 기반입니다.",
          confidence: (["low", "medium", "high"].includes(String(a.confidence)) ? a.confidence : "medium") as "low" | "medium" | "high",
          createdAt: t,
          updatedAt: t,
        };
        withCAS((data) => ({
          ...data,
          tracks: data.tracks.map((track) =>
            track.id === a.trackId
              ? { ...track, trackPlans: [...(track.trackPlans ?? []), plan], updatedAt: t }
              : track
          ),
        }));
        return { content: [{ type: "text", text: JSON.stringify(plan, null, 2) }] };
      }

      case "get_track_plans": {
        const data = loadData();
        const track = data.tracks.find((t) => t.id === a.trackId);
        if (!track) return { content: [{ type: "text", text: `Track ${a.trackId} not found` }], isError: true };
        return { content: [{ type: "text", text: JSON.stringify(track.trackPlans ?? [], null, 2) }] };
      }

      case "save_learning_missions": {
        const t = now();
        if (!loadData().tracks.find((tr) => tr.id === a.trackId)) {
          return { content: [{ type: "text", text: `Track ${a.trackId} not found` }], isError: true };
        }
        const VALID_CATS = ["harmony", "drums", "bass", "topline", "sound_design", "arrangement", "suno_prompt"];
        const rawMissions = Array.isArray(a.missions) ? a.missions as Record<string, unknown>[] : [];
        const missions = rawMissions.map((m) => ({
          id: randomId(),
          trackId: String(a.trackId),
          trackPlanId: a.trackPlanId ? String(a.trackPlanId) : undefined,
          referenceBriefId: a.referenceBriefId ? String(a.referenceBriefId) : undefined,
          category: VALID_CATS.includes(String(m.category)) ? String(m.category) : "harmony",
          title: String(m.title ?? ""),
          objective: String(m.objective ?? ""),
          explanation: String(m.explanation ?? ""),
          task: String(m.task ?? ""),
          beginnerHint: String(m.beginnerHint ?? ""),
          expectedOutput: m.expectedOutput ? String(m.expectedOutput) : undefined,
          completed: false,
          createdAt: t,
          updatedAt: t,
        }));
        withCAS((data) => ({
          ...data,
          tracks: data.tracks.map((track) =>
            track.id === a.trackId
              ? {
                  ...track,
                  learningMissions: [...(track.learningMissions ?? []), ...missions],
                  updatedAt: t,
                }
              : track
          ),
        }));
        return { content: [{ type: "text", text: JSON.stringify(missions, null, 2) }] };
      }

      case "get_learning_missions": {
        const data = loadData();
        const track = data.tracks.find((t) => t.id === a.trackId);
        if (!track) return { content: [{ type: "text", text: `Track ${a.trackId} not found` }], isError: true };
        return { content: [{ type: "text", text: JSON.stringify(track.learningMissions ?? [], null, 2) }] };
      }

      case "update_learning_mission": {
        const t = now();
        if (!loadData().tracks.find((tr) => tr.id === a.trackId)) {
          return { content: [{ type: "text", text: `Track ${a.trackId} not found` }], isError: true };
        }
        withCAS((data) => ({
          ...data,
          tracks: data.tracks.map((track) => {
            if (track.id !== a.trackId) return track;
            return {
              ...track,
              learningMissions: (track.learningMissions ?? []).map((m) => {
                const mission = m as Record<string, unknown>;
                if (mission.id !== a.missionId) return m;
                return {
                  ...mission,
                  ...(a.completed !== undefined ? { completed: Boolean(a.completed), completedAt: Boolean(a.completed) ? t : undefined } : {}),
                  ...(a.userMemo !== undefined ? { userMemo: String(a.userMemo) } : {}),
                  ...(a.aiFeedback !== undefined ? { aiFeedback: String(a.aiFeedback) } : {}),
                  updatedAt: t,
                };
              }),
              updatedAt: t,
            };
          }),
        }));
        return { content: [{ type: "text", text: JSON.stringify({ success: true, missionId: a.missionId }, null, 2) }] };
      }

      default:
        return { content: [{ type: "text", text: `Unknown tool: ${name}` }], isError: true };
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { content: [{ type: "text", text: `Error: ${msg}` }], isError: true };
  }
});

// ─── Start ───────────────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write("SongFlow MCP server running on stdio\n");
}

main().catch((err) => {
  process.stderr.write(`Fatal error: ${err}\n`);
  process.exit(1);
});
