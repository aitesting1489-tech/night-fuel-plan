import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useHydrationLogger() {
  const { user } = useAuth();

  const logHydration = useCallback(async (amountMl: number) => {
    if (!user) return;
    await supabase.from("hydration_logs").insert({
      user_id: user.id,
      amount_ml: amountMl,
      logged_at: new Date().toISOString(),
    });
  }, [user]);

  const unlogHydration = useCallback(async (amountMl: number) => {
    if (!user) return;
    // Delete the most recent log with this amount
    const { data } = await supabase
      .from("hydration_logs")
      .select("id")
      .eq("user_id", user.id)
      .eq("amount_ml", amountMl)
      .order("logged_at", { ascending: false })
      .limit(1)
      .single();
    if (data) {
      await supabase.from("hydration_logs").delete().eq("id", data.id);
    }
  }, [user]);

  return { logHydration, unlogHydration };
}
