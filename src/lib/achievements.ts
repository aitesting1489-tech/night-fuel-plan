export interface AchievementDef {
  key: string;
  title: string;
  description: string;
  emoji: string;
  category: "streak" | "volume" | "consistency";
  /** Check function receives stats and returns true if earned */
  check: (stats: HydrationStats) => boolean;
}

export interface HydrationStats {
  currentStreak: number;
  longestStreak: number;
  totalLiters: number;
  totalLogs: number;
  daysLogged: number;
  perfectWeeks: number; // weeks where all 7 days met goal
}

export const achievements: AchievementDef[] = [
  // Streak achievements
  {
    key: "streak_3",
    title: "Getting Started",
    description: "Hit your hydration goal 3 days in a row",
    emoji: "🌱",
    category: "streak",
    check: (s) => s.longestStreak >= 3,
  },
  {
    key: "streak_7",
    title: "Week Warrior",
    description: "7-day hydration streak",
    emoji: "🔥",
    category: "streak",
    check: (s) => s.longestStreak >= 7,
  },
  {
    key: "streak_14",
    title: "Fortnight Flow",
    description: "14-day hydration streak",
    emoji: "⚡",
    category: "streak",
    check: (s) => s.longestStreak >= 14,
  },
  {
    key: "streak_30",
    title: "Monthly Master",
    description: "30-day hydration streak",
    emoji: "👑",
    category: "streak",
    check: (s) => s.longestStreak >= 30,
  },

  // Volume achievements
  {
    key: "volume_10",
    title: "First 10 Liters",
    description: "Log 10 liters total",
    emoji: "💧",
    category: "volume",
    check: (s) => s.totalLiters >= 10,
  },
  {
    key: "volume_50",
    title: "Hydration Hero",
    description: "Log 50 liters total",
    emoji: "🌊",
    category: "volume",
    check: (s) => s.totalLiters >= 50,
  },
  {
    key: "volume_100",
    title: "Century Club",
    description: "Log 100 liters total",
    emoji: "🏆",
    category: "volume",
    check: (s) => s.totalLiters >= 100,
  },
  {
    key: "volume_500",
    title: "Ocean Force",
    description: "Log 500 liters total",
    emoji: "🐋",
    category: "volume",
    check: (s) => s.totalLiters >= 500,
  },

  // Consistency achievements
  {
    key: "logs_10",
    title: "First Steps",
    description: "Log 10 hydration entries",
    emoji: "📝",
    category: "consistency",
    check: (s) => s.totalLogs >= 10,
  },
  {
    key: "logs_100",
    title: "Dedicated Dripper",
    description: "Log 100 hydration entries",
    emoji: "💪",
    category: "consistency",
    check: (s) => s.totalLogs >= 100,
  },
  {
    key: "days_7",
    title: "First Week",
    description: "Log hydration on 7 different days",
    emoji: "📅",
    category: "consistency",
    check: (s) => s.daysLogged >= 7,
  },
  {
    key: "days_30",
    title: "Month of Hydration",
    description: "Log hydration on 30 different days",
    emoji: "🗓️",
    category: "consistency",
    check: (s) => s.daysLogged >= 30,
  },
  {
    key: "perfect_week",
    title: "Perfect Week",
    description: "Meet your goal every day for a full week",
    emoji: "✨",
    category: "consistency",
    check: (s) => s.perfectWeeks >= 1,
  },
];
