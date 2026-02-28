export type RecentRow = {
  id: string;
  whiskey_name: string | null;
  rating: number | null;
  created_at: string | null;
  whiskey_id?: string | null;
};

export type TopRow = {
  id: string;
  whiskey_name: string | null;
  rating: number | null;
  whiskey_id?: string | null;
};

export type MixRow = {
  label: string;
  count: number;
  pct: number;
  alpha: number;
};
