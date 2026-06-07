# SongFlow Local Project Specification

## 1. Core Purpose

SongFlow Local is a Tauri-based local desktop workspace for AI-assisted music production.

The app helps users connect their own AI agents, such as ChatGPT/Codex, Claude Code, Gemini CLI, or Ollama, to a repeatable music creation workflow:

1. Create a song project.
2. Add reference song notes.
3. Generate safe musical analysis through an agent.
4. Preview chord and groove ideas.
5. Generate Suno-ready prompts.
6. Record Suno results.
7. Add feedback.
8. Generate refined prompts.
9. Repeat until a preferred version is selected.

SongFlow Local does not provide its own AI model or music generation engine. It is a local workflow tool that stores project data and coordinates agent prompts, responses, music preview choices, Suno result logs, and refinements.

## 2. Product Direction

### Do

- Build a Tauri desktop app.
- Use React, TypeScript, Vite, Tailwind CSS, Zustand, Tone.js, and localStorage.
- Store all MVP data locally.
- Support agent-based workflows.
- Implement Manual Agent Mode first.
- Keep an extensible provider structure for Codex CLI, Claude Code CLI, Gemini CLI, Ollama, and API providers.
- Store agent requests and responses, including raw text and parsed JSON.
- Preserve raw text when JSON parsing fails.
- Make every generated agent prompt visible and copyable by the user.
- Convert reference artist/song mentions into neutral musical descriptions before using them in Suno prompts.

### Do Not

- Do not build a SaaS backend.
- Do not add login, signup, billing, or server storage.
- Do not provide an in-app LLM or music generation model.
- Do not integrate Suno, Splice, Spotify, or Ableton APIs in the MVP.
- Do not scrape, automate, or reuse web login sessions.
- Do not access browser cookies.
- Do not implement automatic CLI agent execution in the first MVP.

## 3. First MVP Scope

The first MVP should implement the local workflow loop with Manual Agent Mode.

### MVP Features

1. Project Dashboard
   - Create projects.
   - List projects.
   - Show status and recent update time.
   - Delete projects.
   - Open project detail.

2. Agent Settings
   - Select default provider.
   - Default to Manual.
   - Show placeholder status for future CLI/Ollama providers.

3. Manual Agent Mode
   - Generate task-specific agent prompts.
   - Copy prompts.
   - Paste agent responses.
   - Parse JSON.
   - Save `rawText`, `parsedJson`, parse status, and error message.
   - Preserve `rawText` on parsing failure.

4. Reference Song Analyzer
   - Save reference song notes.
   - Generate `analyze_reference_song` prompts.
   - Save reference analysis responses.
   - Keep artist/song names out of generated Suno prompts.

5. Song Brief Generator
   - Create a project-level song brief.
   - Generate `generate_song_brief` prompts.
   - Save generated brief data.

6. Chord & Groove Preview
   - Use Tone.js.
   - Provide at least 3 default chord progressions.
   - Provide at least 3 default groove patterns.
   - Support Chord Only, Chord + Bass, Full Groove, Stop.
   - Support BPM changes.
   - Save selected chord and groove choices.

7. Prompt Lab
   - Generate `generate_suno_prompts` agent prompts.
   - Save generated prompt variants:
     - Basic
     - More Refreshing
     - More Emotional
     - Vocal Focused
     - Groove Focused

8. Sound Search Guide
   - Generate sample search keyword groups.
   - Support drums, bass, melody, harmony, fx, and vocal keyword groups.

9. Suno Result Log
   - Save Suno result URL.
   - Link result to a generated prompt.
   - Save version label, rating, memo, and best-version flag.

10. Prompt Refinement Lab
    - Save liked and weak parts.
    - Generate `refine_suno_prompt` prompts.
    - Save revised prompt recommendations.

11. Agent History
    - List requests and responses.
    - Show parse success or failure.
    - Allow raw response text to be corrected and parsed again.

12. Notes
    - Save local project notes.

## 4. Not In First MVP

- Automatic Codex CLI execution.
- Automatic Claude Code CLI execution.
- Automatic Gemini CLI execution.
- Automatic Ollama execution.
- API key management.
- Tauri Store or SQLite migration.
- Suno API integration.
- Sample platform API integration.
- Spotify or audio file analysis.
- MIDI export.
- Cloud sync.
- Collaboration.
- Authentication.

## 5. Recommended Development Order

1. Create this `PROJECT_SPEC.md` and confirm MVP scope.
2. Set up Tauri + React + TypeScript + Vite.
3. Configure Tailwind CSS and install Zustand.
4. Build the base AppShell and empty Dashboard.
5. Define core TypeScript types.
6. Implement localStorage storage utilities.
7. Implement Zustand project store.
8. Implement Dashboard project CRUD.
9. Implement Agent Request/Response and Manual Agent Mode.
10. Implement Reference Song Analyzer.
11. Implement Song Brief Generator.
12. Implement Chord & Groove Preview with Tone.js.
13. Implement Prompt Lab and Sound Search Guide.
14. Implement Suno Result Log and Prompt Refinement Lab.
15. Implement Agent History and Notes.
16. Run CLI/Ollama provider POCs after the Manual Agent Mode MVP is stable.

## 6. Core Types

### AgentProvider

```ts
type AgentProvider =
  | "manual"
  | "codex-cli"
  | "claude-code-cli"
  | "gemini-cli"
  | "ollama"
  | "openai-api"
  | "claude-api"
  | "gemini-api";
```

### ProjectStatus

```ts
type ProjectStatus =
  | "idea"
  | "reference"
  | "prompting"
  | "suno_testing"
  | "refining"
  | "selected"
  | "archived";
```

### AgentTask

```ts
type AgentTask =
  | "analyze_reference_song"
  | "generate_song_brief"
  | "generate_suno_prompts"
  | "generate_sound_keywords"
  | "refine_suno_prompt";
```

### AgentRequest

```ts
type AgentRequest = {
  id: string;
  provider: AgentProvider;
  task: AgentTask;
  input: unknown;
  outputSchema: string;
  instruction: string;
  createdAt: string;
};
```

### AgentResponse

```ts
type AgentResponse = {
  id: string;
  requestId: string;
  provider: AgentProvider;
  rawText: string;
  parsedJson?: unknown;
  parseStatus: "success" | "failed";
  errorMessage?: string;
  createdAt: string;
};
```

### SongProject

```ts
type SongProject = {
  id: string;
  title: string;
  description: string;
  genre: string;
  moods: string[];
  targetVibe: string;
  status: ProjectStatus;
  agentProvider: AgentProvider;
  brief?: SongBrief;
  references: ReferenceSong[];
  referenceAnalyses: ReferenceAnalysis[];
  chordProgressions: ChordProgression[];
  selectedChordProgressionId?: string;
  groovePatterns: GroovePattern[];
  selectedGroovePatternId?: string;
  soundKeywords?: SoundKeywordGroup;
  samplePlatformGuides?: SamplePlatformGuide[];
  prompts: GeneratedPrompt[];
  sunoResults: SunoResult[];
  feedbacks: ResultFeedback[];
  refinements: PromptRefinement[];
  agentRequests: AgentRequest[];
  agentResponses: AgentResponse[];
  notes: ProjectNote[];
  createdAt: string;
  updatedAt: string;
};
```

## 7. Agent Prompt Rules

Every agent task should include these rules:

```text
You are an AI music production assistant helping a beginner create Suno-ready demo prompts.

Important rules:
- Do not directly imitate or copy any specific artist or song.
- Use reference songs only to extract musical characteristics.
- Convert artist/song references into neutral musical descriptions.
- Do not mention artist names or song titles in Suno prompts.
- Return only valid JSON.
- Do not include markdown.
- Do not include explanations outside JSON.
```

## 8. Expected Folder Structure

```text
src/
  components/
    layout/
      AppShell.tsx
      Sidebar.tsx
    settings/
      AgentSettings.tsx
      ProviderStatusCard.tsx
    project/
      ProjectCard.tsx
      NewProjectForm.tsx
      ProjectTabs.tsx
    references/
      ReferenceSongForm.tsx
      ReferenceAnalyzer.tsx
      ReferenceAnalysisCard.tsx
    brief/
      SongBriefPanel.tsx
    groove/
      ChordGrooveLab.tsx
      ChordCard.tsx
      GroovePatternCard.tsx
      GroovePlayer.tsx
    prompts/
      PromptLab.tsx
      PromptCard.tsx
    sounds/
      SoundSearchGuide.tsx
      KeywordGroup.tsx
    suno/
      SunoResultLog.tsx
      SunoResultCard.tsx
    refinement/
      PromptRefinementLab.tsx
      FeedbackChecklist.tsx
      RefinementCard.tsx
    agents/
      AgentPromptPanel.tsx
      AgentResponsePasteBox.tsx
      AgentHistory.tsx
      ProviderSelector.tsx
    notes/
      ProjectNotes.tsx
  lib/
    agents/
      types.ts
      createAgentRequest.ts
      parseAgentResponse.ts
      manualAgentConnector.ts
      codexCliConnector.ts
      claudeCodeCliConnector.ts
      geminiCliConnector.ts
      ollamaConnector.ts
    agent-prompts/
      analyzeReferenceSongPrompt.ts
      generateSongBriefPrompt.ts
      generateSunoPromptsPrompt.ts
      generateSoundKeywordsPrompt.ts
      refineSunoPromptPrompt.ts
    data/
      chordProgressions.ts
      groovePatterns.ts
      chordNotes.ts
      samplePlatforms.ts
    music/
      chordUtils.ts
      groovePlayer.ts
    storage/
      localStorage.ts
    types/
      project.ts
      reference.ts
      music.ts
      prompt.ts
      suno.ts
      agent.ts
  store/
    useProjectStore.ts
  App.tsx
  main.tsx
```

## 9. MVP Completion Criteria

MVP is complete when:

- The Tauri app runs locally.
- A project can be created, listed, opened, updated, and deleted.
- Manual Agent Mode can generate prompts, copy them, accept pasted responses, parse JSON, and store request/response history.
- Reference analysis, song brief, Suno prompt generation, sound keyword generation, result logging, feedback, and refinement can be performed through Manual Agent Mode.
- Chord and groove preview works through Tone.js.
- All project data persists locally.
- CLI/Ollama automation remains separated as a later POC.

## 10. First POC After MVP

After Manual Agent Mode is stable, validate automatic providers in this order:

1. Codex CLI POC.
2. Claude Code CLI POC.
3. Gemini CLI POC.
4. Ollama Provider POC.

Each POC should confirm install requirements, invocation method, JSON-only response reliability, timeout behavior, and security/terms constraints before product implementation.
