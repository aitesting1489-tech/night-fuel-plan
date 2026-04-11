import { motion } from "framer-motion";
import { ArrowLeft, Trophy, Flame, Droplets, CheckCircle2, Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useWaterSettings } from "@/hooks/useWaterSettings";
import { useAchievements } from "@/hooks/useAchievements";
import { achievements } from "@/lib/achievements";
import Starfield from "@/components/Starfield";

const categoryIcons = {
  streak: Flame,
  volume: Droplets,
  consistency: CheckCircle2,
  movement: Activity,
};

const categoryLabels = {
  streak: "Streaks",
  volume: "Volume",
  consistency: "Consistency",
  movement: "Movement",
};

const Achievements = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { effectiveGoal } = useWaterSettings();
  const { earnedKeys, stats, loading } = useAchievements(effectiveGoal);

  if (!user) {
    navigate("/");
    return null;
  }

  const categories = ["streak", "volume", "consistency", "movement"] as const;

  return (
    <>
      <Starfield />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="min-h-screen px-4 py-6 max-w-lg mx-auto"
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="h-9 w-9 rounded-xl bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-primary/5 transition-colors active:scale-95"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-400" />
            <h1 className="font-display text-xl font-bold text-foreground neon-text">
              Achievements
            </h1>
          </div>
          <span className="ml-auto text-xs font-display font-semibold text-muted-foreground">
            {earnedKeys.size}/{achievements.length}
          </span>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          <div className="rounded-xl border border-border bg-card/80 dreamy-blur p-3 text-center">
            <p className="text-lg font-display font-bold text-foreground">{stats.currentStreak}</p>
            <p className="text-[10px] text-muted-foreground">Current Streak</p>
          </div>
          <div className="rounded-xl border border-border bg-card/80 dreamy-blur p-3 text-center">
            <p className="text-lg font-display font-bold text-foreground">{stats.longestStreak}</p>
            <p className="text-[10px] text-muted-foreground">Best Streak</p>
          </div>
          <div className="rounded-xl border border-border bg-card/80 dreamy-blur p-3 text-center">
            <p className="text-lg font-display font-bold text-foreground">{stats.totalLiters.toFixed(1)}</p>
            <p className="text-[10px] text-muted-foreground">Total Liters</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-6 w-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {categories.map((cat) => {
              const Icon = categoryIcons[cat];
              const catAchievements = achievements.filter((a) => a.category === cat);

              return (
                <div key={cat}>
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className="h-4 w-4 text-primary" />
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {categoryLabels[cat]}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {catAchievements.map((ach) => {
                      const earned = earnedKeys.has(ach.key);
                      return (
                        <motion.div
                          key={ach.key}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className={`rounded-xl border p-3 flex items-center gap-3 transition-all ${
                            earned
                              ? "border-primary/40 bg-primary/5 dreamy-blur"
                              : "border-border bg-card/40 opacity-60"
                          }`}
                        >
                          <div
                            className={`h-10 w-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${
                              earned
                                ? "bg-primary/10"
                                : "bg-muted/50 grayscale"
                            }`}
                          >
                            {ach.emoji}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-xs font-display font-semibold ${
                                earned ? "text-foreground" : "text-muted-foreground"
                              }`}
                            >
                              {ach.title}
                            </p>
                            <p className="text-[10px] text-muted-foreground truncate">
                              {ach.description}
                            </p>
                          </div>
                          {earned && (
                            <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p className="text-center text-[10px] text-muted-foreground/50 mt-8 mb-4 font-light">
          Achievements are awarded based on your hydration history
        </p>
      </motion.div>
    </>
  );
};

export default Achievements;
