import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface NotificationPreferences {
  notify_hydration: boolean;
  notify_meals: boolean;
  notify_phases: boolean;
  notify_tips: boolean;
}

export interface WaterSettings extends NotificationPreferences {
  daily_goal_ml: number;
  reminder_interval_minutes: number;
  cup_size_ml: number;
  body_weight_kg: number | null;
  use_weight_calculation: boolean;
}

const DEFAULTS: WaterSettings = {
  daily_goal_ml: 2500,
  reminder_interval_minutes: 45,
  cup_size_ml: 300,
  body_weight_kg: null,
  use_weight_calculation: false,
  notify_hydration: true,
  notify_meals: true,
  notify_phases: true,
  notify_tips: true,
};

// Recommended: ~35ml per kg body weight
export function calculateGoalFromWeight(weightKg: number): number {
  return Math.round(weightKg * 35);
}

export function useWaterSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<WaterSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  const effectiveGoal = settings.use_weight_calculation && settings.body_weight_kg
    ? calculateGoalFromWeight(settings.body_weight_kg)
    : settings.daily_goal_ml;

  useEffect(() => {
    if (!user) {
      setSettings(DEFAULTS);
      setLoading(false);
      return;
    }
    loadSettings();
  }, [user]);

  const loadSettings = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("water_intake_settings")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (data) {
      setSettings({
        daily_goal_ml: data.daily_goal_ml,
        reminder_interval_minutes: data.reminder_interval_minutes,
        cup_size_ml: data.cup_size_ml,
        body_weight_kg: data.body_weight_kg,
        use_weight_calculation: data.use_weight_calculation,
        notify_hydration: data.notify_hydration,
        notify_meals: data.notify_meals,
        notify_phases: data.notify_phases,
        notify_tips: data.notify_tips,
      });
    }
    setLoading(false);
  };

  const saveSettings = useCallback(async (newSettings: WaterSettings) => {
    if (!user) return;
    setSettings(newSettings);

    const payload = {
      user_id: user.id,
      ...newSettings,
    };

    const { error } = await supabase
      .from("water_intake_settings")
      .upsert(payload, { onConflict: "user_id" });

    return error;
  }, [user]);

  return { settings, effectiveGoal, loading, saveSettings, setSettings };
}
