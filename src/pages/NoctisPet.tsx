import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Droplets, Utensils, Heart, Star, Sparkles, TrendingUp, Gamepad2, Swords } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useWaterSettings } from "@/hooks/useWaterSettings";
import { getMascotGender } from "@/lib/mascotPrefs";
import mascotBat from "@/assets/mascot-bat.png";
import mascotBatFemale from "@/assets/mascot-bat-female.png";
import Starfield from "@/components/Starfield";
import SocialShare from "@/components/SocialShare";

// ── Evolution stages ──
const STAGES = [
  { name: "Hatchling", minXP: 0, emoji: "🥚", size: 64 },
  { name: "Fledgling", minXP: 50, emoji: "🐣", size: 80 },
  { name: "Night Scout", minXP: 200, emoji: "⭐", size: 96 },
  { name: "Moon Guardian", minXP: 500, emoji: "🌙", size: 112 },
  { name: "Star Keeper", minXP: 1200, emoji: "✨", size: 128 },
  { name: "Celestial Bat", minXP: 3000, emoji: "👑", size: 140 },
];

function getStage(xp: number) {
  for (let i = STAGES.length - 1; i >= 0; i--) {
    if (xp >= STAGES[i].minXP) return { ...STAGES[i], index: i };
  }
  return { ...STAGES[0], index: 0 };
}

function getNextStage(xp: number) {
  const current = getStage(xp);
  if (current.index >= STAGES.length - 1) return null;
  return STAGES[current.index + 1];
}

// ── Mood based on stats ──
type PetMood = "starving" | "sleepy" | "okay" | "happy" | "ecstatic";

function getPetMood(hunger: number, hydration: number, streak: number): PetMood {
  const avg = (hunger + hydration) / 2;
  if (avg < 20) return "starving";
  if (avg < 40) return "sleepy";
  if (avg < 65) return "okay";
  if (streak >= 3 && avg >= 80) return "ecstatic";
  return "happy";
}

const moodMessages: Record<PetMood, string[]> = {
  starving: [
    "I'm so hungry and thirsty... please help! 🥺",
    "My wings feel so heavy... need water...",
    "I can barely keep my eyes open without fuel...",
  ],
  sleepy: [
    "Mmm... a little snack would be nice...",
    "I could use some water to perk up...",
    "*yawns* Feed me and I'll do a flip!",
  ],
  okay: [
    "I'm doing alright! Keep it up!",
    "Not bad, but I know you can do better! 💪",
    "A few more sips and I'll be flying high!",
  ],
  happy: [
    "Yay! I feel great! You're the best! 🎉",
    "My wings are tingling with energy!",
    "This is what peak bat performance feels like!",
  ],
  ecstatic: [
    "I'M ON TOP OF THE MOON! 🌙✨",
    "BEST. PARTNER. EVER! *happy bat noises*",
    "I could fly to the stars and back! 🚀",
  ],
};

const moodEmoji: Record<PetMood, string> = {
  starving: "😫",
  sleepy: "😴",
  okay: "🙂",
  happy: "😊",
  ecstatic: "🤩",
};

// ── Stat bar component ──
const StatBar = ({ label, value, icon: Icon, color }: { label: string; value: number; icon: typeof Droplets; color: string }) => (
  <div className="space-y-1">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        <Icon className={`h-3.5 w-3.5 ${color}`} />
        <span className="text-xs font-display font-medium text-foreground">{label}</span>
      </div>
      <span className="text-xs font-semibold text-muted-foreground">{Math.round(value)}%</span>
    </div>
    <div className="h-2 rounded-full bg-muted overflow-hidden">
      <motion.div
        className={`h-full rounded-full ${
          value >= 70 ? "bg-emerald-400" : value >= 40 ? "bg-amber-400" : "bg-destructive"
        }`}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(value, 100)}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
    </div>
  </div>
);

const NoctisPet = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { effectiveGoal } = useWaterSettings();
  const gender = getMascotGender();
  const mascotImg = gender === "girl" ? mascotBatFemale : mascotBat;

  const [hydrationToday, setHydrationToday] = useState(0);
  const [streakDays, setStreakDays] = useState(0);
  const [totalLogs, setTotalLogs] = useState(0);
  const [achievements, setAchievements] = useState(0);
  const [petting, setPetting] = useState(false);
  const [petMessage, setPetMessage] = useState("");

  // Fetch real data
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      // Today's hydration
      const { data: todayLogs } = await supabase
        .from("hydration_logs")
        .select("amount_ml")
        .eq("user_id", user.id)
        .gte("logged_at", todayStart.toISOString());

      const todayTotal = todayLogs?.reduce((s, l) => s + l.amount_ml, 0) || 0;
      setHydrationToday(todayTotal);

      // Streak calculation
      const { data: allLogs } = await supabase
        .from("hydration_logs")
        .select("logged_at, amount_ml")
        .eq("user_id", user.id)
        .order("logged_at", { ascending: false })
        .limit(100);

      if (allLogs && allLogs.length > 0) {
        setTotalLogs(allLogs.length);
        // Count consecutive days with logs
        let streak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        for (let d = 0; d < 60; d++) {
          const checkDate = new Date(today);
          checkDate.setDate(checkDate.getDate() - d);
          const dayStr = checkDate.toISOString().slice(0, 10);
          const hasLog = allLogs.some((l) => l.logged_at.startsWith(dayStr));
          if (hasLog) streak++;
          else if (d > 0) break; // Allow today to be missing
        }
        setStreakDays(streak);
      }

      // Achievement count
      const { count } = await supabase
        .from("user_achievements")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      setAchievements(count || 0);
    };

    fetchData();
  }, [user, effectiveGoal]);

  // Derived stats
  const hydrationPercent = Math.min((hydrationToday / effectiveGoal) * 100, 100);
  const hungerPercent = Math.min(totalLogs * 5, 100); // Rough proxy
  const xp = Math.round(totalLogs * 3 + streakDays * 15 + achievements * 25 + hydrationToday / 50);
  const stage = getStage(xp);
  const nextStage = getNextStage(xp);
  const xpProgress = nextStage
    ? ((xp - stage.minXP) / (nextStage.minXP - stage.minXP)) * 100
    : 100;

  const mood = getPetMood(hungerPercent, hydrationPercent, streakDays);
  const moodMsg = useMemo(
    () => moodMessages[mood][Math.floor(Math.random() * moodMessages[mood].length)],
    [mood]
  );

  const handlePet = () => {
    setPetting(true);
    const msgs = [
      "Hehe, that tickles! 🦇",
      "*happy squeaks* ✨",
      "I love you too! 💜",
      "*does a little flip* 🌙",
      "More pets please! 🥰",
    ];
    setPetMessage(msgs[Math.floor(Math.random() * msgs.length)]);
    setTimeout(() => setPetting(false), 1500);
  };

  return (
    <div className="min-h-screen relative">
      <Starfield />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative z-10 px-4 py-6 max-w-lg mx-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate("/")}
            className="h-9 w-9 rounded-xl bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors active:scale-95"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-lg">{stage.emoji}</span>
            <span className="font-display text-sm font-semibold text-foreground">Noctis</span>
          </div>
          <div className="flex items-center gap-1 bg-card border border-border rounded-xl px-2.5 py-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-display font-bold text-primary">{xp} XP</span>
          </div>
        </div>

        {/* Mascot display */}
        <div className="relative flex flex-col items-center mb-6">
          {/* Mood bubble */}
          <AnimatePresence mode="wait">
            <motion.div
              key={petting ? "pet" : mood}
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="mb-3 px-4 py-2 rounded-2xl bg-card border border-primary/20 shadow-md max-w-[260px] text-center"
            >
              <p className="text-sm text-foreground/90">
                {petting ? petMessage : moodMsg}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Noctis */}
          <motion.button
            onClick={handlePet}
            whileTap={{ scale: 1.1 }}
            animate={
              petting
                ? { rotate: [0, -10, 10, -8, 8, -4, 4, 0], scale: [1, 1.1, 1] }
                : mood === "ecstatic"
                ? { y: [0, -8, 0] }
                : mood === "happy"
                ? { y: [0, -4, 0] }
                : mood === "sleepy" || mood === "starving"
                ? { y: [0, -1, 0] }
                : { y: [0, -3, 0] }
            }
            transition={{
              repeat: petting ? 0 : Infinity,
              duration: petting ? 0.6 : mood === "ecstatic" ? 1 : 2,
              ease: "easeInOut",
            }}
            className="relative cursor-pointer active:scale-110 transition-transform"
          >
            <img
              src={mascotImg}
              alt="Noctis"
              width={stage.size}
              height={stage.size}
              className={`drop-shadow-lg transition-all duration-500 ${
                mood === "starving" ? "grayscale-[40%] opacity-70" :
                mood === "sleepy" ? "grayscale-[20%] opacity-80" :
                mood === "ecstatic" ? "drop-shadow-[0_0_20px_rgba(120,220,200,0.4)]" : ""
              }`}
            />
            <span className="absolute -bottom-1 -right-1 text-xl">{moodEmoji[mood]}</span>

            {/* Petting sparkles */}
            {petting && (
              <>
                <motion.span animate={{ opacity: [0, 1, 0], y: -20 }} className="absolute top-0 left-1/4 text-sm">✨</motion.span>
                <motion.span animate={{ opacity: [0, 1, 0], y: -15 }} transition={{ delay: 0.1 }} className="absolute top-0 right-1/4 text-sm">💜</motion.span>
                <motion.span animate={{ opacity: [0, 1, 0], y: -25 }} transition={{ delay: 0.2 }} className="absolute -top-2 left-1/2 text-sm">⭐</motion.span>
              </>
            )}
          </motion.button>

          <p className="text-[10px] text-muted-foreground mt-2 animate-pulse">tap to pet!</p>
        </div>

        {/* Share progress */}
        <div className="rounded-xl bg-card/80 dreamy-blur border border-border p-3 mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-foreground">Share your progress</p>
            <p className="text-[10px] text-muted-foreground">{stage.emoji} {stage.name} • {xp} XP</p>
          </div>
          <SocialShare
            title="My Noctis Pet"
            text={`🦇 My Noctis evolved to ${stage.name} ${stage.emoji} with ${xp} XP on Circadia! How far can yours grow?`}
          />
        </div>

        {/* Evolution stage */}
        <div className="rounded-xl bg-card/80 dreamy-blur border border-border p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-xs font-display font-semibold text-foreground">
                {stage.emoji} {stage.name}
              </span>
            </div>
            {nextStage && (
              <span className="text-[10px] text-muted-foreground">
                Next: {nextStage.emoji} {nextStage.name}
              </span>
            )}
          </div>
          <div className="h-2.5 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
              initial={{ width: 0 }}
              animate={{ width: `${xpProgress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
          {nextStage && (
            <p className="text-[10px] text-muted-foreground mt-1.5 text-right">
              {xp - stage.minXP} / {nextStage.minXP - stage.minXP} XP
            </p>
          )}
          {!nextStage && (
            <p className="text-[10px] text-primary font-semibold mt-1.5 text-center">
              ✨ MAX LEVEL — Legendary!
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="rounded-xl bg-card/80 dreamy-blur border border-border p-4 space-y-3 mb-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Noctis Stats</p>
          <StatBar label="Hydration" value={hydrationPercent} icon={Droplets} color="text-hydration" />
          <StatBar label="Fullness" value={hungerPercent} icon={Utensils} color="text-primary" />
          <StatBar label="Happiness" value={Math.min((hydrationPercent + hungerPercent) / 2 + streakDays * 5, 100)} icon={Heart} color="text-rose-400" />
        </div>

        {/* Quick stats grid */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: "Streak", value: `${streakDays}d`, icon: "🔥" },
            { label: "Badges", value: `${achievements}`, icon: "🏆" },
            { label: "Today", value: `${(hydrationToday / 1000).toFixed(1)}L`, icon: "💧" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl bg-card/80 dreamy-blur border border-border p-3 text-center">
              <span className="text-lg">{stat.icon}</span>
              <p className="font-display text-sm font-bold text-foreground mt-1">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Motivational tip */}
        <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">How to level up Noctis</p>
          <div className="grid grid-cols-3 gap-3 mt-2">
            {[
              { action: "Log water", xp: "+3 XP", icon: "💧" },
              { action: "Daily streak", xp: "+15 XP", icon: "🔥" },
              { action: "Earn badge", xp: "+25 XP", icon: "🏆" },
            ].map((tip) => (
              <div key={tip.action}>
                <span className="text-lg">{tip.icon}</span>
                <p className="text-[10px] font-semibold text-foreground mt-0.5">{tip.action}</p>
                <p className="text-[10px] text-primary font-bold">{tip.xp}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Mini Games */}
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-2">
            <Gamepad2 className="h-4 w-4 text-primary" />
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Mini Games</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => navigate("/noctis/catch")}
              className="rounded-xl bg-card/80 dreamy-blur border border-border p-4 text-center hover:border-primary/30 transition-all active:scale-[0.97]"
            >
              <span className="text-2xl">💧</span>
              <p className="font-display text-sm font-semibold text-foreground mt-1">Hydration Catch</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Catch drops, dodge poison!</p>
            </button>
            <button
              onClick={() => navigate("/noctis/flight")}
              className="rounded-xl bg-card/80 dreamy-blur border border-border p-4 text-center hover:border-primary/30 transition-all active:scale-[0.97]"
            >
              <span className="text-2xl">🦇</span>
              <p className="font-display text-sm font-semibold text-foreground mt-1">Noctis Flight</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Fly through the pipes!</p>
            </button>
          </div>
          <button
            onClick={() => navigate("/noctis/multiplayer")}
            className="w-full mt-2 rounded-xl bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30 p-3 flex items-center justify-center gap-2 hover:border-primary/50 transition-all active:scale-[0.98]"
          >
            <Swords className="h-4 w-4 text-primary" />
            <span className="font-display text-sm font-semibold text-foreground">Multiplayer ⚔️</span>
          </button>
        </div>

        <p className="text-center text-[10px] text-muted-foreground mt-6 mb-4">
          Keep hydrating to help Noctis grow! 🦇
        </p>
      </motion.div>
    </div>
  );
};

export default NoctisPet;
