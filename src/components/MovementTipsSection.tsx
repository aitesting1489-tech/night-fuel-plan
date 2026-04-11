import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, ChevronDown, ChevronUp, Flame, Check } from "lucide-react";
import { getTipsForContext, pickRandomTips, type MovementTip } from "@/lib/movementTips";
import { useMovementStreak } from "@/hooks/useMovementStreak";
import { useAuth } from "@/contexts/AuthContext";

interface MovementTipsSectionProps {
  shiftFinished: boolean;
  /** 0 = early, 1 = mid, 2 = late shift */
  currentPhase?: number;
  /** True when shown on the Night Off / rest day dashboard */
  isRestDay?: boolean;
}

const MovementTipsSection = ({ shiftFinished, currentPhase = 1, isRestDay = false }: MovementTipsSectionProps) => {
  const [expanded, setExpanded] = useState(false);
  const { user } = useAuth();
  const { streak, todayCompleted, logTip, unlogTip, hasTodayActivity } = useMovementStreak();

  const tips = useMemo(() => {
    if (isRestDay) {
      return pickRandomTips(getTipsForContext("rest-day"), 3);
    }
    if (shiftFinished) {
      return pickRandomTips(getTipsForContext("post-shift"), 3);
    }
    return pickRandomTips(getTipsForContext("during-shift", currentPhase), 3);
  }, [shiftFinished, currentPhase, isRestDay]);

  const sectionTitle = isRestDay ? "Rest Day Wellness" : shiftFinished ? "Recovery & Rest Tips" : "Movement Reminders";
  const sectionSubtitle = isRestDay
    ? "Reset your body & rhythm on your day off"
    : shiftFinished
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
        <div className="flex items-center gap-2">
          {/* Streak badge */}
          {streak > 0 && (
            <div className="flex items-center gap-1 bg-primary/10 rounded-lg px-2 py-1">
              <Flame className="h-3 w-3 text-primary" />
              <span className="text-[10px] font-display font-bold text-primary">{streak}</span>
            </div>
          )}
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
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
            {/* Streak info bar */}
            <div className="flex items-center justify-between px-3 py-2 mt-2 rounded-lg bg-primary/5 border border-primary/10">
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-primary" />
                <span className="text-xs font-display font-semibold text-foreground">
                  {streak > 0 ? `${streak}-day movement streak!` : "Start your streak today!"}
                </span>
              </div>
              {hasTodayActivity && (
                <span className="text-[10px] text-primary font-semibold flex items-center gap-0.5">
                  <Check className="h-3 w-3" /> Today ✓
                </span>
              )}
            </div>

            <div className="space-y-2 pt-2">
              {tips.map((tip, i) => (
                <TipCard
                  key={tip.id}
                  tip={tip}
                  index={i}
                  completed={todayCompleted.includes(tip.id)}
                  onToggle={() => {
                    if (!user) return;
                    if (todayCompleted.includes(tip.id)) {
                      unlogTip(tip.id);
                    } else {
                      logTip(tip.id);
                    }
                  }}
                  canToggle={!!user}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface TipCardProps {
  tip: MovementTip;
  index: number;
  completed: boolean;
  onToggle: () => void;
  canToggle: boolean;
}

const TipCard = ({ tip, index, completed, onToggle, canToggle }: TipCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.06, duration: 0.2 }}
    className={`flex items-start gap-3 px-3 py-2.5 rounded-xl border transition-colors ${
      completed
        ? "bg-primary/5 border-primary/20"
        : "bg-card/60 border-border/50"
    }`}
  >
    {canToggle && (
      <button
        onClick={onToggle}
        className={`mt-1 h-5 w-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all active:scale-90 ${
          completed
            ? "bg-primary border-primary text-primary-foreground"
            : "border-muted-foreground/30 hover:border-primary/50"
        }`}
      >
        {completed && <Check className="h-3 w-3" />}
      </button>
    )}
    <span className="text-lg mt-0.5 shrink-0">{tip.emoji}</span>
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between gap-2">
        <p className={`text-xs font-display font-semibold ${completed ? "text-primary" : "text-foreground"}`}>
          {tip.title}
        </p>
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
