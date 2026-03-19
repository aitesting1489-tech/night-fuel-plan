import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Moon, CheckCircle2 } from "lucide-react";
import { generateSchedule, generatePhases, type ScheduleItem, type DietType } from "@/lib/schedule";
import EnergyGauge from "./EnergyGauge";
import HydrationGauge from "./HydrationGauge";
import FuelCard from "./FuelCard";
import DripCard from "./DripCard";
import NutritionSummary from "./NutritionSummary";
import ProUpsell from "./ProUpsell";
import ProFeaturesModal from "./ProFeaturesModal";
import ShiftTimeline from "./ShiftTimeline";
import DecompressionBreakfast from "./DecompressionBreakfast";

interface ShiftDashboardProps {
  startTime: string;
  endTime: string;
  diet: DietType;
  shiftName?: string;
  onBack: () => void;
}

const ShiftDashboard = ({ startTime, endTime, diet, shiftName, onBack }: ShiftDashboardProps) => {
  const schedule = useMemo(
    () => generateSchedule(startTime, endTime, diet).filter((s) => s.type === "fuel" || s.type === "drip"),
    [startTime, endTime, diet]
  );
  const phases = useMemo(() => generatePhases(startTime, endTime), [startTime, endTime]);
  const [logged, setLogged] = useState<Set<string>>(new Set());
  const [shiftFinished, setShiftFinished] = useState(false);
  const [breakfastDismissed, setBreakfastDismissed] = useState(false);

  const toggleLog = (id: string) => {
    setLogged((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

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

  const handleFinishShift = () => {
    setShiftFinished(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="min-h-screen px-4 py-6 max-w-lg mx-auto"
    >
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
        <div className="w-9" />
      </div>

      {/* Timeline */}
      <ShiftTimeline phases={phases} activePhase={shiftFinished ? 4 : 2} />

      {/* Gauges */}
      <div className="space-y-3 mb-6">
        <EnergyGauge level={energyLevel} />
        <HydrationGauge current={hydrationLogged} target={hydrationTarget} />
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

      {/* Finish Shift Button */}
      {!shiftFinished && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={handleFinishShift}
          className="w-full mt-5 rounded-xl border border-primary/30 bg-primary/10 py-3 px-4 font-display font-semibold text-sm text-primary flex items-center justify-center gap-2 hover:bg-primary/20 active:scale-[0.98] transition-all duration-200"
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
    </motion.div>
  );
};

export default ShiftDashboard;
