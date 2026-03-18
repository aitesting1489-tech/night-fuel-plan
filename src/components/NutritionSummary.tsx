import { Flame, Beef, Wheat, Droplet } from "lucide-react";
import { motion } from "framer-motion";

interface NutritionSummaryProps {
  totalCalories: number;
  loggedCalories: number;
}

const macroRatios = [
  { label: "Protein", icon: Beef, ratio: 0.30, calPerGram: 4, color: "text-primary" },
  { label: "Carbs", icon: Wheat, ratio: 0.45, calPerGram: 4, color: "text-energy" },
  { label: "Fats", icon: Droplet, ratio: 0.25, calPerGram: 9, color: "text-hydration" },
];

const NutritionSummary = ({ totalCalories, loggedCalories }: NutritionSummaryProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="rounded-xl bg-card/80 dreamy-blur border border-border p-4 space-y-4 neon-border"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-primary" />
          <span className="font-display text-sm font-semibold text-foreground">Nutrition Summary</span>
        </div>
        <span className="font-display text-sm text-muted-foreground">
          {loggedCalories} / {totalCalories} kcal
        </span>
      </div>

      <div className="h-2.5 rounded-full bg-muted overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
          initial={{ width: 0 }}
          animate={{ width: `${Math.min((loggedCalories / Math.max(totalCalories, 1)) * 100, 100)}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        {macroRatios.map(({ label, icon: Icon, ratio, calPerGram, color }) => {
          const totalG = Math.round((totalCalories * ratio) / calPerGram);
          const loggedG = Math.round((loggedCalories * ratio) / calPerGram);
          return (
            <div key={label} className="rounded-xl bg-muted/40 p-3 text-center space-y-1">
              <Icon className={`h-4 w-4 mx-auto ${color}`} />
              <p className="font-display text-xs font-medium text-muted-foreground">{label}</p>
              <p className="font-display text-sm font-semibold text-foreground">{loggedG}g</p>
              <p className="text-[10px] text-muted-foreground">of {totalG}g</p>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default NutritionSummary;
