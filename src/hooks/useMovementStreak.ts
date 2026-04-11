import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface UseMovementStreakReturn {
  streak: number;
  todayCompleted: string[];
  loading: boolean;
  logTip: (tipId: string) => Promise<void>;
  unlogTip: (tipId: string) => Promise<void>;
  hasTodayActivity: boolean;
}

export function useMovementStreak(): UseMovementStreakReturn {
  const { user } = useAuth();
  const [streak, setStreak] = useState(0);
  const [todayCompleted, setTodayCompleted] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split("T")[0];

  const fetchData = useCallback(async () => {
    if (!user) { setLoading(false); return; }

    // Fetch today's completions and all distinct dates for streak calc
    const [todayRes, datesRes] = await Promise.all([
      supabase
        .from("movement_logs")
        .select("tip_id")
        .eq("user_id", user.id)
        .eq("shift_date", today),
      supabase
        .from("movement_logs")
        .select("shift_date")
        .eq("user_id", user.id)
        .order("shift_date", { ascending: false }),
    ]);

    if (todayRes.data) {
      setTodayCompleted(todayRes.data.map((r) => r.tip_id));
    }

    if (datesRes.data) {
      // Calculate consecutive day streak ending today (or yesterday)
      const uniqueDates = [...new Set(datesRes.data.map((r) => r.shift_date))].sort().reverse();
      const streakCount = calcStreak(uniqueDates);
      setStreak(streakCount);
    }

    setLoading(false);
  }, [user, today]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const logTip = useCallback(async (tipId: string) => {
    if (!user) return;
    const { error } = await supabase
      .from("movement_logs")
      .insert({ user_id: user.id, tip_id: tipId, shift_date: today });
    if (!error) {
      setTodayCompleted((prev) => [...prev, tipId]);
      // If this is the first tip today, increment streak
      if (todayCompleted.length === 0) {
        setStreak((s) => s + 1);
      }
    }
  }, [user, today, todayCompleted.length]);

  const unlogTip = useCallback(async (tipId: string) => {
    if (!user) return;
    const { error } = await supabase
      .from("movement_logs")
      .delete()
      .eq("user_id", user.id)
      .eq("tip_id", tipId)
      .eq("shift_date", today);
    if (!error) {
      const next = todayCompleted.filter((id) => id !== tipId);
      setTodayCompleted(next);
      if (next.length === 0) {
        setStreak((s) => Math.max(0, s - 1));
      }
    }
  }, [user, today, todayCompleted]);

  return {
    streak,
    todayCompleted,
    loading,
    logTip,
    unlogTip,
    hasTodayActivity: todayCompleted.length > 0,
  };
}

function calcStreak(sortedDatesDesc: string[]): number {
  if (sortedDatesDesc.length === 0) return 0;

  const toDay = (d: string) => {
    const [y, m, day] = d.split("-").map(Number);
    return new Date(y, m - 1, day);
  };

  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  const first = toDay(sortedDatesDesc[0]);
  const diffFromToday = Math.round((todayDate.getTime() - first.getTime()) / 86400000);

  // Streak must start today or yesterday
  if (diffFromToday > 1) return 0;

  let count = 1;
  for (let i = 1; i < sortedDatesDesc.length; i++) {
    const prev = toDay(sortedDatesDesc[i - 1]);
    const curr = toDay(sortedDatesDesc[i]);
    const diff = Math.round((prev.getTime() - curr.getTime()) / 86400000);
    if (diff === 1) {
      count++;
    } else {
      break;
    }
  }
  return count;
}
