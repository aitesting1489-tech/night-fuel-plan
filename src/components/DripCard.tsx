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
      className={`rounded-xl bg-card/80 dreamy-blur border p-4 transition-all duration-200 ${
        logged ? "border-hydration/40 glow-hydration" : "border-border neon-border"
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
        <motion.button
          onClick={onLog}
          whileTap={{ scale: 0.85 }}
          animate={logged ? { scale: [1, 1.25, 0.95, 1.05, 1] } : {}}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className={`shrink-0 h-10 w-10 rounded-xl flex items-center justify-center transition-colors duration-200 ${
            logged
              ? "bg-hydration/20 text-hydration"
              : "bg-muted text-muted-foreground hover:bg-hydration/10 hover:text-hydration"
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

export default DripCard;
