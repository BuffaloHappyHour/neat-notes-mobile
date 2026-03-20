import Purchases from "react-native-purchases";

import { upsertMyProfile } from "./cloudProfile";
import { supabase } from "./supabase";

const PREMIUM_ENTITLEMENT_ID = "premium";

async function hasSupabaseSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error(error.message);
  return !!data.session?.user;
}

export async function syncPremiumStatusFromRevenueCat() {
  const signedIn = await hasSupabaseSession();
  if (!signedIn) return false;

  const customerInfo = await Purchases.getCustomerInfo();
  const entitlement = customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID];
  const hasPremium = !!entitlement;

  await upsertMyProfile({ is_premium: hasPremium });

  return hasPremium;
}