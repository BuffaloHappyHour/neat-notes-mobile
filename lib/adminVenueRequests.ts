import { supabase } from "./supabase";

export type VenueRequestStatus = "pending" | "approved" | "rejected";

export type VenueRequest = {
  id: string;
  requester_user_id: string;
  venue_id: string | null;
  venue_name: string;
  contact_email: string;
  contact_phone: string | null;
  website: string | null;
  city: string | null;
  state: string | null;
  notes: string | null;
  status: VenueRequestStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
};

export async function adminListVenueRequests(
  status: VenueRequestStatus = "pending"
): Promise<VenueRequest[]> {
  const { data, error } = await supabase
    .from("venue_requests")
    .select("*")
    .eq("status", status)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as VenueRequest[];
}

export async function adminApproveVenueRequest(
  requestId: string,
  role: "venue_starter" | "venue_pro"
): Promise<void> {
  const { error } = await supabase.rpc("admin_approve_venue_request", {
    p_request_id: requestId,
    p_role: role,
  });
  if (error) throw new Error(error.message);
}

export async function adminRejectVenueRequest(requestId: string): Promise<void> {
  const { error } = await supabase.rpc("admin_reject_venue_request", {
    p_request_id: requestId,
  });
  if (error) throw new Error(error.message);
}
