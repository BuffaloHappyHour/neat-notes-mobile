import Purchases from "react-native-purchases";

import { upsertMyProfile } from "./cloudProfile";
import { supabase } from "./supabase";

const PREMIUM_ENTITLEMENT_ID = "premium";

async function getSupabaseUserId() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error(error.message);
  return data.session?.user?.id ?? null;
}

export async function syncPremiumStatusFromRevenueCat() {
 const configured = await Purchases.isConfigured();
if (!configured) {
  return false;
}

  const userId = await getSupabaseUserId();
  if (!userId) return false;

  await Purchases.logIn(userId);

  const customerInfo = await Purchases.getCustomerInfo();


  const entitlement = customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID];
  const hasPremium = !!entitlement;

  await upsertMyProfile({ is_premium: hasPremium });

  return hasPremium;
}