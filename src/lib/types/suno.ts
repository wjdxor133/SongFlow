export type SunoResult = {
  id: string;
  url: string;
  promptId: string;
  versionLabel: string;
  rating: 1 | 2 | 3 | 4 | 5;
  memo: string;
  isBestVersion: boolean;
  createdAt: string;
};
