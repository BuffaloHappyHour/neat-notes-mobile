import Purchases, { type PurchasesPackage } from "react-native-purchases";

const PREMIUM_ENTITLEMENT_ID = "premium";

export async function getCurrentOffering() {
  const offerings = await Purchases.getOfferings();

  console.log(
    "RC offerings.current identifier:",
    offerings.current?.identifier ?? null,
  );
  console.log(
    "RC availablePackages:",
    offerings.current?.availablePackages?.map((pkg) => ({
      packageIdentifier: pkg.identifier,
      productIdentifier: pkg.product.identifier,
      title: pkg.product.title,
      priceString: pkg.product.priceString,
    })) ?? [],
  );

  return offerings.current ?? null;
}

export async function purchasePackage(pkg: PurchasesPackage) {
  const result = await Purchases.purchasePackage(pkg);
  return result.customerInfo;
}

export async function restoreMyPurchases() {
  const customerInfo = await Purchases.restorePurchases();

  return Boolean(
    customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID],
  );
}