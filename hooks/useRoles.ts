import { useEffect, useState } from "react";
import { getUserRoles } from "../lib/roleSync";
import {
  ROLE_ADMIN,
  ROLE_HOST_PRO,
  ROLE_HOST_STARTER,
  ROLE_VENUE_PRO,
  ROLE_VENUE_STARTER,
} from "../constants/roles";
import type { AppRole } from "../types/roles";

export type UseRolesResult = {
  roles: AppRole[];
  loading: boolean;
  hasRole: (role: AppRole) => boolean;
  isHost: boolean;
  isHostPro: boolean;
  isHostStarter: boolean;
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

  const isHostPro = roles.includes(ROLE_HOST_PRO);
  const isHostStarter = roles.includes(ROLE_HOST_STARTER);

  return {
    roles,
    loading,
    hasRole: (role: AppRole) => roles.includes(role),
    isHostPro,
    isHostStarter,
    isHost: isHostPro || isHostStarter,
    isVenue: roles.includes(ROLE_VENUE_STARTER) || roles.includes(ROLE_VENUE_PRO),
    isAdmin: roles.includes(ROLE_ADMIN),
  };
}
