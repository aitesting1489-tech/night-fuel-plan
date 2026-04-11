import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import mascotOwl from "@/assets/mascot-owl.png";
import { getRandomTip } from "@/lib/notifications";

interface MascotTipProps {
  show: boolean;
  onDismiss: () => void;
}

const MascotTip = ({ show, onDismiss }: MascotTipProps) => {
  const [tip, setTip] = useState("");

  useEffect(() => {
    if (show) setTip(getRandomTip());
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="fixed bottom-6 left-4 right-4 max-w-lg mx-auto z-50"
        >
          <div className="relative rounded-2xl bg-card border border-primary/30 shadow-lg shadow-primary/10 p-4 flex items-start gap-3">
            {/* Speech bubble pointer */}
            <div className="absolute -bottom-2 left-14 w-4 h-4 bg-card border-b border-r border-primary/30 rotate-45" />

            {/* Mascot */}
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="flex-shrink-0"
            >
              <img
                src={mascotOwl}
                alt="Noctis the owl mascot"
                width={56}
                height={56}
                className="drop-shadow-md"
              />
            </motion.div>

            {/* Tip content */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-display font-semibold text-primary mb-0.5">
                Noctis says...
              </p>
              <p className="text-sm text-foreground/90 leading-relaxed">
                {tip.replace(/^💡\s*/, "")}
              </p>
            </div>

            {/* Dismiss */}
            <button
              onClick={onDismiss}
              className="flex-shrink-0 h-6 w-6 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MascotTip;
