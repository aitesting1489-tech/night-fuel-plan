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
      className={`rounded-xl bg-card/80 dreamy-blur border p-4 transition-all duration-200 ${
        logged ? "border-primary/40 glow-nutrition" : "border-border neon-border"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Coffee className="h-4 w-4 text-primary shrink-0" />
            <span className="font-display text-xs font-medium text-muted-foreground">{time}</span>
          </div>
          <h3 className="font-display font-semibold text-foreground text-sm truncate">{title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5 font-light">{description}</p>
          <span className="text-xs text-primary font-medium">{calories} kcal</span>
        </div>
        <motion.button
          onClick={onLog}
          whileTap={{ scale: 0.85 }}
          animate={logged ? { scale: [1, 1.25, 0.95, 1.05, 1] } : {}}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className={`shrink-0 h-10 w-10 rounded-xl flex items-center justify-center transition-colors duration-200 ${
            logged
              ? "bg-primary/20 text-primary"
              : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary"
          }`}
        >
          <motion.div
            animate={logged ? { rotate: [0, -10, 10, -5, 0] } : { rotate: 0 }}
            transition={{ duration: 0.35, delay: 0.05 }}
          >
            <Check className="h-5 w-5" />
          </motion.div>
        </motion.button>
      </div>
    </motion.div>
  );
};

export default FuelCard;
