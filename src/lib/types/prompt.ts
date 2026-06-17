export type SongBrief = {
  id: string;
  requestId: string;
  parsedJson?: unknown;
  createdAt: string;
};

export type GeneratedPromptType =
  | "full_song"
  | "topline"
  | "chorus_hook"
  | "verse_melody"
  | "remix_direction"
  | "sound_design";

export type GeneratedPrompt = {
  id: string;
  requestId: string;
  style: string;
  lyrics: string;
  moreRefreshing: string;
  moreEmotional: string;
  vocalFocused: string;
  grooveFocused: string;
  createdAt: string;
  type?: GeneratedPromptType;
  sourceTrackPlanId?: string;
  sourceReferenceBriefId?: string;
  versionLabel?: "safe" | "balanced" | "experimental";
};

export type ResultFeedback = {
  id: string;
  sunoResultId: string;
  likedParts: string[];
  weakParts: string[];
  createdAt: string;
};

export type PromptRefinement = {
  id: string;
  feedbackId: string;
  requestId: string;
  parsedJson?: unknown;
  createdAt: string;
};
