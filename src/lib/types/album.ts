import type { AgentRequest, AgentResponse } from "./agent";
import type { ChordProgression, GroovePattern, SoundKeywordGroup } from "./music";
import type { GeneratedPrompt, ResultFeedback, PromptRefinement } from "./prompt";
import type { ReferenceSong, ReferenceAnalysis } from "./reference";
import type { SunoResult } from "./suno";

export type Album = {
  id: string;
  title: string;
  genre: string;
  concept: string;
  createdAt: string;
  updatedAt: string;
};

export type TrackNote = {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export type Track = {
  id: string;
  albumId: string;
  title: string;
  genre?: string;
  bpm?: number;
  key?: string;
  concept?: string;
  lyrics?: string;
  references: ReferenceSong[];
  referenceAnalyses: ReferenceAnalysis[];
  chordProgressions: ChordProgression[];
  selectedChordProgressionId?: string;
  groovePatterns: GroovePattern[];
  selectedGroovePatternId?: string;
  soundKeywords?: SoundKeywordGroup;
  prompts: GeneratedPrompt[];
  sunoResults: SunoResult[];
  feedbacks: ResultFeedback[];
  refinements: PromptRefinement[];
  agentRequests: AgentRequest[];
  agentResponses: AgentResponse[];
  notes: TrackNote[];
  createdAt: string;
  updatedAt: string;
};

export type StorageData = {
  version: number;
  albums: Album[];
  tracks: Track[];
};
