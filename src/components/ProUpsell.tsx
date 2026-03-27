import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, Download, Sparkles, Check, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/analytics";
import { useAuth } from "@/contexts/AuthContext";

const ProUpsell = () => {
  const { user, isProSubscriber } = useAuth();
  const [processing, setProcessing] = useState(false);

  const handleCheckout = async () => {
    if (!user) {
      toast.error("Please sign in to subscribe");
      return;
    }
    setProcessing(true);
    trackEvent("begin_checkout", { value: 9.99, currency: "USD" });
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout");
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err: any) {
      toast.error("Checkout failed. Please try again.");
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  const handleManage = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err) {
      toast.error("Could not open subscription management.");
      console.error(err);
    }
  };

  const handleDownload = () => {
    toast.success("Downloading your personalized PDF guide...");
  };

  return (
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
          {!isProSubscriber && (
            <div className="absolute inset-0 z-10 rounded-xl backdrop-blur-sm bg-background/40 flex items-center justify-center">
              <Lock className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
          <button
            onClick={isProSubscriber ? handleDownload : undefined}
            disabled={!isProSubscriber}
            className={`w-full rounded-xl py-3 px-4 font-display font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 ${
              isProSubscriber
                ? "bg-primary text-primary-foreground hover:brightness-105 active:scale-[0.98] glow-primary"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            }`}
          >
            <Download className="h-4 w-4" />
            Download PDF Guide
          </button>
        </div>

        {!isProSubscriber && (
          <button
            onClick={handleCheckout}
            disabled={processing || !user}
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
                Subscribe Pro — $9.99/mo
              </>
            )}
          </button>
        )}

        {isProSubscriber && (
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 text-primary">
              <Check className="h-4 w-4" />
              <span className="font-display text-xs font-medium neon-text">Pro Active</span>
            </div>
            <button
              onClick={handleManage}
              className="w-full rounded-xl py-2 px-4 font-display text-xs text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5 transition-colors"
            >
              <CreditCard className="h-3.5 w-3.5" />
              Manage Subscription
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ProUpsell;
