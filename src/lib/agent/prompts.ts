import type { AgentRequest, AgentTask, Track, Album } from "../types";

type PromptResult = {
  instruction: string;
  outputSchema: string;
};

export function buildPrompt(task: AgentTask, track: Track, album: Album): PromptResult {
  const base = [
    `Track: ${track.title}`,
    `Album: ${album.title}`,
    `Genre: ${track.genre ?? album.genre}`,
    track.concept ? `Concept: ${track.concept}` : "",
    album.concept ? `Album Concept: ${album.concept}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  switch (task) {
    case "generate_song_brief":
      return {
        instruction: `You are a music producer assistant. Generate a Song Brief for the following project.\n\n${base}\n\nReturn ONLY valid JSON (no markdown, no explanation) matching the schema below:`,
        outputSchema: JSON.stringify(
          {
            summary: "string — 2-3 sentence overview of the song concept",
            genre_notes: "string — specific production notes for the genre",
            mood_notes: "string — how to achieve the target moods",
            vibe_notes: "string — detailed vibe and energy description",
            production_suggestions: ["string — production technique"],
            reference_search_hints: ["string — keywords for finding reference songs"],
          },
          null,
          2
        ),
      };

    case "analyze_reference_song":
      return {
        instruction: `You are a music analysis assistant. Analyze the reference song for the following project.\n\n${base}\n\nReturn ONLY valid JSON (no markdown, no explanation) matching the schema below:`,
        outputSchema: JSON.stringify(
          {
            song_title: "string",
            artist: "string",
            key: "string — musical key (e.g. C major)",
            bpm: "number",
            chord_progression: "string — e.g. I-IV-V-I",
            groove_pattern: "string — rhythm description",
            production_notes: "string — notable production techniques",
            applicable_elements: ["string — elements usable in our project"],
          },
          null,
          2
        ),
      };

    case "generate_suno_prompts":
      return {
        instruction: `You are a Suno AI prompt engineer. Generate 5 optimized Suno prompt variants for the following project.\n\n${base}\n\nReturn ONLY valid JSON (no markdown, no explanation) matching the schema below:`,
        outputSchema: JSON.stringify(
          {
            basic: "string — standard Suno prompt",
            more_refreshing: "string — lighter, more upbeat variant",
            more_emotional: "string — deeper emotional variant",
            vocal_focused: "string — emphasis on vocal style",
            groove_focused: "string — emphasis on rhythm and groove",
          },
          null,
          2
        ),
      };

    case "generate_sound_keywords":
      return {
        instruction: `You are a sound design assistant. Generate sound search keywords for the following project.\n\n${base}\n\nReturn ONLY valid JSON (no markdown, no explanation) matching the schema below:`,
        outputSchema: JSON.stringify(
          {
            drums: ["string — drum sound keywords"],
            bass: ["string — bass sound keywords"],
            melody: ["string — melodic element keywords"],
            harmony: ["string — harmonic/chord keywords"],
            fx: ["string — effects and atmosphere keywords"],
            vocal: ["string — vocal style keywords"],
          },
          null,
          2
        ),
      };

    case "refine_suno_prompt":
      return {
        instruction: `You are a Suno prompt refinement specialist. Refine the existing prompt based on feedback for the following project.\n\n${base}\n\nReturn ONLY valid JSON (no markdown, no explanation) matching the schema below:`,
        outputSchema: JSON.stringify(
          {
            refined_prompt: "string — the improved Suno prompt",
            changes_made: ["string — description of each change"],
            reasoning: "string — why these changes improve the result",
          },
          null,
          2
        ),
      };
  }
}

export function buildCopyablePrompt(task: AgentTask, track: Track, album: Album): string {
  const { instruction, outputSchema } = buildPrompt(task, track, album);
  return `${instruction}\n\n${outputSchema}`;
}

export function buildAgentRequestPayload(
  task: AgentTask,
  track: Track,
  album: Album
): Omit<AgentRequest, "id" | "createdAt"> {
  const { instruction, outputSchema } = buildPrompt(task, track, album);
  return {
    provider: "manual",
    task,
    input: { albumId: album.id, trackId: track.id, title: track.title },
    outputSchema,
    instruction,
  };
}
