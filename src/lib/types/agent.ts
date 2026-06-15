export type AgentProvider =
  | "manual"
  | "codex-cli"
  | "claude-code-cli"
  | "gemini-cli"
  | "ollama"
  | "openai-api"
  | "claude-api"
  | "gemini-api";

export type AgentTask =
  | "analyze_reference_song"
  | "generate_song_brief"
  | "generate_suno_prompts"
  | "generate_sound_keywords"
  | "refine_suno_prompt"
  | "generate_reference_brief"
  | "generate_track_plan"
  | "generate_learning_missions";

export type AgentRequest = {
  id: string;
  provider: AgentProvider;
  task: AgentTask;
  input: unknown;
  outputSchema: string;
  instruction: string;
  createdAt: string;
};

export type AgentResponse = {
  id: string;
  requestId: string;
  provider: AgentProvider;
  task?: AgentTask;
  rawText: string;
  parsedJson?: unknown;
  parseStatus: "success" | "failed";
  errorMessage?: string;
  createdAt: string;
};
