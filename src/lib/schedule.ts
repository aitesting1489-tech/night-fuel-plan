export type DietType = "standard" | "vegetarian" | "vegan" | "keto";

export interface ScheduleItem {
  id: string;
  time: string;
  type: "fuel" | "drip";
  title?: string;
  description?: string;
  calories?: number;
  amount?: number;
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

export function generateSchedule(startTime: string, endTime: string, diet: DietType = "standard"): ScheduleItem[] {
  const start = parseTime(startTime);
  let end = parseTime(endTime);
  if (end <= start) end += 1440;
  const duration = end - start;

  const meals = mealsByDiet[diet];
  const items: ScheduleItem[] = [];
  let id = 0;

  // Pre-shift meal 30 min before
  items.push({ id: String(id++), time: formatTime(start - 30), type: "fuel", ...meals[0] });

  // Hydration at start
  items.push({ id: String(id++), time: formatTime(start), type: "drip", amount: 350 });

  // Mid-shift meal
  const mid = start + Math.floor(duration * 0.4);
  items.push({ id: String(id++), time: formatTime(mid), type: "fuel", ...meals[1] });

  // Hydration every ~90 min during shift
  const hydrationInterval = 90;
  for (let t = start + hydrationInterval; t < end; t += hydrationInterval) {
    if (Math.abs(t - mid) > 15) {
      items.push({ id: String(id++), time: formatTime(t), type: "drip", amount: 250 });
    }
  }

  // Late shift snack
  items.push({ id: String(id++), time: formatTime(start + Math.floor(duration * 0.7)), type: "fuel", ...meals[2] });

  // Post-shift recovery
  items.push({ id: String(id++), time: formatTime(end + 15), type: "fuel", ...meals[3] });

  // Final hydration
  items.push({ id: String(id++), time: formatTime(end), type: "drip", amount: 300 });

  return items;
}
