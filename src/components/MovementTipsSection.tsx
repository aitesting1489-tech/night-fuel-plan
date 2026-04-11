import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, ChevronDown, ChevronUp } from "lucide-react";
import { getTipsForContext, pickRandomTips, type MovementTip } from "@/lib/movementTips";

interface MovementTipsSectionProps {
  shiftFinished: boolean;
  /** 0 = early, 1 = mid, 2 = late shift */
  currentPhase?: number;
}

const MovementTipsSection = ({ shiftFinished, currentPhase = 1 }: MovementTipsSectionProps) => {
  const [expanded, setExpanded] = useState(false);

  const tips = useMemo(() => {
    if (shiftFinished) {
      return pickRandomTips(getTipsForContext("post-shift"), 3);
    }
    return pickRandomTips(getTipsForContext("during-shift", currentPhase), 3);
  }, [shiftFinished, currentPhase]);

  const sectionTitle = shiftFinished ? "Recovery & Rest Tips" : "Movement Reminders";
  const sectionSubtitle = shiftFinished
    ? "Help your body recover after the shift"
    : "Stay active to maintain energy";

  return (
    <div className="mt-4">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-card border border-border hover:bg-primary/5 transition-colors active:scale-[0.99]"
      >
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Activity className="h-4 w-4 text-primary" />
          </div>
          <div className="text-left">
            <p className="text-sm font-display font-semibold text-foreground">{sectionTitle}</p>
            <p className="text-[10px] text-muted-foreground">{sectionSubtitle}</p>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="space-y-2 pt-2">
              {tips.map((tip, i) => (
                <TipCard key={tip.id} tip={tip} index={i} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const TipCard = ({ tip, index }: { tip: MovementTip; index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.06, duration: 0.2 }}
    className="flex items-start gap-3 px-3 py-2.5 rounded-xl bg-card/60 border border-border/50"
  >
    <span className="text-lg mt-0.5 shrink-0">{tip.emoji}</span>
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-display font-semibold text-foreground">{tip.title}</p>
        {tip.durationMin && (
          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
            ~{tip.durationMin} min
          </span>
        )}
      </div>
      <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">{tip.body}</p>
    </div>
  </motion.div>
);

export default MovementTipsSection;
