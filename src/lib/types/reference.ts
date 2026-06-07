export type ReferenceSong = {
  id: string;
  title: string;
  artist: string;
  notes: string;
  createdAt: string;
};

export type ReferenceAnalysis = {
  id: string;
  referenceSongId: string;
  requestId: string;
  parsedJson?: unknown;
  createdAt: string;
};
