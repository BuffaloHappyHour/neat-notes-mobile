export type Suggestion = {
  whiskeyId: string; // whiskeys.id (UUID)
  whiskeyName: string;
  bhhScore: number | null;
};

export type RecentTastingRow = {
  id: string; // tasting id
  whiskeyId: string | null;
  whiskeyName: string;
  rating: number | null;
  createdAt: string | null;
};