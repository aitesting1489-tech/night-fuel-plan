import { motion } from "framer-motion";
import { Check, Coffee } from "lucide-react";

interface FuelCardProps {
  time: string;
  title: string;
  description: string;
  calories: number;
  logged: boolean;
  onLog: () => void;
}

const FuelCard = ({ time, title, description, calories, logged, onLog }: FuelCardProps) => {
  return (
    <motion.div
      layout
      className={`rounded-lg bg-card border p-4 transition-colors duration-150 ${
        logged ? "border-nutrition/40 glow-nutrition" : "border-border neon-border"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Coffee className="h-4 w-4 text-nutrition shrink-0" />
            <span className="font-display text-xs font-medium text-muted-foreground">{time}</span>
          </div>
          <h3 className="font-display font-semibold text-foreground text-sm truncate">{title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          <span className="text-xs text-nutrition font-medium">{calories} kcal</span>
        </div>
        <button
          onClick={onLog}
          className={`shrink-0 h-10 w-10 rounded-lg flex items-center justify-center transition-all duration-150 ${
            logged
              ? "bg-nutrition/20 text-nutrition"
              : "bg-muted text-muted-foreground hover:bg-muted/80 active:scale-95"
          }`}
        >
          <Check className="h-5 w-5" />
        </button>
      </div>
    </motion.div>
  );
};

export default FuelCard;
