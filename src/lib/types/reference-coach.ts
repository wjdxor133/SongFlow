export type ReferenceFocus =
  | "overall_mood"
  | "chord_feel"
  | "drum_groove"
  | "bass"
  | "topline"
  | "vocal_tone"
  | "sound_texture"
  | "arrangement";

export type ConfidenceLevel = "low" | "medium" | "high";

export type LearningCategory =
  | "harmony"
  | "drums"
  | "bass"
  | "topline"
  | "sound_design"
  | "arrangement"
  | "suno_prompt";

export type ReferenceBrief = {
  id: string;
  trackId: string;

  artist: string;
  songTitle: string;
  userFocus: ReferenceFocus[];
  userNotes?: string;

  summary: string;

  genreTags: string[];
  moodTags: string[];

  productionTraits: string[];
  rhythmTraits: string[];
  harmonyTraits: string[];
  bassTraits: string[];
  toplineTraits: string[];
  vocalTraits: string[];
  soundTextureTraits: string[];
  arrangementTraits: string[];

  sourceMode: "user_input" | "ai_knowledge" | "web_search_placeholder";
  sourceNotes: string[];

  disclaimer: string;
  confidence: ConfidenceLevel;

  createdAt: string;
  updatedAt: string;
};

export type TrackPlan = {
  id: string;
  trackId: string;
  referenceBriefId?: string;

  title: string;
  directionSummary: string;

  bpmSuggestions: number[];
  keySuggestions: string[];

  chordProgressionSuggestions: Array<{
    id: string;
    name: string;
    chords: string[];
    key: string;
    mode: "major" | "minor";
    bpm?: number;
    isDefault: boolean;
  }>;

  grooveSuggestions: Array<{
    id: string;
    name: string;
    pattern: unknown;
    bpm?: number;
    isDefault: boolean;
  }>;

  bassDirection: {
    summary: string;
    rootMotionIdeas: string[];
    rhythmIdeas: string[];
    beginnerTips: string[];
  };

  toplineDirection: {
    summary: string;
    hookIdeas: string[];
    rhythmIdeas: string[];
    vocalToneIdeas: string[];
    sunoTips: string[];
  };

  soundKeywords: {
    drums: string[];
    bass: string[];
    melody: string[];
    harmony: string[];
    fx: string[];
    vocal: string[];
  };

  arrangementNotes: {
    intro?: string;
    verse?: string;
    preChorus?: string;
    chorus?: string;
    bridge?: string;
    outro?: string;
  };

  beginnerExplanation: string;

  disclaimer: string;
  confidence: ConfidenceLevel;

  createdAt: string;
  updatedAt: string;
};

export type LearningMission = {
  id: string;
  trackId: string;
  trackPlanId?: string;
  referenceBriefId?: string;

  category: LearningCategory;
  title: string;

  objective: string;
  explanation: string;
  task: string;
  beginnerHint: string;

  expectedOutput?: string;

  completed: boolean;
  completedAt?: string;

  userMemo?: string;
  aiFeedback?: string;

  createdAt: string;
  updatedAt: string;
};
