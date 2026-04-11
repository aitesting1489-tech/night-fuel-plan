import { motion } from "framer-motion";
import mascotBat from "@/assets/mascot-bat.png";
import mascotBatFemale from "@/assets/mascot-bat-female.png";
import type { NoctisMood } from "./MascotTip";
import type { MascotGender } from "@/lib/mascotPrefs";

interface MiniNoctisProps {
  mood: NoctisMood;
  gender?: MascotGender;
  onClick?: () => void;
}

const moodEmoji: Record<NoctisMood, string> = {
  sleeping: "😴",
  worried: "😟",
  neutral: "🦇",
  happy: "😊",
  ecstatic: "🤩",
};

const moodRing: Record<NoctisMood, string> = {
  sleeping: "ring-muted-foreground/30",
  worried: "ring-amber-400/50",
  neutral: "ring-primary/40",
  happy: "ring-emerald-400/50",
  ecstatic: "ring-primary/60",
};

const MiniNoctis = ({ mood, gender = "boy", onClick }: MiniNoctisProps) => {
  const img = gender === "girl" ? mascotBatFemale : mascotBat;

  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.9 }}
      className={`relative h-9 w-9 rounded-xl ring-2 ${moodRing[mood]} bg-card border border-border flex items-center justify-center overflow-hidden transition-all hover:brightness-110`}
      title={`Noctis is ${mood}`}
    >
      <motion.img
        src={img}
        alt="Noctis"
        width={28}
        height={28}
        className={`object-contain transition-all duration-300 ${
          mood === "sleeping" ? "opacity-50 grayscale-[30%]" : ""
        }`}
        animate={
          mood === "ecstatic"
            ? { rotate: [0, -5, 5, -3, 3, 0] }
            : mood === "happy"
            ? { y: [0, -2, 0] }
            : {}
        }
        transition={{
          repeat: Infinity,
          duration: mood === "ecstatic" ? 0.8 : 1.5,
          ease: "easeInOut",
        }}
      />
      <span className="absolute -bottom-0.5 -right-0.5 text-[10px] leading-none">
        {moodEmoji[mood]}
      </span>
    </motion.button>
  );
};

export default MiniNoctis;
