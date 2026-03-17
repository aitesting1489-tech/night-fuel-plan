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

const meals: Array<{ title: string; description: string; calories: number }> = [
  { title: "Pre-Shift Fuel", description: "Complex carbs + lean protein", calories: 450 },
  { title: "Mid-Shift Boost", description: "Light protein + healthy fats", calories: 350 },
  { title: "Power Snack", description: "Nuts, fruit & yogurt", calories: 200 },
  { title: "Post-Shift Recovery", description: "Protein-rich, easy to digest", calories: 400 },
];

export function generateSchedule(startTime: string, endTime: string): ScheduleItem[] {
  const start = parseTime(startTime);
  let end = parseTime(endTime);
  if (end <= start) end += 1440;
  const duration = end - start;

  const items: ScheduleItem[] = [];
  let id = 0;

  // Pre-shift meal 30 min before
  const preShift = start - 30;
  items.push({
    id: String(id++),
    time: formatTime(preShift),
    type: "fuel",
    ...meals[0],
  });

  // Hydration at start
  items.push({
    id: String(id++),
    time: formatTime(start),
    type: "drip",
    amount: 350,
  });

  // Mid-shift meal
  const mid = start + Math.floor(duration * 0.4);
  items.push({
    id: String(id++),
    time: formatTime(mid),
    type: "fuel",
    ...meals[1],
  });

  // Hydration every ~90 min during shift
  const hydrationInterval = 90;
  for (let t = start + hydrationInterval; t < end; t += hydrationInterval) {
    // Skip if too close to a meal
    if (Math.abs(t - mid) > 15) {
      items.push({
        id: String(id++),
        time: formatTime(t),
        type: "drip",
        amount: 250,
      });
    }
  }

  // Late shift snack
  const lateSnack = start + Math.floor(duration * 0.7);
  items.push({
    id: String(id++),
    time: formatTime(lateSnack),
    type: "fuel",
    ...meals[2],
  });

  // Post-shift recovery
  items.push({
    id: String(id++),
    time: formatTime(end + 15),
    type: "fuel",
    ...meals[3],
  });

  // Final hydration
  items.push({
    id: String(id++),
    time: formatTime(end),
    type: "drip",
    amount: 300,
  });

  // Sort by original insertion (already roughly chronological across the shift)
  return items;
}
