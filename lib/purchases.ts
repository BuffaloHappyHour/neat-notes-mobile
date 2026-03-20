import Purchases from "react-native-purchases";

import { syncPremiumStatusFromRevenueCat } from "./premiumSync";

export async function getCurrentOffering() {
  const offerings = await Purchases.getOfferings();
  return offerings.current ?? null;
}

export async function purchaseCurrentPackage() {
  const current = await getCurrentOffering();

  if (!current || !current.availablePackages.length) {
    throw new Error("No subscription package is currently available.");
  }

  const pkg = current.availablePackages[0];
  await Purchases.purchasePackage(pkg);

  const hasPremium = await syncPremiumStatusFromRevenueCat();

  if (!hasPremium) {
    throw new Error("Purchase completed, but premium access was not confirmed.");
  }

  return true;
}

export async function restoreMyPurchases() {
  await Purchases.restorePurchases();

  const hasPremium = await syncPremiumStatusFromRevenueCat();
  return hasPremium;
}