import { motion } from "framer-motion";
import { Check, Droplets } from "lucide-react";

interface DripCardProps {
  time: string;
  amount: number;
  logged: boolean;
  onLog: () => void;
}

const DripCard = ({ time, amount, logged, onLog }: DripCardProps) => {
  return (
    <motion.div
      layout
      className={`rounded-lg bg-card border p-4 transition-colors duration-150 ${
        logged ? "border-hydration/40 glow-hydration" : "border-border"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Droplets className="h-4 w-4 text-hydration shrink-0" />
          <div>
            <span className="font-display text-xs font-medium text-muted-foreground">{time}</span>
            <p className="font-display font-semibold text-foreground text-sm">{amount}ml Water</p>
          </div>
        </div>
        <button
          onClick={onLog}
          className={`shrink-0 h-10 w-10 rounded-lg flex items-center justify-center transition-all duration-150 ${
            logged
              ? "bg-hydration/20 text-hydration"
              : "bg-muted text-muted-foreground hover:bg-muted/80 active:scale-95"
          }`}
        >
          <Check className="h-5 w-5" />
        </button>
      </div>
    </motion.div>
  );
};

export default DripCard;
