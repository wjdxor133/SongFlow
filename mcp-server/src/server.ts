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
        withCAS((data) => {
          const req = { id: requestId, provider: "manual" as const, task: String(a.task), input: {}, outputSchema: "", instruction: "", createdAt: t };
          const res = { id: responseId, requestId, provider: "manual" as const, rawText, parsedJson, parseStatus, errorMessage, createdAt: t };
          const tracks = data.tracks.map((track) => {
            if (track.id !== a.trackId) return track;
            return {
              ...track,
              agentRequests: [...track.agentRequests, req],
              agentResponses: [...track.agentResponses, res],
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
