export type SongBrief = {
  id: string;
  requestId: string;
  parsedJson?: unknown;
  createdAt: string;
};

export type GeneratedPrompt = {
  id: string;
  requestId: string;
  basic: string;
  moreRefreshing: string;
  moreEmotional: string;
  vocalFocused: string;
  grooveFocused: string;
  createdAt: string;
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
