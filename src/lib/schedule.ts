export type DietType = "standard" | "vegetarian" | "vegan" | "keto";

export interface ScheduleItem {
  id: string;
  time: string;
  type: "fuel" | "drip" | "caffeine-cutoff" | "crash-alert";
  title?: string;
  description?: string;
  calories?: number;
  amount?: number;
  phase?: number;
}

export interface ShiftPhase {
  label: string;
  time: string;
  icon: "coffee" | "moon" | "alert-triangle" | "sun" | "sunrise";
  description: string;
  isCaffeineCutoff?: boolean;
  isCrashAlert?: boolean;
}

function parseTime(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function formatTime(minutes: number): string {
  const m = ((minutes % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const min = m % 60;
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${min.toString().padStart(2, "0")} ${period}`;
}

type MealSet = Array<{ title: string; description: string; calories: number }>;

const mealsByDiet: Record<DietType, MealSet> = {
  standard: [
    { title: "Pre-Shift Fuel", description: "Complex carbs + lean protein", calories: 450 },
    { title: "Mid-Shift Boost", description: "Light protein + healthy fats", calories: 350 },
    { title: "Power Snack", description: "Nuts, fruit & yogurt", calories: 200 },
    { title: "Post-Shift Recovery", description: "Protein-rich, easy to digest", calories: 400 },
  ],
  vegetarian: [
    { title: "Pre-Shift Fuel", description: "Quinoa bowl with roasted veg & halloumi", calories: 460 },
    { title: "Mid-Shift Boost", description: "Egg & avocado wrap with hummus", calories: 370 },
    { title: "Power Snack", description: "Greek yogurt, walnuts & berries", calories: 210 },
    { title: "Post-Shift Recovery", description: "Lentil soup with whole-grain bread", calories: 420 },
  ],
  vegan: [
    { title: "Pre-Shift Fuel", description: "Tofu stir-fry with brown rice & edamame", calories: 440 },
    { title: "Mid-Shift Boost", description: "Chickpea & avocado wrap", calories: 360 },
    { title: "Power Snack", description: "Trail mix with dark chocolate & dried mango", calories: 220 },
    { title: "Post-Shift Recovery", description: "Black bean burrito bowl with cashew crema", calories: 410 },
  ],
  keto: [
    { title: "Pre-Shift Fuel", description: "Salmon with avocado & sautéed spinach", calories: 520 },
    { title: "Mid-Shift Boost", description: "Cheese & salami roll-ups with olives", calories: 380 },
    { title: "Power Snack", description: "Macadamia nuts & pork rinds", calories: 250 },
    { title: "Post-Shift Recovery", description: "Ribeye with butter & roasted asparagus", calories: 480 },
  ],
};

const crashAlertSnacks: Record<DietType, string> = {
  standard: "Try hard-boiled eggs, turkey roll-ups, or cottage cheese instead of sugary snacks.",
  vegetarian: "Try Greek yogurt with nuts, cheese cubes, or a protein smoothie instead of sugar.",
  vegan: "Try edamame, almond butter on celery, or roasted chickpeas instead of sugar.",
  keto: "Try cheese crisps, beef jerky, or avocado bites instead of sugar.",
};

export function isNightShift(startTime: string, endTime: string): boolean {
  const start = parseTime(startTime);
  const end = parseTime(endTime);
  // Night shift: starts late evening (21:00+) and ends early morning
  return start >= 1260 && (end <= 480 || end <= start);
}

export function getCaffeineDeadline(startTime: string, endTime: string): string | null {
  if (!isNightShift(startTime, endTime)) return null;
  return "2:00 AM";
}

export function getCrashAlertTip(diet: DietType): string {
  return crashAlertSnacks[diet];
}

export function generatePhases(startTime: string, endTime: string): ShiftPhase[] {
  const start = parseTime(startTime);
  let end = parseTime(endTime);
  if (end <= start) end += 1440;
  const duration = end - start;

  const phases: ShiftPhase[] = [
    {
      label: "Shift Start",
      time: formatTime(start),
      icon: "moon",
      description: "Begin your shift fueled and hydrated",
    },
    {
      label: "Caffeine Cutoff",
      time: isNightShift(startTime, endTime) ? "2:00 AM" : formatTime(start + Math.floor(duration * 0.4)),
      icon: "coffee",
      description: "No more caffeine after this point for quality sleep",
      isCaffeineCutoff: true,
    },
    {
      label: "Energy Dip Zone",
      time: isNightShift(startTime, endTime) ? "3:00 AM" : formatTime(start + Math.floor(duration * 0.5)),
      icon: "alert-triangle",
      description: "Choose high-protein snacks over sugar to avoid a crash",
      isCrashAlert: true,
    },
    {
      label: "Final Push",
      time: formatTime(end - 90),
      icon: "sunrise",
      description: "Light hydration & steady energy to finish strong",
    },
    {
      label: "Shift End",
      time: formatTime(end),
      icon: "sun",
      description: "Wind down & prepare for recovery",
    },
  ];

  return phases;
}

export function generateSchedule(startTime: string, endTime: string, diet: DietType = "standard", cupSizeMl: number = 300): ScheduleItem[] {
  const start = parseTime(startTime);
  let end = parseTime(endTime);
  if (end <= start) end += 1440;

  const meals = mealsByDiet[diet];
  const items: ScheduleItem[] = [];
  let id = 0;

  const duration = end - start;
  const mealTimes = [
    start - 30,
    start + Math.floor(duration * 0.4),
    start + Math.floor(duration * 0.7),
    end + 15,
  ];

  // Caffeine cutoff item
  if (isNightShift(startTime, endTime)) {
    items.push({
      id: `caffeine-${id++}`,
      time: "2:00 AM",
      type: "caffeine-cutoff",
      title: "Caffeine Cutoff",
      description: "Switch to water or herbal tea — no more caffeine for quality sleep",
    });
  }

  meals.forEach((meal, i) => {
    items.push({ id: String(id++), time: formatTime(mealTimes[i]), type: "fuel", ...meal, phase: i + 1 });

    if (i < meals.length - 1) {
      const dripTime = mealTimes[i] + 30;
      items.push({ id: String(id++), time: formatTime(dripTime), type: "drip", amount: cupSizeMl });
    } else {
      items.push({ id: String(id++), time: formatTime(end), type: "drip", amount: cupSizeMl });
    }
  });

  // Crash alert at 3 AM for night shifts
  if (isNightShift(startTime, endTime)) {
    items.push({
      id: `crash-${id++}`,
      time: "3:00 AM",
      type: "crash-alert",
      title: "⚠️ Crash Alert",
      description: crashAlertSnacks[diet],
    });
  }

  return items;
}

export const decompressionBreakfast: Record<DietType, { title: string; description: string; calories: number }> = {
  standard: {
    title: "Decompression Breakfast",
    description: "Scrambled eggs, whole-grain toast with avocado & chamomile tea",
    calories: 520,
  },
  vegetarian: {
    title: "Decompression Breakfast",
    description: "Veggie omelette with feta, sourdough toast & herbal tea",
    calories: 490,
  },
  vegan: {
    title: "Decompression Breakfast",
    description: "Tofu scramble with sautéed greens, toast & golden milk",
    calories: 480,
  },
  keto: {
    title: "Decompression Breakfast",
    description: "Bacon & cheese omelette with avocado, side of berries",
    calories: 560,
  },
};
