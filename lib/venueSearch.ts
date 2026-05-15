import { supabase } from "./supabase";

export type VenueResult = {
  id: string;
  display_name: string;
  venue_type: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  website: string | null;
  phone: string | null;
  description: string | null;
  logo_url: string | null;
};

export async function searchVenues(query: string): Promise<VenueResult[]> {
  const { data, error } = await supabase
    .from("venues")
    .select(
      "id, display_name, venue_type, address, city, state, country, website, phone, description, logo_url"
    )
    .ilike("display_name", `%${query}%`)
    .eq("is_active", true)
    .limit(8);

  if (error) throw new Error(error.message);
  return (data ?? []) as VenueResult[];
}
