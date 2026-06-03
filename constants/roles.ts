import type { AppRole } from "../types/roles";

export const ROLE_ADMIN = "admin" as const;
export const ROLE_HOST_STARTER = "host_starter" as const;
export const ROLE_HOST_PRO = "host_pro" as const;
export const ROLE_VENUE_STARTER = "venue_starter" as const;
export const ROLE_VENUE_PRO = "venue_pro" as const;
export const ROLE_RETAIL_PARTNER = "retail_partner" as const;
export const ROLE_BRAND_PILOT = "brand_pilot" as const;
export const ROLE_ENTERPRISE = "enterprise" as const;

export const ALL_ROLES: AppRole[] = [
  ROLE_ADMIN,
  ROLE_HOST_STARTER,
  ROLE_HOST_PRO,
  ROLE_VENUE_STARTER,
  ROLE_VENUE_PRO,
  ROLE_RETAIL_PARTNER,
  ROLE_BRAND_PILOT,
  ROLE_ENTERPRISE,
];
