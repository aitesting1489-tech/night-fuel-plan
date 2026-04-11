import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { movementTips } from "@/lib/movementTips";

interface WeeklySummary {
  tipsCompleted: number;
  minutesMoved: number;
  daysActive: number;
}

interface UseMovementStreakReturn {
  streak: number;
  todayCompleted: string[];
  loading: boolean;
  logTip: (tipId: string) => Promise<void>;
  unlogTip: (tipId: string) => Promise<void>;
  hasTodayActivity: boolean;
  weeklySummary: WeeklySummary;
}

const tipDurationMap = new Map(movementTips.map((t) => [t.id, t.durationMin ?? 0]));

export function useMovementStreak(): UseMovementStreakReturn {
  const { user } = useAuth();
  const [streak, setStreak] = useState(0);
  const [todayCompleted, setTodayCompleted] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [weeklySummary, setWeeklySummary] = useState<WeeklySummary>({ tipsCompleted: 0, minutesMoved: 0, daysActive: 0 });

  const today = new Date().toISOString().split("T")[0];

  const fetchData = useCallback(async () => {
    if (!user) { setLoading(false); return; }

    // Week start (Monday)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - mondayOffset);
    const weekStartStr = weekStart.toISOString().split("T")[0];

    const [todayRes, datesRes, weekRes] = await Promise.all([
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
      supabase
        .from("movement_logs")
        .select("tip_id, shift_date")
        .eq("user_id", user.id)
        .gte("shift_date", weekStartStr),
    ]);

    if (todayRes.data) {
      setTodayCompleted(todayRes.data.map((r) => r.tip_id));
    }

    if (datesRes.data) {
      const uniqueDates = [...new Set(datesRes.data.map((r) => r.shift_date))].sort().reverse();
      setStreak(calcStreak(uniqueDates));
    }

    if (weekRes.data) {
      const tipsCompleted = weekRes.data.length;
      const minutesMoved = weekRes.data.reduce((sum, r) => sum + (tipDurationMap.get(r.tip_id) || 2), 0);
      const daysActive = new Set(weekRes.data.map((r) => r.shift_date)).size;
      setWeeklySummary({ tipsCompleted, minutesMoved, daysActive });
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
    weeklySummary,
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
