import jsPDF from "jspdf";
import type { ScheduleItem, DietType } from "./schedule";
import { decompressionBreakfast } from "./schedule";

const BG = [18, 22, 32] as const;       // deep space
const TEAL = [60, 200, 180] as const;    // bioluminescent teal
const WHITE = [230, 235, 240] as const;  // off-white
const DIM = [140, 150, 165] as const;    // muted
const CARD_BG = [26, 32, 44] as const;   // card surface

export function generateProtocolPdf(
  startTime: string,
  endTime: string,
  diet: DietType,
  shiftName: string,
  schedule: ScheduleItem[]
) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210;
  let y = 0;

  // Helpers
  const bg = (r = BG[0], g = BG[1], b = BG[2]) => {
    doc.setFillColor(r, g, b);
    doc.rect(0, y, W, 297, "F");
  };
  const text = (
    str: string,
    x: number,
    yy: number,
    opts?: { color?: readonly number[]; size?: number; style?: string }
  ) => {
    const c = opts?.color ?? WHITE;
    doc.setTextColor(c[0], c[1], c[2]);
    doc.setFontSize(opts?.size ?? 10);
    doc.setFont("helvetica", opts?.style ?? "normal");
    doc.text(str, x, yy);
  };
  const card = (x: number, yy: number, w: number, h: number) => {
    doc.setFillColor(...CARD_BG);
    doc.roundedRect(x, yy, w, h, 3, 3, "F");
    doc.setDrawColor(...TEAL);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, yy, w, h, 3, 3, "S");
  };

  // ========== PAGE 1: Cover ==========
  bg();
  y = 50;
  text("CIRCADIA", W / 2, y, { color: TEAL, size: 28, style: "bold" });
  doc.setFont("helvetica", "normal");
  // Center the title
  const titleW = doc.getTextWidth("CIRCADIA");
  doc.text("CIRCADIA", (W - titleW) / 2, y);

  y += 12;
  const sub = "Pro Protocol";
  doc.setFontSize(14);
  doc.setTextColor(...WHITE);
  const subW = doc.getTextWidth(sub);
  doc.text(sub, (W - subW) / 2, y);

  // Divider line
  y += 10;
  doc.setDrawColor(...TEAL);
  doc.setLineWidth(0.5);
  doc.line(W / 2 - 30, y, W / 2 + 30, y);

  // Shift info
  y += 15;
  const info = shiftName ? `${shiftName}  ·  ${startTime} — ${endTime}` : `${startTime} — ${endTime}`;
  doc.setFontSize(11);
  doc.setTextColor(...DIM);
  const infoW = doc.getTextWidth(info);
  doc.text(info, (W - infoW) / 2, y);

  y += 8;
  const dietLabel = `Diet: ${diet.charAt(0).toUpperCase() + diet.slice(1)}`;
  doc.setFontSize(10);
  const dietW = doc.getTextWidth(dietLabel);
  doc.text(dietLabel, (W - dietW) / 2, y);

  // Generated date
  y += 20;
  const dateStr = `Generated ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`;
  doc.setFontSize(8);
  doc.setTextColor(...DIM);
  const dateW = doc.getTextWidth(dateStr);
  doc.text(dateStr, (W - dateW) / 2, y);

  // ========== PAGE 2: Meal Schedule ==========
  doc.addPage();
  bg();
  y = 20;
  text("YOUR SHIFT MEAL SCHEDULE", 15, y, { color: TEAL, size: 14, style: "bold" });

  y += 5;
  doc.setDrawColor(...TEAL);
  doc.setLineWidth(0.3);
  doc.line(15, y, W - 15, y);

  y += 8;

  const fuelItems = schedule.filter((s) => s.type === "fuel");
  const dripItems = schedule.filter((s) => s.type === "drip");

  fuelItems.forEach((item) => {
    if (y > 260) { doc.addPage(); bg(); y = 20; }
    card(15, y, W - 30, 22);
    text(item.time, 20, y + 7, { color: TEAL, size: 9, style: "bold" });
    text(item.title ?? "", 20, y + 13, { color: WHITE, size: 11, style: "bold" });
    text(item.description ?? "", 20, y + 18, { color: DIM, size: 8 });
    text(`${item.calories} kcal`, W - 20 - 20, y + 13, { color: TEAL, size: 9, style: "bold" });
    y += 27;
  });

  // Hydration section
  y += 5;
  if (y > 240) { doc.addPage(); bg(); y = 20; }
  text("HYDRATION SCHEDULE", 15, y, { color: TEAL, size: 12, style: "bold" });
  y += 8;

  dripItems.forEach((item) => {
    if (y > 270) { doc.addPage(); bg(); y = 20; }
    text(`💧  ${item.time}  —  ${item.amount}ml water`, 20, y, { color: WHITE, size: 9 });
    y += 6;
  });

  // ========== PAGE 3: Blackout Sleep Protocol ==========
  doc.addPage();
  bg();
  y = 20;
  text("THE BLACKOUT SLEEP PROTOCOL", 15, y, { color: TEAL, size: 14, style: "bold" });
  y += 5;
  doc.setDrawColor(...TEAL);
  doc.line(15, y, W - 15, y);
  y += 10;

  const protocol = [
    { time: "T-60 min", title: "Begin Wind-Down", desc: "Dim all screens. Switch devices to red-light/night mode. Start cooling your room to 65–68°F (18–20°C)." },
    { time: "T-45 min", title: "Blackout Your Space", desc: "Close blackout curtains. Cover all LED lights with tape. Use an eye mask if needed. Total darkness signals melatonin release." },
    { time: "T-30 min", title: "Warm Shower or Bath", desc: "A 10-minute warm shower drops your core temperature afterward, accelerating sleep onset by up to 36%." },
    { time: "T-20 min", title: "Recovery Nutrition", desc: `${decompressionBreakfast[diet].title}: ${decompressionBreakfast[diet].description} (${decompressionBreakfast[diet].calories} kcal). Tryptophan-rich foods aid melatonin production.` },
    { time: "T-10 min", title: "Breathing Protocol", desc: "4-7-8 breathing: Inhale 4s → Hold 7s → Exhale 8s. Repeat 4 cycles. Activates the parasympathetic nervous system." },
    { time: "T-0", title: "Lights Out", desc: "Phone on airplane mode or Do Not Disturb. White noise or earplugs. Aim for 7–9 hours of uninterrupted sleep." },
  ];

  protocol.forEach((step) => {
    if (y > 245) { doc.addPage(); bg(); y = 20; }
    card(15, y, W - 30, 28);
    text(step.time, 20, y + 7, { color: TEAL, size: 9, style: "bold" });
    text(step.title, 55, y + 7, { color: WHITE, size: 11, style: "bold" });

    // Word-wrap description
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(step.desc, W - 30 - 14);
    doc.setTextColor(...DIM);
    doc.text(lines.slice(0, 3), 20, y + 14);
    y += 33;
  });

  // Footer
  y += 5;
  if (y > 275) { doc.addPage(); bg(); y = 20; }
  doc.setDrawColor(...TEAL);
  doc.line(15, y, W - 15, y);
  y += 8;
  text("⚠️  This protocol is AI-generated for informational purposes only. Consult a healthcare professional.", 15, y, { color: DIM, size: 7 });
  y += 5;
  text("© 2026 Circadia. All rights reserved.", 15, y, { color: DIM, size: 7 });

  doc.save(`circadia-protocol-${diet}.pdf`);
}
