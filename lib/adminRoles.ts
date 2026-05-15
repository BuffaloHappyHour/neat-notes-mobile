import { supabase } from "./supabase";
import type { AppRole } from "../types/roles";

export type AdminUserRoleSummary = {
  user_id: string;
  email: string;
  roles: AppRole[];
};

export async function adminLookupUserByEmail(
  email: string
): Promise<{ user_id: string; email: string } | null> {
  const { data, error } = await supabase.rpc("admin_lookup_user_by_email", {
    p_email: email.trim().toLowerCase(),
  });
  if (error || !data) return null;
  return data as { user_id: string; email: string };
}

export async function adminGetUserRoles(userId: string): Promise<AppRole[]> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (error) return [];
  return (data ?? []).map((row) => row.role as AppRole);
}

export async function adminGrantRole(userId: string, role: AppRole): Promise<void> {
  const { error } = await supabase.rpc("admin_grant_role", {
    p_user_id: userId,
    p_role: role,
  });
  if (error) throw error;
}

export async function adminRevokeRole(userId: string, role: AppRole): Promise<void> {
  const { error } = await supabase.rpc("admin_revoke_role", {
    p_user_id: userId,
    p_role: role,
  });
  if (error) throw error;
}
