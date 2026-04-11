import { motion } from "framer-motion";
import { Coffee, Moon, AlertTriangle, Sun, Sunrise, Activity } from "lucide-react";
import { type ShiftPhase } from "@/lib/schedule";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const iconMap = {
  coffee: Coffee,
  moon: Moon,
  "alert-triangle": AlertTriangle,
  sun: Sun,
  sunrise: Sunrise,
  activity: Activity,
};

interface ShiftTimelineProps {
  phases: ShiftPhase[];
  activePhase?: number;
}

const ShiftTimeline = ({ phases, activePhase = 0 }: ShiftTimelineProps) => {
  return (
    <div className="mb-6">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">
        Shift Timeline
      </p>
      <div className="relative">
        {/* Connecting line */}
        <div className="absolute left-[18px] top-5 bottom-5 w-[2px] bg-gradient-to-b from-primary/40 via-accent/30 to-secondary/40 rounded-full" />

        <div className="space-y-1">
          {phases.map((phase, i) => {
            const Icon = iconMap[phase.icon];
            const isActive = i <= activePhase;
            const isCrash = phase.isCrashAlert;
            const isMovement = phase.isMovementReminder;

            const node = (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08, duration: 0.25 }}
                className={`relative flex items-center gap-3 py-2.5 px-3 rounded-xl transition-all duration-200 ${
                  isCrash
                    ? "bg-destructive/8 border border-destructive/20"
                    : phase.isCaffeineCutoff
                    ? "bg-accent/10 border border-accent/20"
                    : isMovement
                    ? "bg-primary/5 border border-primary/15"
                    : "hover:bg-card/60"
                }`}
              >
                {/* Node dot */}
                <div
                  className={`relative z-10 flex items-center justify-center h-9 w-9 rounded-full shrink-0 transition-all ${
                    isActive
                      ? isCrash
                        ? "bg-destructive/15 text-destructive"
                        : phase.isCaffeineCutoff
                        ? "bg-accent/20 text-accent-foreground"
                        : "bg-primary/15 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-sm font-display font-semibold ${
                        isCrash ? "text-destructive" : "text-foreground"
                      }`}
                    >
                      {phase.label}
                    </span>
                    <span className="text-xs font-display text-muted-foreground whitespace-nowrap">
                      {phase.time}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground font-light mt-0.5 leading-relaxed">
                    {phase.description}
                  </p>
                </div>

                {isCrash && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold animate-pulse-glow">
                    !
                  </span>
                )}
              </motion.div>
            );

            if (isCrash) {
              return (
                <TooltipProvider key={i} delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>{node}</TooltipTrigger>
                    <TooltipContent
                      side="right"
                      className="max-w-[240px] bg-card/95 dreamy-blur border-destructive/30 text-foreground"
                    >
                      <p className="font-display font-semibold text-destructive text-xs mb-1">
                        ⚠️ Crash Alert — 3:00 AM
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {phase.description}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            }

            return node;
          })}
        </div>
      </div>
    </div>
  );
};

export default ShiftTimeline;
