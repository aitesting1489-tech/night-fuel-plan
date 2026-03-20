import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, Download, Sparkles, Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const ProUpsell = () => {
  const [unlocked, setUnlocked] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handleCheckout = async () => {
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout");
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      toast.error("Checkout failed. Please try again.");
      console.error(err);
    } finally {
      setProcessing(false);
    }
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
              onClick={handleCheckout}
              disabled={processing}
              className="w-full rounded-xl py-3 px-4 font-display font-semibold text-sm bg-secondary text-secondary-foreground flex items-center justify-center gap-2 hover:brightness-105 active:scale-[0.98] transition-all duration-200 glow-pink disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {processing ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  className="h-4 w-4 border-2 border-secondary-foreground/30 border-t-secondary-foreground rounded-full"
                />
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Unlock Pro — $9.99
                </>
              )}
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

    </>
  );
};

export default ProUpsell;
