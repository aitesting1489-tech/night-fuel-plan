import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { achievements, type HydrationStats } from "@/lib/achievements";
import { toast } from "sonner";

export function useAchievements(dailyGoalMl: number) {
  const { user } = useAuth();
  const [earnedKeys, setEarnedKeys] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState<HydrationStats>({
    currentStreak: 0,
    longestStreak: 0,
    totalLiters: 0,
    totalLogs: 0,
    daysLogged: 0,
    perfectWeeks: 0,
  });
  const [loading, setLoading] = useState(true);

  const loadEarned = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_achievements")
      .select("achievement_key")
      .eq("user_id", user.id);
    if (data) {
      setEarnedKeys(new Set(data.map((r) => r.achievement_key)));
    }
  }, [user]);

  const computeStats = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data: logs } = await supabase
      .from("hydration_logs")
      .select("amount_ml, logged_at")
      .eq("user_id", user.id)
      .order("logged_at", { ascending: true });

    if (!logs || logs.length === 0) {
      setStats({
        currentStreak: 0,
        longestStreak: 0,
        totalLiters: 0,
        totalLogs: 0,
        daysLogged: 0,
        perfectWeeks: 0,
      });
      setLoading(false);
      return;
    }

    // Group by date
    const dailyTotals = new Map<string, number>();
    for (const log of logs) {
      const date = log.logged_at.split("T")[0];
      dailyTotals.set(date, (dailyTotals.get(date) || 0) + log.amount_ml);
    }

    const totalMl = logs.reduce((sum, l) => sum + l.amount_ml, 0);
    const sortedDates = Array.from(dailyTotals.keys()).sort();

    // Calculate streaks (days meeting goal)
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    for (let i = 0; i < sortedDates.length; i++) {
      const date = sortedDates[i];
      const total = dailyTotals.get(date) || 0;

      if (total >= dailyGoalMl) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }

    // Current streak: count backwards from today
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    
    // Check if the latest streak is current
    let checkDate = today;
    currentStreak = 0;
    for (let i = 0; i < 365; i++) {
      const total = dailyTotals.get(checkDate) || 0;
      if (total >= dailyGoalMl) {
        currentStreak++;
      } else if (i === 0 && checkDate === today) {
        // Today might not be over yet, check yesterday
        checkDate = yesterday;
        const yTotal = dailyTotals.get(checkDate) || 0;
        if (yTotal >= dailyGoalMl) {
          currentStreak++;
        } else {
          break;
        }
      } else {
        break;
      }
      const d = new Date(checkDate);
      d.setDate(d.getDate() - 1);
      checkDate = d.toISOString().split("T")[0];
    }

    // Perfect weeks
    let perfectWeeks = 0;
    const weekMap = new Map<string, number[]>();
    for (const [date, total] of dailyTotals) {
      const d = new Date(date);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      const weekKey = weekStart.toISOString().split("T")[0];
      if (!weekMap.has(weekKey)) weekMap.set(weekKey, []);
      if (total >= dailyGoalMl) weekMap.get(weekKey)!.push(1);
    }
    for (const [, days] of weekMap) {
      if (days.length >= 7) perfectWeeks++;
    }

    const newStats: HydrationStats = {
      currentStreak,
      longestStreak,
      totalLiters: totalMl / 1000,
      totalLogs: logs.length,
      daysLogged: dailyTotals.size,
      perfectWeeks,
    };

    setStats(newStats);
    setLoading(false);
    return newStats;
  }, [user, dailyGoalMl]);

  const checkAndAward = useCallback(async () => {
    if (!user) return;
    const newStats = await computeStats();
    if (!newStats) return;

    await loadEarned();

    // Check for newly earned achievements
    for (const ach of achievements) {
      if (earnedKeys.has(ach.key)) continue;
      if (ach.check(newStats)) {
        const { error } = await supabase.from("user_achievements").insert({
          user_id: user.id,
          achievement_key: ach.key,
        });
        if (!error) {
          setEarnedKeys((prev) => new Set([...prev, ach.key]));
          toast(`${ach.emoji} Achievement Unlocked!`, {
            description: `${ach.title} — ${ach.description}`,
            duration: 5000,
          });
        }
      }
    }
  }, [user, computeStats, loadEarned, earnedKeys]);

  useEffect(() => {
    if (!user) return;
    loadEarned();
    computeStats();
  }, [user, loadEarned, computeStats]);

  return { earnedKeys, stats, loading, checkAndAward, refresh: computeStats };
}
