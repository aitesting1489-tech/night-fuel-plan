import { Capacitor } from "@capacitor/core";

/**
 * RevenueCat public SDK keys (safe to ship in the app bundle).
 * Get them from RevenueCat → Project settings → API keys.
 *   iOS  key starts with "appl_"
 *   Android key starts with "goog_"
 */
export const REVENUECAT_IOS_KEY = "";
export const REVENUECAT_ANDROID_KEY = "";

/** Entitlement identifier configured in RevenueCat for Circadia Pro. */
export const PRO_ENTITLEMENT = "pro";

export const isNativeApp = () => Capacitor.isNativePlatform();

const platformKey = () =>
  Capacitor.getPlatform() === "android" ? REVENUECAT_ANDROID_KEY : REVENUECAT_IOS_KEY;

let configured = false;

type PurchasesModule = typeof import("@revenuecat/purchases-capacitor");

async function getPurchases(appUserId?: string) {
  if (!isNativeApp()) return null;
  const key = platformKey();
  if (!key) {
    console.warn("[IAP] RevenueCat API key is not set.");
    return null;
  }
  const mod: PurchasesModule = await import("@revenuecat/purchases-capacitor");
  const { Purchases, LOG_LEVEL } = mod;
  if (!configured) {
    await Purchases.setLogLevel({ level: LOG_LEVEL.WARN });
    await Purchases.configure({ apiKey: key, appUserID: appUserId ?? null });
    configured = true;
  } else if (appUserId) {
    try {
      await Purchases.logIn({ appUserID: appUserId });
    } catch (err) {
      console.warn("[IAP] logIn failed", err);
    }
  }
  return Purchases;
}

/** Link the store account to the signed-in Circadia user. */
export async function identifyIapUser(appUserId: string) {
  await getPurchases(appUserId);
}

/** True when the native store reports an active Pro entitlement. */
export async function hasNativeProEntitlement(appUserId?: string): Promise<boolean> {
  const Purchases = await getPurchases(appUserId);
  if (!Purchases) return false;
  try {
    const { customerInfo } = await Purchases.getCustomerInfo();
    return Boolean(customerInfo.entitlements.active[PRO_ENTITLEMENT]);
  } catch (err) {
    console.error("[IAP] getCustomerInfo failed", err);
    return false;
  }
}

export type PurchaseResult =
  | { status: "success" }
  | { status: "cancelled" }
  | { status: "unavailable" }
  | { status: "error"; message: string };

/** Present Apple's / Google's purchase sheet for the current Pro offering. */
export async function purchasePro(appUserId?: string): Promise<PurchaseResult> {
  const Purchases = await getPurchases(appUserId);
  if (!Purchases) return { status: "unavailable" };
  try {
    const offerings = await Purchases.getOfferings();
    const pkg =
      offerings.current?.availablePackages?.[0] ??
      Object.values(offerings.all ?? {})[0]?.availablePackages?.[0];
    if (!pkg) return { status: "unavailable" };

    const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });
    return customerInfo.entitlements.active[PRO_ENTITLEMENT]
      ? { status: "success" }
      : { status: "error", message: "Purchase completed but Pro is not active yet." };
  } catch (err) {
    const e = err as { code?: string; userCancelled?: boolean; message?: string };
    if (e?.userCancelled || e?.code === "1") return { status: "cancelled" };
    console.error("[IAP] purchase failed", err);
    return { status: "error", message: e?.message ?? "Purchase failed" };
  }
}

/** Apple requires a visible "Restore Purchases" action. */
export async function restorePro(appUserId?: string): Promise<boolean> {
  const Purchases = await getPurchases(appUserId);
  if (!Purchases) return false;
  try {
    const { customerInfo } = await Purchases.restorePurchases();
    return Boolean(customerInfo.entitlements.active[PRO_ENTITLEMENT]);
  } catch (err) {
    console.error("[IAP] restore failed", err);
    return false;
  }
}
