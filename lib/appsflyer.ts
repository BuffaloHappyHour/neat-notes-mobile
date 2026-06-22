import Constants from 'expo-constants';
import { Platform } from 'react-native';
import appsFlyer from 'react-native-appsflyer';

// AppsFlyer canonical event names
const AF_COMPLETE_REGISTRATION = 'af_complete_registration';
const AF_FIRST_TASTING = 'first_tasting_logged';
const AF_PURCHASE = 'af_purchase';

let initialized = false;

function getExtra(): Record<string, unknown> {
  return (Constants.expoConfig?.extra ?? {}) as Record<string, unknown>;
}

export async function initAppsFlyer(): Promise<void> {
  if (initialized) return;
  initialized = true;

  const extra = getExtra();
  const devKey = extra.appsflyerDevKey as string | null;
  const iosAppId = extra.appsflyerIosAppId as string | null;

  if (!devKey) {
    if (__DEV__) console.warn('[appsflyer] APPSFLYER_DEV_KEY not set — skipping init');
    return;
  }

  await appsFlyer.initSdk({
    devKey,
    // appId is iOS-only; passing the iOS App Store ID on Android causes 404 errors
    appId: Platform.OS === 'ios' ? (iosAppId ?? '') : undefined,
    isDebug: __DEV__,
  });
}

export function setCustomerUserId(userId: string): void {
  appsFlyer.setCustomerUserId(userId);
}

// Use Promise-based logEvent (no callbacks) — the callback variant has a
// WeakReference GC bug on Android where async callbacks are silently dropped.
export function logSignUpCompleted(): void {
  void appsFlyer.logEvent(AF_COMPLETE_REGISTRATION, {});
}

export function logFirstTastingLogged(): void {
  void appsFlyer.logEvent(AF_FIRST_TASTING, {});
}

export function logPremiumPurchased(packageId: string): void {
  void appsFlyer.logEvent(AF_PURCHASE, { af_content_id: packageId });
}
