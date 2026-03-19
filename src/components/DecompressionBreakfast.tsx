import { motion, AnimatePresence } from "framer-motion";
import { Sun, X, UtensilsCrossed } from "lucide-react";
import type { DietType } from "@/lib/schedule";
import { decompressionBreakfast } from "@/lib/schedule";

interface DecompressionBreakfastProps {
  show: boolean;
  diet: DietType;
  onDismiss: () => void;
}

const DecompressionBreakfast = ({ show, diet, onDismiss }: DecompressionBreakfastProps) => {
  const meal = decompressionBreakfast[diet];

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed inset-x-4 bottom-6 z-50 max-w-lg mx-auto"
        >
          <div className="relative rounded-2xl border border-primary/20 bg-card/90 dreamy-blur p-5 glow-primary">
            <button
              onClick={onDismiss}
              className="absolute top-3 right-3 h-7 w-7 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>

            <div className="flex items-start gap-4">
              <div className="h-11 w-11 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                <Sun className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-display font-semibold text-foreground text-sm mb-1">
                  {meal.title} 🌅
                </p>
                <p className="text-xs text-muted-foreground font-light leading-relaxed mb-2">
                  {meal.description}
                </p>
                <div className="flex items-center gap-2">
                  <UtensilsCrossed className="h-3 w-3 text-primary" />
                  <span className="text-xs font-display font-medium text-primary">
                    {meal.calories} kcal
                  </span>
                </div>
              </div>
            </div>

            <p className="text-[10px] text-muted-foreground/60 text-center mt-3 font-light">
              Great job finishing your shift! Here's your recovery meal.
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DecompressionBreakfast;
