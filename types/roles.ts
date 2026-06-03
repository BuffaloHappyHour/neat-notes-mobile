export type AppRole =
  | "admin"
  | "host_starter"
  | "host_pro"
  | "venue_starter"
  | "venue_pro"
  | "retail_partner"
  | "brand_pilot"
  | "enterprise";

export type VenueRole = Extract<AppRole, "venue_starter" | "venue_pro">;
