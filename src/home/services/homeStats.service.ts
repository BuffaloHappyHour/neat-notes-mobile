import { supabase } from "../../../lib/supabase";

export async function fetchHomeStats() {
  const { data } = await supabase.auth.getSession();
  const user = data.session?.user;

  if (!user) {
    return {
      isAuthed: false,
      firstName: null as string | null,
      tastingCount: null as number | null,
      avgRating: null as number | null,
    };
  }

  const userId = user.id;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("first_name")
    .eq("id", userId)
    .maybeSingle();

  const firstName =
    !profileError && profile?.first_name ? String(profile.first_name) : null;

  const { count, error: countError } = await supabase
    .from("tastings")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  const tastingCount =
    countError ? null : typeof count === "number" ? count : 0;

  const { data: ratings, error: ratingsError } = await supabase
    .from("tastings")
    .select("rating")
    .eq("user_id", userId)
    .not("rating", "is", null);

  let avgRating: number | null = null;

  if (!ratingsError && ratings && ratings.length > 0) {
    const numericRatings = ratings
      .map((row) => Number(row.rating))
      .filter((value) => Number.isFinite(value));

    if (numericRatings.length > 0) {
      const total = numericRatings.reduce((sum, value) => sum + value, 0);
      avgRating = Number((total / numericRatings.length).toFixed(1));
    }
  }

  return {
    isAuthed: true,
    firstName,
    tastingCount,
    avgRating,
  };
}