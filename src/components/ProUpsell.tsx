import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Download, Sparkles, X, CreditCard, Check } from "lucide-react";
import { toast } from "sonner";

const ProUpsell = () => {
  const [unlocked, setUnlocked] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handleMockCheckout = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setShowCheckout(false);
      setUnlocked(true);
      toast.success("Pro unlocked! Your PDF guide is ready.");
    }, 2000);
  };

  const handleDownload = () => {
    toast.success("Downloading your personalized PDF guide...");
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl bg-card/80 dreamy-blur border border-border neon-border p-5 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-accent/8 pointer-events-none" />

        <div className="relative space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="font-display text-sm font-semibold text-foreground">
              Pro Nutrition Guide
            </span>
          </div>

          <p className="text-xs text-muted-foreground font-light">
            Get a personalized PDF with detailed meal prep instructions, grocery lists, and macro breakdowns for your shift pattern.
          </p>

          <div className="relative">
            {!unlocked && (
              <div className="absolute inset-0 z-10 rounded-xl backdrop-blur-sm bg-background/40 flex items-center justify-center">
                <Lock className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
            <button
              onClick={unlocked ? handleDownload : undefined}
              disabled={!unlocked}
              className={`w-full rounded-xl py-3 px-4 font-display font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 ${
                unlocked
                  ? "bg-primary text-primary-foreground hover:brightness-105 active:scale-[0.98] glow-primary"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              }`}
            >
              <Download className="h-4 w-4" />
              Download PDF Guide
            </button>
          </div>

          {!unlocked && (
            <button
              onClick={() => setShowCheckout(true)}
              className="w-full rounded-xl py-3 px-4 font-display font-semibold text-sm bg-secondary text-secondary-foreground flex items-center justify-center gap-2 hover:brightness-105 active:scale-[0.98] transition-all duration-200 glow-pink"
            >
              <Sparkles className="h-4 w-4" />
              Unlock Pro — $4.99
            </button>
          )}

          {unlocked && (
            <div className="flex items-center justify-center gap-2 text-primary">
              <Check className="h-4 w-4" />
              <span className="font-display text-xs font-medium neon-text">Pro Unlocked</span>
            </div>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {showCheckout && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-background/60 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm rounded-2xl bg-card border border-border neon-border p-6 space-y-5 relative"
            >
              <button
                onClick={() => setShowCheckout(false)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="space-y-1">
                <h2 className="font-display text-lg font-bold text-foreground neon-text">
                  Checkout
                </h2>
                <p className="text-xs text-muted-foreground font-light">
                  Mock Stripe Payment
                </p>
              </div>

              <div className="rounded-xl bg-muted/40 p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground font-body">LunarFuel Pro Guide</span>
                  <span className="text-foreground font-display font-semibold">$4.99</span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between text-sm">
                  <span className="text-foreground font-body font-medium">Total</span>
                  <span className="text-primary font-display font-bold neon-text">$4.99</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground font-body">Card number</label>
                  <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2.5">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground font-body">
                      4242 4242 4242 4242
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground font-body">Expiry</label>
                    <div className="rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm text-muted-foreground font-body">
                      12/28
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground font-body">CVC</label>
                    <div className="rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm text-muted-foreground font-body">
                      •••
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleMockCheckout}
                disabled={processing}
                className="w-full rounded-xl py-3 px-4 font-display font-semibold text-sm bg-primary text-primary-foreground flex items-center justify-center gap-2 hover:brightness-105 active:scale-[0.98] transition-all duration-200 glow-primary disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {processing ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
                  />
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    Pay $4.99
                  </>
                )}
              </button>

              <p className="text-[10px] text-center text-muted-foreground font-light">
                This is a mock checkout. No real payment will be processed.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ProUpsell;
