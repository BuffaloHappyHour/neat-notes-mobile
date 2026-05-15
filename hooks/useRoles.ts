import { useEffect, useState } from "react";
import { getUserRoles } from "../lib/roleSync";
import type { AppRole } from "../types/roles";

export type UseRolesResult = {
  roles: AppRole[];
  loading: boolean;
  hasRole: (role: AppRole) => boolean;
  isHost: boolean;
  isVenue: boolean;
  isAdmin: boolean;
};

export function useRoles(): UseRolesResult {
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUserRoles().then((r) => {
      setRoles(r);
      setLoading(false);
    });
  }, []);

  return {
    roles,
    loading,
    hasRole: (role: AppRole) => roles.includes(role),
    isHost: roles.includes("host_starter") || roles.includes("host_pro"),
    isVenue: roles.includes("venue_starter") || roles.includes("venue_pro"),
    isAdmin: roles.includes("admin"),
  };
}
