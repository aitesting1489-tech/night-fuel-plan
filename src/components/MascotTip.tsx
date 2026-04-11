import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import mascotBat from "@/assets/mascot-bat.png";
import mascotBatFemale from "@/assets/mascot-bat-female.png";
import { getRandomTip } from "@/lib/notifications";

export type MascotGender = "boy" | "girl";

export type NoctisMood = "sleeping" | "worried" | "neutral" | "happy" | "ecstatic";

interface MascotTipProps {
  show: boolean;
  onDismiss: () => void;
  hydrationPercent?: number;
  energyLevel?: number;
  allChecked?: boolean;
  shiftFinished?: boolean;
  gender?: MascotGender;
}

function getMood(hydrationPercent: number, energyLevel: number, allChecked: boolean, shiftFinished: boolean): NoctisMood {
  if (shiftFinished || allChecked) return "ecstatic";
  if (hydrationPercent >= 75 && energyLevel >= 60) return "happy";
  if (hydrationPercent >= 40 || energyLevel >= 40) return "neutral";
  if (hydrationPercent >= 15) return "worried";
  return "sleeping";
}

const moodConfig: Record<NoctisMood, {
  messages: string[];
  label: string;
  emoji: string;
  bobSpeed: number;
  borderColor: string;
  glowColor: string;
  wiggle: number[];
}> = {
  sleeping: {
    messages: [
      "Zzz... wake me up with some water...",
      "I'm getting sleepy... hydrate to keep us both alert!",
      "Even bats need water to stay sharp at night...",
      "*yawns* ...a sip of water would really help right now.",
      "My wings are getting dry... drink something!",
    ],
    label: "Noctis is sleepy...",
    emoji: "😴",
    bobSpeed: 4,
    borderColor: "border-muted-foreground/30",
    glowColor: "shadow-muted/10",
    wiggle: [0, -1, 0],
  },
  worried: {
    messages: [
      "Hey, we're falling behind on hydration! Let's catch up.",
      "I'm a little worried — your water intake is low.",
      "Don't forget about me! I mean... your water.",
      "My sonar is picking up dehydration... you need more fluids!",
      "We're in this together — grab a drink for both of us!",
    ],
    label: "Noctis is concerned...",
    emoji: "😟",
    bobSpeed: 2.5,
    borderColor: "border-amber-400/40",
    glowColor: "shadow-amber-400/10",
    wiggle: [0, -3, 1, -2, 0],
  },
  neutral: {
    messages: [
      "Doing alright! Keep that water flowing.",
      "Steady pace — you've got this, night bat!",
      "Not bad! A few more sips and we're cruising.",
      "The night is young and so are your hydration levels!",
      "Pro tip: consistency beats chugging. Sip steadily!",
    ],
    label: "Noctis says...",
    emoji: "🦇",
    bobSpeed: 2,
    borderColor: "border-primary/30",
    glowColor: "shadow-primary/10",
    wiggle: [0, -4, 0],
  },
  happy: {
    messages: [
      "Now we're talking! Your hydration is looking great!",
      "I'm one happy bat! Keep up the amazing work!",
      "You're crushing it tonight — hydration hero! 💪",
      "My wings are practically glowing! Just like your health!",
      "This is what peak night shift performance looks like!",
    ],
    label: "Noctis is happy!",
    emoji: "😊",
    bobSpeed: 1.5,
    borderColor: "border-emerald-400/40",
    glowColor: "shadow-emerald-400/15",
    wiggle: [0, -6, 2, -4, 0],
  },
  ecstatic: {
    messages: [
      "INCREDIBLE! You've completed everything! I'm so proud! 🎉",
      "YOU DID IT! Best shift partner a bat could ask for!",
      "✨ Perfect score! I'm doing little bat flips!",
      "I'm literally squeaking with joy! What a shift!",
      "Champion of the night! Take a bow — you earned it!",
    ],
    label: "Noctis is ECSTATIC!",
    emoji: "🤩",
    bobSpeed: 1,
    borderColor: "border-primary/50",
    glowColor: "shadow-primary/20",
    wiggle: [0, -8, 3, -6, 2, -4, 0],
  },
};

const MascotTip = ({
  show,
  onDismiss,
  hydrationPercent = 0,
  energyLevel = 0,
  allChecked = false,
  shiftFinished = false,
  gender = "boy",
}: MascotTipProps) => {
  const [message, setMessage] = useState("");
  const [useRandomTip, setUseRandomTip] = useState(false);

  const mood = useMemo(
    () => getMood(hydrationPercent, energyLevel, allChecked, shiftFinished),
    [hydrationPercent, energyLevel, allChecked, shiftFinished]
  );

  const config = moodConfig[mood];

  useEffect(() => {
    if (!show) return;
    // 40% chance of a general wellness tip, 60% mood-based message
    const showTip = Math.random() < 0.4 && mood !== "ecstatic";
    setUseRandomTip(showTip);
    if (!showTip) {
      const msgs = config.messages;
      setMessage(msgs[Math.floor(Math.random() * msgs.length)]);
    }
  }, [show, mood, config.messages]);

  const displayText = useRandomTip ? getRandomTip().replace(/^🦇\s*/, "") : message;

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
          <div className={`relative rounded-2xl bg-card border ${config.borderColor} shadow-lg ${config.glowColor} p-4 flex items-start gap-3`}>
            {/* Speech bubble pointer */}
            <div className={`absolute -bottom-2 left-14 w-4 h-4 bg-card border-b border-r ${config.borderColor} rotate-45`} />

            {/* Mascot with mood-based animation */}
            <motion.div
              animate={{ y: config.wiggle }}
              transition={{
                repeat: Infinity,
                duration: config.bobSpeed,
                ease: "easeInOut",
              }}
              className="flex-shrink-0 relative"
            >
              <img
                src={gender === "girl" ? mascotBatFemale : mascotBat}
                alt={`Noctis the bat mascot`}
                width={56}
                height={56}
                className={`drop-shadow-md transition-all duration-500 ${
                  mood === "sleeping" ? "opacity-60 grayscale-[30%]" :
                  mood === "ecstatic" ? "scale-110" : ""
                }`}
              />
              {/* Mood emoji overlay */}
              <motion.span
                key={mood}
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                className="absolute -top-1 -right-1 text-lg"
              >
                {config.emoji}
              </motion.span>

              {/* Ecstatic sparkles */}
              {mood === "ecstatic" && (
                <>
                  <motion.span
                    animate={{ opacity: [0, 1, 0], y: [0, -10], x: [0, -5] }}
                    transition={{ repeat: Infinity, duration: 1, delay: 0 }}
                    className="absolute -top-2 left-0 text-xs"
                  >✨</motion.span>
                  <motion.span
                    animate={{ opacity: [0, 1, 0], y: [0, -8], x: [0, 5] }}
                    transition={{ repeat: Infinity, duration: 1, delay: 0.3 }}
                    className="absolute -top-1 right-0 text-xs"
                  >⭐</motion.span>
                  <motion.span
                    animate={{ opacity: [0, 1, 0], y: [0, -12] }}
                    transition={{ repeat: Infinity, duration: 1, delay: 0.6 }}
                    className="absolute -top-3 left-1/2 text-xs"
                  >💫</motion.span>
                </>
              )}
            </motion.div>

            {/* Tip content */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-display font-semibold text-primary mb-0.5">
                {config.label}
              </p>
              <p className="text-sm text-foreground/90 leading-relaxed">
                {displayText}
              </p>
              {/* Hydration progress micro-bar */}
              {!shiftFinished && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(hydrationPercent, 100)}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className={`h-full rounded-full ${
                        hydrationPercent >= 75 ? "bg-emerald-400" :
                        hydrationPercent >= 40 ? "bg-primary" :
                        hydrationPercent >= 15 ? "bg-amber-400" :
                        "bg-muted-foreground"
                      }`}
                    />
                  </div>
                  <span className="text-[10px] font-medium text-muted-foreground">
                    {Math.round(hydrationPercent)}%
                  </span>
                </div>
              )}
            </div>

            {/* Dismiss */}
            <button
              onClick={onDismiss}
              className="flex-shrink-0 h-6 w-6 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors active:scale-90"
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
