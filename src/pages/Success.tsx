import { motion } from "framer-motion";
import { CheckCircle2, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Starfield from "@/components/Starfield";

const Success = () => {
  const navigate = useNavigate();

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
          <div className="flex justify-center">
            <CheckCircle2 className="h-12 w-12 text-primary" />
          </div>
          <h1 className="font-display text-xl font-bold text-foreground">
            Pro Unlocked! 🎉
          </h1>
          <p className="text-sm text-muted-foreground font-light">
            Your payment was successful. You now have access to the Circadia Pro Guide with personalized meal prep, grocery lists, and macro breakdowns.
          </p>
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
