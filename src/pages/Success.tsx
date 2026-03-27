import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, ArrowLeft, Loader2 } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { trackEvent } from "@/lib/analytics";
import { useAuth } from "@/contexts/AuthContext";
import Starfield from "@/components/Starfield";

const Success = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { checkSubscription } = useAuth();
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (!sessionId) {
      setVerifying(false);
      return;
    }

    const verify = async () => {
      try {
        await checkSubscription();
        setVerified(true);
        trackEvent("purchase", { value: 9.99, currency: "USD", transaction_id: sessionId });
      } catch (err) {
        console.error("Subscription check failed:", err);
      } finally {
        setVerifying(false);
      }
    };

    verify();
  }, [searchParams, checkSubscription]);

  return (
    <>
      <Starfield />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="min-h-screen flex flex-col items-center justify-center px-4 text-center"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="rounded-2xl bg-card/80 border border-border p-8 max-w-sm w-full space-y-5"
        >
          {verifying ? (
            <>
              <div className="flex justify-center">
                <Loader2 className="h-12 w-12 text-primary animate-spin" />
              </div>
              <h1 className="font-display text-xl font-bold text-foreground">
                Verifying Subscription...
              </h1>
              <p className="text-sm text-muted-foreground font-light">
                Confirming your subscription with Stripe.
              </p>
            </>
          ) : verified ? (
            <>
              <div className="flex justify-center">
                <CheckCircle2 className="h-12 w-12 text-primary" />
              </div>
              <h1 className="font-display text-xl font-bold text-foreground">
                Welcome to Pro! 🎉
              </h1>
              <p className="text-sm text-muted-foreground font-light">
                Your subscription is active. You now have access to all Circadia Pro features including personalized meal prep, grocery lists, and macro breakdowns.
              </p>
            </>
          ) : (
            <>
              <div className="flex justify-center">
                <CheckCircle2 className="h-12 w-12 text-muted-foreground" />
              </div>
              <h1 className="font-display text-xl font-bold text-foreground">
                Subscription Not Confirmed
              </h1>
              <p className="text-sm text-muted-foreground font-light">
                We couldn't verify your subscription. If you just completed checkout, please wait a moment and refresh. Contact support if the issue persists.
              </p>
            </>
          )}
          <button
            onClick={() => navigate("/")}
            className="w-full rounded-xl py-3 px-4 font-display font-semibold text-sm bg-primary text-primary-foreground flex items-center justify-center gap-2 hover:brightness-105 active:scale-[0.98] transition-all duration-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>
        </motion.div>
      </motion.div>
    </>
  );
};

export default Success;
