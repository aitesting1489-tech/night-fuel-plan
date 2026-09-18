import { Capacitor } from "@capacitor/core";
import { NativePurchases, PURCHASE_TYPE } from "@capgo/native-purchases";

/**
 * Direct Apple / Google in-app purchases — no third-party service.
 *
 * The product ID below MUST exactly match the subscription created in
 * App Store Connect (Subscriptions → "Circadia Pro").
 */
export const PRO_PRODUCT_ID = "com.circadia.app.pro.monthly";

export const isNativeApp = () => Capacitor.isNativeApp;

export type PurchaseResult =
  | { status: "success" }
  | { status: "cancelled" }
  | { status: "unavailable" }
  | { status: "error"; message: string };

/** Product info (title, real price string from Apple) for the Pro subscription. */
export async function getProProduct(): Promise<{
  title: string;
  priceString: string;
} | null> {
  if (!isNativeApp()) return null;
  try {
    const { products } = await NativePurchases.getProducts({
      productIdentifiers: [PRO_PRODUCT_ID],
      productType: PURCHASE_TYPE.SUBS,
    });
    const product = products[0];
    if (!product) return null;
    return { title: product.title, priceString: product.priceString };
  } catch (err) {
    console.warn("[IAP] Could not load product info", err);
    return null;
  }
}

/** True when the store reports an active Circadia Pro subscription. */
export async function hasNativeProEntitlement(_appUserId?: string): Promise<boolean> {
  if (!isNativeApp()) return false;
  try {
    const { purchases } = await NativePurchases.getPurchases({
      productType: PURCHASE_TYPE.SUBS,
      onlyCurrentEntitlements: true,
    });
    return purchases.some(
      (p) => p.productIdentifier === PRO_PRODUCT_ID && p.isActive !== false,
    );
  } catch (err) {
    console.error("[IAP] entitlement check failed", err);
    return false;
  }
}

/** Present Apple's purchase sheet for the Pro subscription. */
export async function purchasePro(_appUserId?: string): Promise<PurchaseResult> {
  if (!isNativeApp()) return { status: "unavailable" };
  try {
    const billing = await NativePurchases.isBillingSupported();
    if (!billing.isBillingSupported) return { status: "unavailable" };

    const transaction = await NativePurchases.purchaseProduct({
      productIdentifier: PRO_PRODUCT_ID,
      productType: PURCHASE_TYPE.SUBS,
    });
    return transaction.isActive === false
      ? { status: "error", message: "Purchase completed but Pro is not active yet." }
      : { status: "success" };
  } catch (err) {
    const e = err as { message?: string };
    if (e?.message?.toLowerCase().includes("cancel")) return { status: "cancelled" };
    console.error("[IAP] purchase failed", err);
    return { status: "error", message: e?.message ?? "Purchase failed" };
  }
}

/** Apple requires a visible "Restore Purchases" action. */
export async function restorePro(_appUserId?: string): Promise<boolean> {
  if (!isNativeApp()) return false;
  try {
    await NativePurchases.restorePurchases();
    return await hasNativeProEntitlement();
  } catch (err) {
    console.error("[IAP] restore failed", err);
    return false;
  }
}
