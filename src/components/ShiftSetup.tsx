import { useState } from "react";
import { Moon, ArrowRight, Leaf, Vegan, Drumstick, Flame, BedDouble, Briefcase } from "lucide-react";
import { motion } from "framer-motion";
import type { DietType } from "@/lib/schedule";

export type ShiftMode = "on-shift" | "night-off";

interface ShiftSetupProps {
  onGenerate: (start: string, end: string, diet: DietType, shiftName: string, mode: ShiftMode) => void;
}

const presets = [
  { label: "Evening", start: "15:00", end: "23:00" },
  { label: "Night", start: "23:00", end: "07:00" },
  { label: "Graveyard", start: "00:00", end: "08:00" },
];

const diets: Array<{ value: DietType; label: string; icon: typeof Leaf }> = [
  { value: "standard", label: "Standard", icon: Drumstick },
  { value: "vegetarian", label: "Vegetarian", icon: Leaf },
  { value: "vegan", label: "Vegan", icon: Vegan },
  { value: "keto", label: "Keto", icon: Flame },
];

const ShiftSetup = ({ onGenerate }: ShiftSetupProps) => {
  const [mode, setMode] = useState<ShiftMode>("on-shift");
  const [start, setStart] = useState("22:00");
  const [end, setEnd] = useState("06:00");
  const [bedtime, setBedtime] = useState("23:00");
  const [diet, setDiet] = useState<DietType>("standard");
  const [shiftName, setShiftName] = useState("");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center min-h-screen px-4 py-12"
    >
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-primary/15 mb-2"
          >
            <Moon className="h-7 w-7 text-primary" />
          </motion.div>
          <h1 className="font-display text-3xl font-bold text-foreground tracking-tight neon-text">Circadia</h1>
          <p className="text-muted-foreground text-sm font-light">Fuel your shift with gentle nourishment. Set your hours below.</p>
        </div>

        {/* Mode Toggle */}
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Mode</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setMode("on-shift")}
              className={`rounded-xl border px-3 py-2.5 text-xs font-display font-medium transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 ${
                mode === "on-shift"
                  ? "border-primary/50 bg-primary/10 text-primary glow-primary"
                  : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:bg-primary/5"
              }`}
            >
              <Briefcase className="h-3.5 w-3.5" />
              On Shift
            </button>
            <button
              onClick={() => setMode("night-off")}
              className={`rounded-xl border px-3 py-2.5 text-xs font-display font-medium transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 ${
                mode === "night-off"
                  ? "border-primary/50 bg-primary/10 text-primary glow-primary"
                  : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:bg-primary/5"
              }`}
            >
              <BedDouble className="h-3.5 w-3.5" />
              Night Off
            </button>
          </div>
        </div>

        {mode === "on-shift" ? (
          <>
            {/* Shift Name */}
            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Shift name</p>
              <input
                type="text"
                value={shiftName}
                onChange={(e) => setShiftName(e.target.value)}
                placeholder="e.g. Monday Night, ER Rotation…"
                className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground font-body placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Quick presets</p>
              <div className="grid grid-cols-3 gap-2">
                {presets.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => { setStart(p.start); setEnd(p.end); }}
                    className={`rounded-xl border px-3 py-2.5 text-xs font-display font-medium transition-all duration-200 active:scale-95 ${
                      start === p.start && end === p.end
                        ? "border-primary/50 bg-primary/10 text-primary glow-primary"
                        : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:bg-primary/5"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Custom hours</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Shift start</label>
                  <input
                    type="time"
                    value={start}
                    onChange={(e) => setStart(e.target.value)}
                    className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground font-display focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Shift end</label>
                  <input
                    type="time"
                    value={end}
                    onChange={(e) => setEnd(e.target.value)}
                    className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground font-display focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Target bedtime</p>
            <input
              type="time"
              value={bedtime}
              onChange={(e) => setBedtime(e.target.value)}
              className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground font-display focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <p className="text-xs text-muted-foreground font-light">
              We'll build a meal & hydration plan to optimize your sleep.
            </p>
          </div>
        )}

        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Diet preference</p>
          <div className="grid grid-cols-2 gap-2">
            {diets.map((d) => {
              const Icon = d.icon;
              return (
                <button
                  key={d.value}
                  onClick={() => setDiet(d.value)}
                  className={`rounded-xl border px-3 py-2.5 text-xs font-display font-medium transition-all duration-200 active:scale-95 flex items-center gap-2 ${
                    diet === d.value
                      ? "border-primary/50 bg-primary/10 text-primary glow-primary"
                      : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:bg-primary/5"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {d.label}
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={() => {
            if (mode === "night-off") {
              onGenerate(bedtime, bedtime, diet, "Night Off", "night-off");
            } else {
              onGenerate(start, end, diet, shiftName, "on-shift");
            }
          }}
          className="w-full rounded-xl bg-primary py-3 px-4 font-display font-semibold text-sm text-primary-foreground flex items-center justify-center gap-2 hover:brightness-105 active:scale-[0.98] transition-all duration-200 glow-primary"
        >
          {mode === "night-off" ? "Generate Night Off Plan" : "Generate Schedule"} <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
};

export default ShiftSetup;
