/** Movement & rest tips, organized by shift phase and post-shift recovery */

export interface MovementTip {
  id: string;
  emoji: string;
  title: string;
  body: string;
  /** When to show: during-shift, post-shift, or rest-day */
  context: "during-shift" | "post-shift" | "rest-day";
  /** Rough shift phase (0 = early, 1 = mid, 2 = late). null = any */
  phase: number | null;
  /** Duration of activity in minutes (for UI display) */
  durationMin?: number;
}

export const movementTips: MovementTip[] = [
  // ── During Shift: Early ──
  { id: "mv-1", emoji: "🚶", title: "Walk Break", body: "Take a 2-minute walk to get your blood flowing and boost alertness.", context: "during-shift", phase: 0, durationMin: 2 },
  { id: "mv-2", emoji: "🧘", title: "Desk Stretch", body: "Stretch your neck, shoulders, and wrists — hold each stretch for 15 seconds.", context: "during-shift", phase: 0, durationMin: 1 },
  { id: "mv-3", emoji: "🦵", title: "Calf Raises", body: "Do 15 calf raises at your station to improve circulation in your legs.", context: "during-shift", phase: 0, durationMin: 1 },

  // ── During Shift: Mid ──
  { id: "mv-4", emoji: "🔄", title: "Posture Reset", body: "Roll your shoulders back, sit tall, and engage your core for 30 seconds. Good posture = more energy.", context: "during-shift", phase: 1, durationMin: 1 },
  { id: "mv-5", emoji: "👀", title: "Eye Rest (20-20-20)", body: "Look at something 20 feet away for 20 seconds every 20 minutes to reduce eye strain.", context: "during-shift", phase: 1, durationMin: 1 },
  { id: "mv-6", emoji: "🤸", title: "Standing Stretch", body: "Stand up, reach for the ceiling, then touch your toes. Repeat 3 times to reset your body.", context: "during-shift", phase: 1, durationMin: 2 },
  { id: "mv-7", emoji: "💪", title: "Desk Push-ups", body: "Do 10 incline push-ups against your desk to wake up your muscles.", context: "during-shift", phase: 1, durationMin: 1 },

  // ── During Shift: Late ──
  { id: "mv-8", emoji: "🌬️", title: "Deep Breathing", body: "Box breathe: inhale 4s, hold 4s, exhale 4s, hold 4s. Repeat 4 times for a focus reset.", context: "during-shift", phase: 2, durationMin: 2 },
  { id: "mv-9", emoji: "🦶", title: "Ankle Circles", body: "Rotate each ankle 10 times in each direction to fight swelling from sitting.", context: "during-shift", phase: 2, durationMin: 1 },
  { id: "mv-10", emoji: "🫁", title: "Energizing Breath", body: "Quick breaths in through your nose for 30 seconds — a natural energy boost without caffeine.", context: "during-shift", phase: 2, durationMin: 1 },

  // ── Post-Shift Recovery ──
  { id: "mv-11", emoji: "🚿", title: "Cool Shower", body: "A lukewarm-to-cool shower signals your body it's time to wind down and lowers your core temperature.", context: "post-shift", phase: null, durationMin: 10 },
  { id: "mv-12", emoji: "🧘‍♀️", title: "Gentle Yoga", body: "5 minutes of gentle yoga: child's pose, cat-cow, and legs-up-the-wall before sleep.", context: "post-shift", phase: null, durationMin: 5 },
  { id: "mv-13", emoji: "🌅", title: "Light Walk", body: "A 10-minute walk helps decompress your body and mind after a long shift.", context: "post-shift", phase: null, durationMin: 10 },
  { id: "mv-14", emoji: "🦴", title: "Foam Rolling", body: "Roll out your back, calves, and shoulders for 5 minutes to release tension built up during the shift.", context: "post-shift", phase: null, durationMin: 5 },
  { id: "mv-15", emoji: "😴", title: "Progressive Relaxation", body: "Tense and release each muscle group from toes to head — a proven way to fall asleep faster.", context: "post-shift", phase: null, durationMin: 5 },

  // ── Rest Day Tips ──
  { id: "mv-16", emoji: "☀️", title: "Morning Sunlight", body: "Get 10-15 min of morning sunlight to help reset your circadian rhythm after night shifts.", context: "rest-day", phase: null, durationMin: 15 },
  { id: "mv-17", emoji: "🏃", title: "Active Recovery", body: "A 20-minute brisk walk or light jog on your day off keeps your body in rhythm.", context: "rest-day", phase: null, durationMin: 20 },
  { id: "mv-18", emoji: "🧊", title: "Contrast Therapy", body: "Alternate 30s cold / 2min warm water in the shower to reduce inflammation and boost mood.", context: "rest-day", phase: null, durationMin: 10 },
  { id: "mv-19", emoji: "📵", title: "Screen Break", body: "Take a 1-hour break from screens to let your eyes and mind fully rest.", context: "rest-day", phase: null, durationMin: 60 },
  { id: "mv-20", emoji: "🌿", title: "Nature Time", body: "Spend time outdoors — nature exposure reduces cortisol and improves sleep quality.", context: "rest-day", phase: null, durationMin: 30 },
];

/** Get tips for a specific context, optionally filtering by phase */
export function getTipsForContext(
  context: MovementTip["context"],
  phase?: number | null
): MovementTip[] {
  return movementTips.filter(
    (t) => t.context === context && (phase == null || t.phase === null || t.phase === phase)
  );
}

/** Pick N random tips from a set */
export function pickRandomTips(tips: MovementTip[], count: number): MovementTip[] {
  const shuffled = [...tips].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/** Get a single random movement tip for notifications */
export function getRandomMovementTip(context: MovementTip["context"] = "during-shift"): MovementTip {
  const pool = movementTips.filter((t) => t.context === context);
  return pool[Math.floor(Math.random() * pool.length)];
}
