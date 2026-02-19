import { supabase } from "./supabase";

export type MyProfile = {
  display_name: string | null;
  first_name: string | null; // “Private name” (journal vibe)
};

async function requireSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error(error.message);

  const session = data.session;
  if (!session) throw new Error("Not signed in");

  return session;
}

export async function upsertMyProfile(input: {
  display_name?: string;
  first_name?: string;
}) {
  const session = await requireSession();

  const payload: any = { id: session.user.id };

  if (typeof input.display_name === "string") {
    const v = input.display_name.trim();
    payload.display_name = v.length ? v : null;
  }

  if (typeof input.first_name === "string") {
    const v = input.first_name.trim();
    payload.first_name = v.length ? v : null;
  }

  // If they passed nothing meaningful, don’t write.
  if (Object.keys(payload).length === 1) return;

  const { error } = await supabase.from("profiles").upsert(payload);
  if (error) throw new Error(error.message);
}

export async function fetchMyProfile(): Promise<MyProfile | null> {
  const session = await requireSession();

  const { data, error } = await supabase
    .from("profiles")
    .select("display_name, first_name")
    .eq("id", session.user.id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as MyProfile) ?? null;
}
