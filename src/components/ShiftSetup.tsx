import { useState } from "react";
import { Moon, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

interface ShiftSetupProps {
  onGenerate: (start: string, end: string) => void;
}

const presets = [
  { label: "Evening", start: "18:00", end: "02:00" },
  { label: "Night", start: "22:00", end: "06:00" },
  { label: "Graveyard", start: "00:00", end: "08:00" },
];

const ShiftSetup = ({ onGenerate }: ShiftSetupProps) => {
  const [start, setStart] = useState("22:00");
  const [end, setEnd] = useState("06:00");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center min-h-screen px-4 py-12"
    >
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-energy/10 mb-2">
            <Moon className="h-7 w-7 text-energy" />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground tracking-tight">LunarFuel</h1>
          <p className="text-muted-foreground text-sm">Fuel your night shift. Set your hours to generate a custom schedule.</p>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Quick presets</p>
          <div className="grid grid-cols-3 gap-2">
            {presets.map((p) => (
              <button
                key={p.label}
                onClick={() => { setStart(p.start); setEnd(p.end); }}
                className={`rounded-lg border px-3 py-2 text-xs font-display font-medium transition-all duration-150 active:scale-95 ${
                  start === p.start && end === p.end
                    ? "border-energy/50 bg-energy/10 text-energy"
                    : "border-border bg-card text-muted-foreground hover:border-energy/30"
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
                className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground font-display focus:outline-none focus:ring-2 focus:ring-energy/50"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Shift end</label>
              <input
                type="time"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground font-display focus:outline-none focus:ring-2 focus:ring-energy/50"
              />
            </div>
          </div>
        </div>

        <button
          onClick={() => onGenerate(start, end)}
          className="w-full rounded-lg bg-energy py-3 px-4 font-display font-semibold text-sm text-primary-foreground flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all duration-150 glow-primary"
        >
          Generate Schedule <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
};

export default ShiftSetup;
