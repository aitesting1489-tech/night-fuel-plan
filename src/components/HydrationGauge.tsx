import { motion } from "framer-motion";
import { Droplets } from "lucide-react";
import type { ReactNode } from "react";

interface HydrationGaugeProps {
  current: number;
  target: number;
  actions?: ReactNode;
}

const HydrationGauge = ({ current, target, actions }: HydrationGaugeProps) => {
  const percent = Math.min((current / target) * 100, 100);

  return (
    <div className="rounded-xl bg-card/80 dreamy-blur p-4 glow-hydration neon-border">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Droplets className="h-5 w-5 text-hydration" />
          <span className="font-display text-sm font-semibold text-foreground">Hydration</span>
        </div>
        <div className="flex items-center gap-2">
          {actions && <div className="flex gap-1.5">{actions}</div>}
          <span className="font-display text-sm text-muted-foreground whitespace-nowrap">
            {current}ml / {target}ml
          </span>
        </div>
      </div>
      <div className="h-2.5 rounded-full bg-muted overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-hydration"
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
    </div>
  );
};

export default HydrationGauge;
