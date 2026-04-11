import { useState, useMemo, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Moon, CheckCircle2, FileDown, History, Trophy, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { generateSchedule, generatePhases, type ScheduleItem, type DietType } from "@/lib/schedule";
import { generateProtocolPdf } from "@/lib/generatePdf";
import { trackEvent } from "@/lib/analytics";
import { useWaterSettings } from "@/hooks/useWaterSettings";
import { useShiftNotifications } from "@/hooks/useShiftNotifications";
import { useHydrationLogger } from "@/hooks/useHydrationLogger";
import { useAchievements } from "@/hooks/useAchievements";
import { useFriendAlerts } from "@/hooks/useFriendAlerts";
import { getMascotGender } from "@/lib/mascotPrefs";
import NotificationToggle from "./NotificationToggle";
import EnergyGauge from "./EnergyGauge";
import HydrationGauge from "./HydrationGauge";
import FuelCard from "./FuelCard";
import DripCard from "./DripCard";
import NutritionSummary from "./NutritionSummary";
import ProUpsell from "./ProUpsell";
import ProFeaturesModal from "./ProFeaturesModal";
import ShiftTimeline from "./ShiftTimeline";
import DecompressionBreakfast from "./DecompressionBreakfast";
import SparkleBurst from "./SparkleBurst";
import MascotTip, { getMood } from "./MascotTip";
import MiniNoctis from "./MiniNoctis";

interface ShiftDashboardProps {
  startTime: string;
  endTime: string;
  diet: DietType;
  shiftName?: string;
  onBack: () => void;
}

const ShiftDashboard = ({ startTime, endTime, diet, shiftName, onBack }: ShiftDashboardProps) => {
  const navigate = useNavigate();
  const { settings: waterSettings, effectiveGoal } = useWaterSettings();
  const schedule = useMemo(
    () => generateSchedule(startTime, endTime, diet, waterSettings.cup_size_ml).filter((s) => s.type === "fuel" || s.type === "drip"),
    [startTime, endTime, diet, waterSettings.cup_size_ml]
  );
  const phases = useMemo(() => generatePhases(startTime, endTime), [startTime, endTime]);
  const [logged, setLogged] = useState<Set<string>>(new Set());
  const [shiftFinished, setShiftFinished] = useState(false);
  const [breakfastDismissed, setBreakfastDismissed] = useState(false);
  const [allCheckedBurst, setAllCheckedBurst] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [showMascotTip, setShowMascotTip] = useState(false);
  const prevAllChecked = useRef(false);
  const mascotTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Full schedule (including caffeine-cutoff, crash-alert) for notifications
  const fullSchedule = useMemo(
    () => generateSchedule(startTime, endTime, diet, waterSettings.cup_size_ml),
    [startTime, endTime, diet, waterSettings.cup_size_ml]
  );

  const { nextNotification } = useShiftNotifications({
    schedule: fullSchedule,
    reminderIntervalMinutes: waterSettings.reminder_interval_minutes,
    shiftStartTime: startTime,
    shiftEndTime: endTime,
    enabled: notificationsEnabled && !shiftFinished,
    preferences: waterSettings,
    soundEnabled: waterSettings.notify_sound,
    soundVolume: waterSettings.notify_volume,
    soundTheme: waterSettings.sound_theme,
  });

  const { logHydration, unlogHydration } = useHydrationLogger();
  const { checkAndAward } = useAchievements(effectiveGoal);
  useFriendAlerts(waterSettings.notify_sound, waterSettings.notify_volume, waterSettings.sound_theme as any);

  const toggleLog = (id: string) => {
    const item = schedule.find((s) => s.id === id);
    setLogged((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        if (item?.type === "drip" && item.amount) {
          unlogHydration(item.amount);
        }
      } else {
        next.add(id);
        if (item?.type === "drip" && item.amount) {
          logHydration(item.amount).then(() => checkAndAward());
        }
      }
      return next;
    });
  };

  const allChecked = schedule.length > 0 && logged.size === schedule.length;

  useEffect(() => {
    if (allChecked && !prevAllChecked.current) {
      setAllCheckedBurst(true);
      const timer = setTimeout(() => setAllCheckedBurst(false), 100);
      return () => clearTimeout(timer);
    }
    prevAllChecked.current = allChecked;
  }, [allChecked]);

  // Show mascot tip periodically during shift
  useEffect(() => {
    if (shiftFinished) return;
    // Show first tip after 2 minutes, then every 20 minutes
    mascotTimerRef.current = setTimeout(() => {
      setShowMascotTip(true);
    }, 2 * 60 * 1000);

    const interval = setInterval(() => {
      setShowMascotTip(true);
    }, 20 * 60 * 1000);

    return () => {
      if (mascotTimerRef.current) clearTimeout(mascotTimerRef.current);
      clearInterval(interval);
    };
  }, [shiftFinished]);

  const totalFuel = schedule.filter((s) => s.type === "fuel");
  const totalDrip = schedule.filter((s) => s.type === "drip");
  const loggedFuelItems = totalFuel.filter((s) => logged.has(s.id));
  const loggedFuel = loggedFuelItems.length;
  const loggedDrip = totalDrip.filter((s) => logged.has(s.id));

  const totalCalories = totalFuel.reduce((sum, s) => sum + (s.calories || 0), 0);
  const loggedCalories = loggedFuelItems.reduce((sum, s) => sum + (s.calories || 0), 0);

  const hydrationLogged = loggedDrip.reduce((sum, s) => sum + (s.amount || 0), 0);
  const hydrationTarget = totalDrip.reduce((sum, s) => sum + (s.amount || 0), 0);

  const energyLevel = Math.round(
    ((loggedFuel / Math.max(totalFuel.length, 1)) * 60) +
    ((hydrationLogged / Math.max(hydrationTarget, 1)) * 40)
  );

  const hydrationPercent = hydrationTarget > 0 ? (hydrationLogged / Math.max(hydrationTarget, effectiveGoal)) * 100 : 0;
  const noctisMood = getMood(hydrationPercent, energyLevel, allChecked, shiftFinished);

  const handleFinishShift = () => {
    trackEvent("shift_finished", { startTime, endTime, diet, itemsLogged: logged.size, totalItems: schedule.length });
    setShiftFinished(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="min-h-screen px-4 py-6 max-w-lg mx-auto"
    >
      <SparkleBurst trigger={allCheckedBurst} />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="h-9 w-9 rounded-xl bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-primary/5 transition-colors active:scale-95"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2 text-center">
          <Moon className="h-4 w-4 text-primary" />
          <div className="flex flex-col">
            {shiftName && (
              <span className="font-display text-xs font-semibold text-foreground">{shiftName}</span>
            )}
            <span className="font-display text-sm font-semibold text-muted-foreground">
              {startTime} — {endTime}
            </span>
          </div>
        </div>
        <MiniNoctis
          mood={noctisMood}
          gender={getMascotGender()}
          onClick={() => setShowMascotTip(true)}
        />
      </div>

      {/* Notification Toggle */}
      <div className="mb-4 flex justify-end">
        <NotificationToggle
          enabled={notificationsEnabled}
          onToggle={setNotificationsEnabled}
          nextNotificationTime={
            nextNotification
              ? nextNotification.fireAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
              : null
          }
        />
      </div>
      <ShiftTimeline phases={phases} activePhase={shiftFinished ? 4 : 2} />

      {/* Gauges */}
      <div className="space-y-3 mb-6">
        <EnergyGauge level={energyLevel} />
        <HydrationGauge
          current={hydrationLogged}
          target={Math.max(hydrationTarget, effectiveGoal)}
          actions={
            <>
              <button
                onClick={() => navigate("/leaderboard")}
                className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors active:scale-95"
                title="Leaderboard"
              >
                <Users className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => navigate("/achievements")}
                className="h-7 w-7 rounded-lg bg-amber-400/10 flex items-center justify-center text-amber-400 hover:bg-amber-400/20 transition-colors active:scale-95"
                title="Achievements"
              >
                <Trophy className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => navigate("/hydration")}
                className="h-7 w-7 rounded-lg bg-hydration/10 flex items-center justify-center text-hydration hover:bg-hydration/20 transition-colors active:scale-95"
                title="Hydration History"
              >
                <History className="h-3.5 w-3.5" />
              </button>
            </>
          }
        />
      </div>

      {/* Schedule Items */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
          Your Shift Schedule
        </p>
        {schedule.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.2 }}
          >
            {item.type === "fuel" ? (
              <FuelCard
                time={item.time}
                title={item.title!}
                description={item.description!}
                calories={item.calories!}
                logged={logged.has(item.id)}
                onLog={() => toggleLog(item.id)}
              />
            ) : (
              <DripCard
                time={item.time}
                amount={item.amount!}
                logged={logged.has(item.id)}
                onLog={() => toggleLog(item.id)}
              />
            )}
          </motion.div>
        ))}
      </div>

      {/* Nutrition Summary */}
      <div className="mt-6">
        <NutritionSummary totalCalories={totalCalories} loggedCalories={loggedCalories} />
      </div>

      {/* Generate PDF */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={() => {
          trackEvent("pdf_downloaded", { diet, shiftName: shiftName || "" });
          generateProtocolPdf(startTime, endTime, diet, shiftName || "", schedule);
        }}
        className="w-full mt-5 rounded-xl bg-primary/10 border border-primary/30 py-3 px-4 font-display font-semibold text-sm text-primary flex items-center justify-center gap-2 hover:bg-primary/20 active:scale-[0.98] transition-all duration-200 glow-primary"
      >
        <FileDown className="h-4 w-4" />
        Generate My Pro Protocol
      </motion.button>

      {/* Finish Shift Button */}
      {!shiftFinished && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={handleFinishShift}
          className="w-full mt-3 rounded-xl border border-border bg-secondary py-3 px-4 font-display font-semibold text-sm text-secondary-foreground flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all duration-200"
        >
          <CheckCircle2 className="h-4 w-4" />
          Mark Shift as Finished
        </motion.button>
      )}

      {shiftFinished && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-xs text-primary font-display font-semibold mt-5"
        >
          ✨ Shift Complete — Great work!
        </motion.p>
      )}

      {/* Pro Upsell */}
      <div className="mt-4 space-y-3 mb-4">
        <ProFeaturesModal />
        <ProUpsell />
      </div>

      <p className="text-center text-xs text-muted-foreground mt-4 mb-4 font-light">
        Tap ✓ to log each item as you go
      </p>

      {/* Decompression Breakfast - only shows after finishing */}
      <DecompressionBreakfast
        show={shiftFinished && !breakfastDismissed}
        diet={diet}
        onDismiss={() => setBreakfastDismissed(true)}
      />

      {/* Mascot Tip */}
      <MascotTip
        show={showMascotTip}
        onDismiss={() => setShowMascotTip(false)}
        hydrationPercent={hydrationPercent}
        energyLevel={energyLevel}
        allChecked={allChecked}
        shiftFinished={shiftFinished}
        gender={getMascotGender()}
      />
    </motion.div>
  );
};

export default ShiftDashboard;
