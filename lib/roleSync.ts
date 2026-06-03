import { supabase } from "./supabase";
import type { AppRole } from "../types/roles";

export async function getUserRoles(): Promise<AppRole[]> {
  const userRes = await supabase.auth.getUser();
  const uid = userRes.data.user?.id ?? null;
  if (!uid) return [];

  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", uid);

  if (error) return [];
  return (data ?? []).map((row) => row.role as AppRole);
}

export function hasRole(roles: AppRole[], role: AppRole): boolean {
  return roles.includes(role);
}
