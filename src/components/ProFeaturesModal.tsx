import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, X, Activity, Moon, Sparkles, Zap, Shield, ChevronRight } from "lucide-react";

const eliteFeatures = [
  { icon: Activity, label: "Apple Health Sync", desc: "Auto-log meals & hydration to HealthKit" },
  { icon: Moon, label: "The Blackout Sleep Protocol", desc: "AI-guided wind-down routine for deep recovery" },
  { icon: Zap, label: "Real-Time Energy Coaching", desc: "Adaptive alerts based on your shift fatigue curve" },
  { icon: Shield, label: "Allergy & Medication Guard", desc: "Cross-checks meals against your profile" },
];

const ProFeaturesModal = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-xl border border-primary/20 bg-primary/5 py-3 px-4 font-display font-semibold text-sm text-primary flex items-center justify-center gap-2 hover:bg-primary/10 active:scale-[0.98] transition-all duration-200"
      >
        <Crown className="h-4 w-4" />
        Pro Features
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-background/70 backdrop-blur-md"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 16 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm relative"
            >
              {/* Glowing border wrapper */}
              <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-primary via-accent to-primary opacity-60 blur-[2px] animate-pulse-glow" />
              <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-primary via-accent to-primary opacity-30" />

              <div className="relative rounded-2xl bg-card border border-primary/20 p-6 space-y-5">
                <button
                  onClick={() => setOpen(false)}
                  className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>

                {/* Header */}
                <div className="text-center space-y-2 pt-1">
                  <motion.div
                    animate={{ y: [0, -3, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-primary/15 mx-auto"
                  >
                    <Crown className="h-6 w-6 text-primary" />
                  </motion.div>
                  <h2 className="font-display text-xl font-bold text-foreground neon-text">
                    Circadia Elite
                  </h2>
                  <p className="text-xs text-muted-foreground font-light">
                    Unlock the full power of your night shift routine
                  </p>
                </div>

                {/* Price */}
                <div className="text-center">
                  <span className="font-display text-3xl font-bold text-foreground">$9.99</span>
                  <span className="text-sm text-muted-foreground font-light">/month</span>
                </div>

                {/* Features */}
                <div className="space-y-2">
                  {eliteFeatures.map(({ icon: Icon, label, desc }) => (
                    <div
                      key={label}
                      className="flex items-start gap-3 rounded-xl bg-muted/30 p-3 transition-colors hover:bg-muted/50"
                    >
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-display text-sm font-semibold text-foreground">{label}</p>
                        <p className="text-xs text-muted-foreground font-light leading-relaxed">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <button className="w-full rounded-xl bg-primary py-3 px-4 font-display font-semibold text-sm text-primary-foreground flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all duration-200 glow-primary">
                  <Sparkles className="h-4 w-4" />
                  Start Free Trial
                  <ChevronRight className="h-4 w-4" />
                </button>

                <p className="text-[10px] text-center text-muted-foreground/50 font-light">
                  7-day free trial · Cancel anytime · Mock only
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ProFeaturesModal;
