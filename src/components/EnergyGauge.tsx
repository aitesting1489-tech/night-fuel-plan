import { motion } from "framer-motion";
import { Sun } from "lucide-react";

interface EnergyGaugeProps {
  level: number;
}

const EnergyGauge = ({ level }: EnergyGaugeProps) => {
  const label = level >= 70 ? "High" : level >= 40 ? "Moderate" : "Low";

  return (
    <div className="rounded-xl bg-card/80 dreamy-blur p-4 glow-primary neon-border">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Sun className="h-5 w-5 text-energy" />
          <span className="font-display text-sm font-semibold text-foreground">Energy Level</span>
        </div>
        <span className="font-display text-sm text-muted-foreground">{label}</span>
      </div>
      <div className="h-2.5 rounded-full bg-muted overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
          initial={{ width: 0 }}
          animate={{ width: `${level}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
    </div>
  );
};

export default EnergyGauge;
