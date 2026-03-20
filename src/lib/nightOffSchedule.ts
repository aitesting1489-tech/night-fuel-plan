import type { DietType, ScheduleItem } from "./schedule";

type MealEntry = { title: string; description: string; calories: number };

const nightOffMeals: Record<DietType, MealEntry[]> = {
  standard: [
    { title: "Early Dinner", description: "Grilled chicken, sweet potato & steamed greens", calories: 550 },
    { title: "Light Evening Snack", description: "Cottage cheese with berries & honey", calories: 180 },
    { title: "Sleep Prep Snack", description: "Banana with almond butter & chamomile tea", calories: 150 },
  ],
  vegetarian: [
    { title: "Early Dinner", description: "Mushroom risotto with parmesan & side salad", calories: 530 },
    { title: "Light Evening Snack", description: "Greek yogurt with walnuts & cinnamon", calories: 190 },
    { title: "Sleep Prep Snack", description: "Warm milk with turmeric & a small oat cookie", calories: 160 },
  ],
  vegan: [
    { title: "Early Dinner", description: "Lentil curry with basmati rice & roasted cauliflower", calories: 520 },
    { title: "Light Evening Snack", description: "Hummus with veggie sticks & whole-grain crackers", calories: 200 },
    { title: "Sleep Prep Snack", description: "Tart cherry juice & a handful of pistachios", calories: 140 },
  ],
  keto: [
    { title: "Early Dinner", description: "Pan-seared salmon with garlic butter broccoli", calories: 580 },
    { title: "Light Evening Snack", description: "Cheese board with olives & salami", calories: 220 },
    { title: "Sleep Prep Snack", description: "Bone broth with a spoonful of coconut oil", calories: 120 },
  ],
};

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

/**
 * Generates a sleep-optimized eating & drinking schedule for nights off.
 * @param bedtime - Target bedtime in HH:MM (24h)
 * @param diet - Diet preference
 */
export function generateNightOffSchedule(bedtime: string, diet: DietType): ScheduleItem[] {
  const bed = parseTime(bedtime);
  const meals = nightOffMeals[diet];
  const items: ScheduleItem[] = [];
  let id = 0;

  // Dinner: 4 hours before bed
  const dinnerTime = bed - 240;
  // Hydration after dinner: 3.5h before bed
  const hydration1 = bed - 210;
  // Evening snack: 2.5h before bed
  const snackTime = bed - 150;
  // Hydration: 2h before bed
  const hydration2 = bed - 120;
  // Sleep prep snack: 1h before bed
  const sleepSnackTime = bed - 60;
  // Final small sip: 30 min before bed
  const finalSip = bed - 30;

  // Dinner
  items.push({ id: String(id++), time: formatTime(dinnerTime), type: "fuel", ...meals[0], phase: 1 });
  // Hydration
  items.push({ id: String(id++), time: formatTime(hydration1), type: "drip", amount: 350 });
  // Evening snack
  items.push({ id: String(id++), time: formatTime(snackTime), type: "fuel", ...meals[1], phase: 2 });
  // Hydration
  items.push({ id: String(id++), time: formatTime(hydration2), type: "drip", amount: 250 });
  // Caffeine cutoff reminder (6h before bed)
  items.push({
    id: `caffeine-${id++}`,
    time: formatTime(bed - 360),
    type: "caffeine-cutoff",
    title: "Caffeine Cutoff",
    description: "No caffeine from here — switch to herbal tea or water for quality sleep",
  });
  // Sleep prep snack
  items.push({ id: String(id++), time: formatTime(sleepSnackTime), type: "fuel", ...meals[2], phase: 3 });
  // Small final sip
  items.push({ id: String(id++), time: formatTime(finalSip), type: "drip", amount: 150 });

  // Sort chronologically
  const timeVal = (t: string) => {
    const match = t.match(/(\d+):(\d+)\s*(AM|PM)/);
    if (!match) return 0;
    let h = parseInt(match[1]);
    const m = parseInt(match[2]);
    if (match[3] === "PM" && h !== 12) h += 12;
    if (match[3] === "AM" && h === 12) h = 0;
    return h * 60 + m;
  };

  return items
    .filter((s) => s.type === "fuel" || s.type === "drip")
    .sort((a, b) => timeVal(a.time) - timeVal(b.time));
}

export function generateNightOffPhases(bedtime: string) {
  const bed = parseTime(bedtime);
  return [
    { label: "Evening Begins", time: formatTime(bed - 300), icon: "sun" as const, description: "Start winding down from the day" },
    { label: "Caffeine Cutoff", time: formatTime(bed - 360), icon: "coffee" as const, description: "No more caffeine for quality sleep", isCaffeineCutoff: true },
    { label: "Dinner Time", time: formatTime(bed - 240), icon: "sunrise" as const, description: "Nourishing meal to fuel overnight recovery" },
    { label: "Wind Down", time: formatTime(bed - 90), icon: "moon" as const, description: "Dim lights, relax & prep for sleep" },
    { label: "Bedtime", time: formatTime(bed), icon: "moon" as const, description: "Lights out — rest & recover" },
  ];
}
