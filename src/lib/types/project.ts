import type { AgentProvider, AgentRequest, AgentResponse } from "./agent";
import type { ChordProgression, GroovePattern, SoundKeywordGroup, SamplePlatformGuide } from "./music";
import type { GeneratedPrompt, PromptRefinement, ResultFeedback, SongBrief } from "./prompt";
import type { ReferenceAnalysis, ReferenceSong } from "./reference";
import type { SunoResult } from "./suno";

export type ProjectStatus =
  | "idea"
  | "reference"
  | "prompting"
  | "suno_testing"
  | "refining"
  | "selected"
  | "archived";

export type ProjectNote = {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export type SongProject = {
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
