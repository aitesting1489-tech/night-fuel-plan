import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { canSendPushNotifications } from "@/lib/notifications";
import { playNotificationSound } from "@/lib/notificationSounds";
import type { SoundTheme } from "@/lib/notificationSounds";

const STORAGE_KEY = "circadia_friend_alerts";

interface StoredState {
  myVolume: number;
  friendsBeatMe: string[]; // user_ids of friends already alerted about
  weekStart: string;
}

function getWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(now.setDate(diff)).toISOString().slice(0, 10);
}

function loadState(): StoredState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveState(state: StoredState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function useFriendAlerts(soundEnabled: boolean, soundVolume: number, soundTheme: SoundTheme) {
  const { user } = useAuth();
  const { toast } = useToast();
  const checked = useRef(false);

  useEffect(() => {
    if (!user || checked.current) return;
    checked.current = true;

    const check = async () => {
      // Get friends list
      const { data: friendRows } = await supabase
        .from("friend_connections")
        .select("friend_user_id, user_id")
        .or(`user_id.eq.${user.id},friend_user_id.eq.${user.id}`);

      if (!friendRows || friendRows.length === 0) return;

      const friendIds = friendRows.map((r) =>
        r.user_id === user.id ? r.friend_user_id : r.user_id
      );

      // Get leaderboard stats
      const { data: stats } = await supabase.rpc("get_leaderboard_stats");
      if (!stats || !Array.isArray(stats)) return;

      const myStats = stats.find((s: any) => s.user_id === user.id);
      if (!myStats) return;

      const myVolume = Number(myStats.weekly_volume_ml);
      const weekStart = getWeekStart();
      const prev = loadState();

      // Reset if new week
      const prevAlerted = prev && prev.weekStart === weekStart ? prev.friendsBeatMe : [];

      const newBeaters: { name: string; volume: number; id: string }[] = [];

      for (const entry of stats as any[]) {
        if (!friendIds.includes(entry.user_id)) continue;
        const friendVol = Number(entry.weekly_volume_ml);
        if (friendVol > myVolume && !prevAlerted.includes(entry.user_id)) {
          newBeaters.push({ name: entry.display_name, volume: friendVol, id: entry.user_id });
        }
      }

      if (newBeaters.length > 0) {
        // Play sound
        if (soundEnabled) {
          playNotificationSound("hydration", soundVolume, soundTheme);
        }

        // Show toast for each (max 3)
        for (const beater of newBeaters.slice(0, 3)) {
          toast({
            title: `💧 ${beater.name} passed you!`,
            description: `They've hit ${(beater.volume / 1000).toFixed(1)}L this week. Time to hydrate!`,
          });
        }

        // Browser notification
        if (canSendPushNotifications()) {
          const names = newBeaters.map((b) => b.name).join(", ");
          new Notification("Hydration Challenge 💧", {
            body: `${names} beat your weekly hydration! Keep drinking!`,
            icon: "/placeholder.svg",
          });
        }

        // Save state
        saveState({
          myVolume,
          friendsBeatMe: [...prevAlerted, ...newBeaters.map((b) => b.id)],
          weekStart,
        });
      } else {
        saveState({ myVolume, friendsBeatMe: prevAlerted, weekStart });
      }
    };

    check();
  }, [user]);
}
