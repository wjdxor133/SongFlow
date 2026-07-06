import type { AgentRequest, AgentResponse } from "./agent";
import type { ChordProgression, GroovePattern, SoundKeywordGroup } from "./music";
import type { GeneratedPrompt, ResultFeedback, PromptRefinement } from "./prompt";
import type { ReferenceSong, ReferenceAnalysis } from "./reference";
import type { SunoResult } from "./suno";
import type { ReferenceBrief, TrackPlan, LearningMission } from "./reference-coach";

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

export type SourceTrack = {
  spotifyId: string;
  artist: string;
  album: string;
  title: string;
  year?: number;
};

export type SunoSettings = {
  weirdness: number; // 0-100 (%)
  styleInfluence: number; // 0-100 (%)
  audioInfluence: number | null; // 0-100 (%), null = off (no audio reference)
  excludeStyles?: string; // Suno "Exclude Styles" — comma-separated things to avoid (e.g. "ad-libs, male vocals")
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
  sourceTrack?: SourceTrack;
  sunoSettings?: SunoSettings;
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
  referenceBriefs?: ReferenceBrief[];
  trackPlans?: TrackPlan[];
  learningMissions?: LearningMission[];
  createdAt: string;
  updatedAt: string;
};

export type StorageData = {
  version: number;
  schemaVersion: number;
  albums: Album[];
  tracks: Track[];
};
