import type { ScheduleItem } from "@/lib/schedule";

// ── Wellness tips shown randomly during shifts ──
const wellnessTips = [
  "🦉 Stand up and stretch for 30 seconds — your back will thank you.",
  "🦉 Take 3 deep breaths: in for 4s, hold 4s, out for 6s.",
  "🦉 Splash cold water on your wrists to boost alertness naturally.",
  "🦉 Look at something 20 feet away for 20 seconds to rest your eyes.",
  "🦉 Good posture = more energy. Roll your shoulders back.",
  "🦉 A quick walk (even 2 minutes) resets your focus.",
  "🦉 Chewing gum can improve alertness during long shifts.",
  "🦉 Bright light exposure helps reset your circadian rhythm.",
  "🦉 Avoid heavy meals — light protein keeps you sharp.",
  "🦉 Your body loses water faster at night. Sip consistently.",
  "🦉 Dim your phone brightness — it helps your eyes adjust to the dark.",
  "🦉 A handful of nuts is the perfect night shift brain fuel.",
  "🦉 Rotate your ankles under the desk to keep blood flowing.",
  "🦉 Humming for 10 seconds activates your vagus nerve — instant calm.",
  "🦉 Night owls like us need extra vitamin D. Don't forget your supplements!",
];

export function getRandomTip(): string {
  return wellnessTips[Math.floor(Math.random() * wellnessTips.length)];
}

// ── Push notification permission ──
export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

export function canSendPushNotifications(): boolean {
  return "Notification" in window && Notification.permission === "granted";
}

export function sendPushNotification(title: string, body: string, tag?: string) {
  if (!canSendPushNotifications()) return;
  try {
    new Notification(title, {
      body,
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-192x192.png",
      tag: tag || "circadia",
      silent: false,
    });
  } catch {
    // Notification constructor not available (e.g. some mobile browsers)
  }
}

// ── Shift notification scheduler ──
export interface ScheduledNotification {
  id: string;
  fireAt: Date;
  title: string;
  body: string;
  tag: string;
  fired: boolean;
}

function parseScheduleTime(timeStr: string, shiftDate: Date): Date {
  // Parse "HH:MM AM/PM" format
  const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return new Date(shiftDate);
  let hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  const period = match[3].toUpperCase();
  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  const d = new Date(shiftDate);
  d.setHours(hours, minutes, 0, 0);
  // If time is before the shift date reference, it's next day
  if (d < shiftDate) d.setDate(d.getDate() + 1);
  return d;
}

export function buildNotificationSchedule(
  schedule: ScheduleItem[],
  reminderIntervalMinutes: number,
  shiftStartTime: string,
  shiftEndTime: string
): ScheduledNotification[] {
  const now = new Date();
  const notifications: ScheduledNotification[] = [];
  let id = 0;

  // Meal & phase alerts from schedule
  schedule.forEach((item) => {
    const fireAt = parseScheduleTime(item.time, now);

    if (item.type === "fuel") {
      notifications.push({
        id: `meal-${id++}`,
        fireAt,
        title: `🍽️ ${item.title || "Meal Time"}`,
        body: item.description || "Time to eat!",
        tag: "meal",
        fired: false,
      });
    }

    if (item.type === "caffeine-cutoff") {
      notifications.push({
        id: `caffeine-${id++}`,
        fireAt,
        title: "☕ Caffeine Cutoff",
        body: "Switch to water or herbal tea for better sleep later.",
        tag: "phase",
        fired: false,
      });
    }

    if (item.type === "crash-alert") {
      notifications.push({
        id: `crash-${id++}`,
        fireAt,
        title: "⚠️ Energy Dip Zone",
        body: item.description || "Choose high-protein snacks over sugar.",
        tag: "phase",
        fired: false,
      });
    }
  });

  // Hydration reminders at the configured interval
  const shiftStart = parseScheduleTime(
    formatTimeForParse(shiftStartTime),
    now
  );
  const shiftEnd = parseScheduleTime(
    formatTimeForParse(shiftEndTime),
    now
  );
  if (shiftEnd <= shiftStart) shiftEnd.setDate(shiftEnd.getDate() + 1);

  let dripTime = new Date(shiftStart.getTime() + reminderIntervalMinutes * 60 * 1000);
  while (dripTime < shiftEnd) {
    notifications.push({
      id: `hydration-${id++}`,
      fireAt: new Date(dripTime),
      title: "💧 Hydration Check",
      body: "Time for a drink! Stay hydrated to keep your energy up.",
      tag: "hydration",
      fired: false,
    });
    dripTime = new Date(dripTime.getTime() + reminderIntervalMinutes * 60 * 1000);
  }

  // Wellness tips — sprinkle 2-3 during shift
  const shiftDuration = shiftEnd.getTime() - shiftStart.getTime();
  const tipCount = Math.min(3, Math.floor(shiftDuration / (2 * 60 * 60 * 1000)));
  for (let i = 0; i < tipCount; i++) {
    const offset = ((i + 1) / (tipCount + 1)) * shiftDuration;
    // Offset by a random 5-15 min so they don't stack with other notifications
    const jitter = (5 + Math.random() * 10) * 60 * 1000;
    notifications.push({
      id: `tip-${id++}`,
      fireAt: new Date(shiftStart.getTime() + offset + jitter),
      title: "🦉 Noctis says...",
      body: getRandomTip(),
      tag: "tip",
      fired: false,
    });
  }

  return notifications.sort((a, b) => a.fireAt.getTime() - b.fireAt.getTime());
}

function formatTimeForParse(time: string): string {
  // Convert "HH:MM" (24h) to "H:MM AM/PM"
  const match = time.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return time;
  let h = parseInt(match[1]);
  const m = match[2];
  const period = h >= 12 ? "PM" : "AM";
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h}:${m} ${period}`;
}
