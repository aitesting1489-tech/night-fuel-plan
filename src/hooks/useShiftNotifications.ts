import { useEffect, useRef, useCallback, useState } from "react";
import { toast } from "sonner";
import {
  buildNotificationSchedule,
  sendPushNotification,
  canSendPushNotifications,
  type ScheduledNotification,
} from "@/lib/notifications";
import type { ScheduleItem } from "@/lib/schedule";

interface UseShiftNotificationsOptions {
  schedule: ScheduleItem[];
  reminderIntervalMinutes: number;
  shiftStartTime: string;
  shiftEndTime: string;
  enabled: boolean;
}

export function useShiftNotifications({
  schedule,
  reminderIntervalMinutes,
  shiftStartTime,
  shiftEndTime,
  enabled,
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

      if (n.fireAt.getTime() <= now) {
        n.fired = true;

        // In-app toast
        const icon = n.tag === "hydration" ? "💧" : n.tag === "meal" ? "🍽️" : n.tag === "tip" ? "🌙" : "⚡";
        toast(n.title, {
          description: n.body,
          duration: 6000,
          icon,
        });

        // Push notification
        if (canSendPushNotifications()) {
          sendPushNotification(n.title, n.body, n.tag);
        }
      } else if (!nextUnfired) {
        nextUnfired = n;
      }
    }

    setNextNotification(nextUnfired);
  }, []);

  useEffect(() => {
    if (!enabled || schedule.length === 0) return;

    notificationsRef.current = buildNotificationSchedule(
      schedule,
      reminderIntervalMinutes,
      shiftStartTime,
      shiftEndTime
    );

    // Check every 15 seconds
    intervalRef.current = setInterval(checkAndFire, 15_000);
    checkAndFire();

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled, schedule, reminderIntervalMinutes, shiftStartTime, shiftEndTime, checkAndFire]);

  return { nextNotification };
}
