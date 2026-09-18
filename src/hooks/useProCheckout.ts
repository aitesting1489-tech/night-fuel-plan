import { useState, useCallback } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { trackEvent } from "@/lib/analytics";
import { isNativeApp, purchasePro, restorePro } from "@/lib/iap";

/**
 * Pro checkout:
 *  - iOS / Android → Apple / Google in-app purchase (required by App Store guideline 3.1.1)
 *  - Web → Stripe Checkout
 */
export const useProCheckout = () => {
  const { user, checkSubscription } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const native = isNativeApp();

  const subscribe = useCallback(async () => {
    if (!user) {
      toast.error("Please sign in to subscribe");
      return;
    }
    setProcessing(true);
    trackEvent("begin_checkout", {
      value: 9.99,
      currency: "USD",
      items: [{ item_name: "Circadia Pro" }],
    });
    try {
      if (native) {
        const result = await purchasePro(user.id);
        if (result.status === "success") {
          toast.success("Circadia Pro is active. Welcome aboard.");
          await checkSubscription();
        } else if (result.status === "cancelled") {
          // Silent — the user dismissed Apple's sheet.
        } else if (result.status === "unavailable") {
          toast.error("Subscriptions aren't available right now. Please try again later.");
        } else {
          toast.error(result.message);
        }
        return;
      }

      const { data, error } = await supabase.functions.invoke("create-checkout");
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
      else throw new Error("No checkout URL returned");
    } catch (err) {
      toast.error("Checkout failed. Please try again.");
      console.error(err);
    } finally {
      setProcessing(false);
    }
  }, [user, native, checkSubscription]);

  const restore = useCallback(async () => {
    setRestoring(true);
    try {
      const ok = await restorePro(user?.id);
      if (ok) {
        toast.success("Your Pro subscription has been restored.");
        await checkSubscription();
      } else {
        toast.info("No previous purchase found for this Apple ID.");
      }
    } finally {
      setRestoring(false);
    }
  }, [user, checkSubscription]);

  const manage = useCallback(async () => {
    if (native) {
      // Apple/Google manage subscriptions in their own settings.
      window.open("https://apps.apple.com/account/subscriptions", "_system");
      return;
    }
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch (err) {
      toast.error("Could not open subscription management.");
      console.error(err);
    }
  }, [native]);

  return { subscribe, restore, manage, processing, restoring, native };
};
