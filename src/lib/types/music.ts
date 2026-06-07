export type ChordProgression = {
  id: string;
  name: string;
  chords: string[];
  key: string;
  mode: "major" | "minor";
  bpm?: number;
  isDefault: boolean;
};

export type GroovePattern = {
  id: string;
  name: string;
  pattern: unknown;
  bpm?: number;
  isDefault: boolean;
};

export type SoundKeywordGroup = {
  drums: string[];
  bass: string[];
  melody: string[];
  harmony: string[];
  fx: string[];
  vocal: string[];
};

export type SamplePlatformGuide = {
  platform: string;
  keywords: string[];
};
