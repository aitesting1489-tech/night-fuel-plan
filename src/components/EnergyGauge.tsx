import { motion } from "framer-motion";
import { Sun } from "lucide-react";

interface EnergyGaugeProps {
  level: number; // 0-100
}

const EnergyGauge = ({ level }: EnergyGaugeProps) => {
  const label = level >= 70 ? "High" : level >= 40 ? "Moderate" : "Low";

  return (
    <div className="rounded-lg bg-card p-4 glow-primary">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Sun className="h-5 w-5 text-energy" />
          <span className="font-display text-sm font-semibold text-foreground">Energy Level</span>
        </div>
        <span className="font-display text-sm text-muted-foreground">{label}</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-energy"
          initial={{ width: 0 }}
          animate={{ width: `${level}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  );
};

export default EnergyGauge;
