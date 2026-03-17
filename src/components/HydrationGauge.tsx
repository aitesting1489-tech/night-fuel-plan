import { motion } from "framer-motion";
import { Droplets } from "lucide-react";

interface HydrationGaugeProps {
  current: number;
  target: number;
}

const HydrationGauge = ({ current, target }: HydrationGaugeProps) => {
  const percent = Math.min((current / target) * 100, 100);

  return (
    <div className="rounded-lg bg-card p-4 glow-hydration neon-border">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Droplets className="h-5 w-5 text-hydration" />
          <span className="font-display text-sm font-semibold text-foreground">Hydration</span>
        </div>
        <span className="font-display text-sm text-muted-foreground">
          {current}ml / {target}ml
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-hydration"
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  );
};

export default HydrationGauge;
