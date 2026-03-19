import { motion } from "framer-motion";
import { ArrowLeft, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Privacy = () => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen px-4 py-8 max-w-lg mx-auto"
    >
      <button
        onClick={() => navigate(-1)}
        className="h-9 w-9 rounded-xl bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-primary/5 transition-colors active:scale-95 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center">
          <Shield className="h-5 w-5 text-primary" />
        </div>
        <h1 className="font-display text-2xl font-bold text-foreground">Privacy Policy</h1>
      </div>

      <p className="text-xs text-muted-foreground font-light mb-6">
        Last updated: March 2026 · GDPR & CCPA compliant
      </p>

      <div className="space-y-6">
        <section className="rounded-xl border border-border bg-card/80 dreamy-blur p-4 space-y-2">
          <h2 className="font-display text-sm font-semibold text-foreground">Data Collection</h2>
          <p className="text-xs text-muted-foreground font-light leading-relaxed">
            We collect your shift times and meal preferences solely to generate your personalized nutrition schedule. No additional personal data is collected or stored beyond what is necessary for the core functionality of the app.
          </p>
        </section>

        <section className="rounded-xl border border-border bg-card/80 dreamy-blur p-4 space-y-2">
          <h2 className="font-display text-sm font-semibold text-foreground">AI Processing</h2>
          <p className="text-xs text-muted-foreground font-light leading-relaxed">
            Your data is processed by AI models to create personalized nutrition and hydration recommendations. We do not sell your health-related data to third parties. All processing is done in accordance with applicable data protection regulations.
          </p>
        </section>

        <section className="rounded-xl border border-border bg-card/80 dreamy-blur p-4 space-y-2">
          <h2 className="font-display text-sm font-semibold text-foreground">Your Rights</h2>
          <p className="text-xs text-muted-foreground font-light leading-relaxed">
            You can request a full export of your data or its immediate deletion at any time via the settings menu. Under GDPR and CCPA, you have the right to access, rectify, and erase your personal data, as well as the right to data portability.
          </p>
        </section>

        <section className="rounded-xl border border-border bg-card/80 dreamy-blur p-4 space-y-2">
          <h2 className="font-display text-sm font-semibold text-foreground">Sensitive Information</h2>
          <p className="text-xs text-muted-foreground font-light leading-relaxed">
            We do not collect medical records or biometric data. Circadia only processes the shift schedule and dietary preference information you voluntarily provide.
          </p>
        </section>
      </div>

      <p className="text-center text-[10px] text-muted-foreground/50 mt-8 mb-4 font-light">
        © 2026 Circadia. All rights reserved.
      </p>
    </motion.div>
  );
};

export default Privacy;
