import { useEffect, useRef, useCallback, useState } from "react";
import { toast } from "sonner";
import {
  buildNotificationSchedule,
  sendPushNotification,
  canSendPushNotifications,
  type ScheduledNotification,
} from "@/lib/notifications";
import { playNotificationSound, canPlaySound, type SoundTheme } from "@/lib/notificationSounds";
import type { ScheduleItem } from "@/lib/schedule";
import type { NotificationPreferences } from "@/hooks/useWaterSettings";

interface UseShiftNotificationsOptions {
  schedule: ScheduleItem[];
  reminderIntervalMinutes: number;
  shiftStartTime: string;
  shiftEndTime: string;
  enabled: boolean;
  preferences?: NotificationPreferences;
  soundEnabled?: boolean;
  soundVolume?: number;
}

const tagToPreference: Record<string, keyof NotificationPreferences> = {
  hydration: "notify_hydration",
  meal: "notify_meals",
  phase: "notify_phases",
  tip: "notify_tips",
};

export function useShiftNotifications({
  schedule,
  reminderIntervalMinutes,
  shiftStartTime,
  shiftEndTime,
  enabled,
  preferences,
  soundEnabled = true,
  soundVolume = 0.5,
}: UseShiftNotificationsOptions) {
  const notificationsRef = useRef<ScheduledNotification[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [nextNotification, setNextNotification] = useState<ScheduledNotification | null>(null);

  const checkAndFire = useCallback(() => {
    const now = Date.now();
    const notifications = notificationsRef.current;
    let nextUnfired: ScheduledNotification | null = null;

    for (const n of notifications) {
      if (n.fired) continue;

      // Check if this notification type is enabled in preferences
      const prefKey = tagToPreference[n.tag];
      if (prefKey && preferences && !preferences[prefKey]) {
        continue; // Skip disabled notification types
      }

      if (n.fireAt.getTime() <= now) {
        n.fired = true;

        // Play sound effect
        if (soundEnabled && canPlaySound()) {
          playNotificationSound(n.tag, soundVolume);
        }

        const icon = n.tag === "hydration" ? "💧" : n.tag === "meal" ? "🍽️" : n.tag === "tip" ? "🌙" : "⚡";
        toast(n.title, {
          description: n.body,
          duration: 6000,
          icon,
        });

        if (canSendPushNotifications()) {
          sendPushNotification(n.title, n.body, n.tag);
        }
      } else if (!nextUnfired) {
        nextUnfired = n;
      }
    }

    setNextNotification(nextUnfired);
  }, [preferences]);

  useEffect(() => {
    if (!enabled || schedule.length === 0) return;

    notificationsRef.current = buildNotificationSchedule(
      schedule,
      reminderIntervalMinutes,
      shiftStartTime,
      shiftEndTime
    );

    intervalRef.current = setInterval(checkAndFire, 15_000);
    checkAndFire();

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled, schedule, reminderIntervalMinutes, shiftStartTime, shiftEndTime, checkAndFire]);

  return { nextNotification };
}
