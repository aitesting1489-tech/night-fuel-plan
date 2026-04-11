import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, BedDouble, CheckCircle2 } from "lucide-react";
import type { DietType } from "@/lib/schedule";
import { generateNightOffSchedule, generateNightOffPhases } from "@/lib/nightOffSchedule";
import EnergyGauge from "./EnergyGauge";
import HydrationGauge from "./HydrationGauge";
import FuelCard from "./FuelCard";
import DripCard from "./DripCard";
import NutritionSummary from "./NutritionSummary";
import ShiftTimeline from "./ShiftTimeline";
import MovementTipsSection from "./MovementTipsSection";

interface NightOffDashboardProps {
  bedtime: string;
  diet: DietType;
  onBack: () => void;
}

const NightOffDashboard = ({ bedtime, diet, onBack }: NightOffDashboardProps) => {
  const schedule = useMemo(() => generateNightOffSchedule(bedtime, diet), [bedtime, diet]);
  const phases = useMemo(() => generateNightOffPhases(bedtime), [bedtime]);
  const [logged, setLogged] = useState<Set<string>>(new Set());

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
  const loggedDripItems = totalDrip.filter((s) => logged.has(s.id));

  const totalCalories = totalFuel.reduce((sum, s) => sum + (s.calories || 0), 0);
  const loggedCalories = loggedFuelItems.reduce((sum, s) => sum + (s.calories || 0), 0);
  const hydrationLogged = loggedDripItems.reduce((sum, s) => sum + (s.amount || 0), 0);
  const hydrationTarget = totalDrip.reduce((sum, s) => sum + (s.amount || 0), 0);

  const energyLevel = Math.round(
    ((loggedFuelItems.length / Math.max(totalFuel.length, 1)) * 60) +
    ((hydrationLogged / Math.max(hydrationTarget, 1)) * 40)
  );

  const allLogged = schedule.every((s) => logged.has(s.id));

  // Format bedtime for display
  const formatBedtime = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    const period = h >= 12 ? "PM" : "AM";
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${h12}:${m.toString().padStart(2, "0")} ${period}`;
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
          <BedDouble className="h-4 w-4 text-primary" />
          <div className="flex flex-col">
            <span className="font-display text-xs font-semibold text-foreground">Night Off</span>
            <span className="font-display text-sm font-semibold text-muted-foreground">
              Bedtime: {formatBedtime(bedtime)}
            </span>
          </div>
        </div>
        <div className="w-9" />
      </div>

      {/* Timeline */}
      <ShiftTimeline phases={phases} activePhase={allLogged ? 4 : 2} />

      {/* Rest-Day Movement & Recovery Tips */}
      <MovementTipsSection shiftFinished={true} currentPhase={undefined} isRestDay={true} />

      {/* Gauges */}
      <div className="space-y-3 mb-6">
        <EnergyGauge level={energyLevel} />
        <HydrationGauge current={hydrationLogged} target={hydrationTarget} />
      </div>

      {/* Schedule Items */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
          Your Night Off Plan
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

      {allLogged && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center gap-2 text-primary font-display font-semibold text-xs mt-5"
        >
          <CheckCircle2 className="h-4 w-4" />
          All done — sleep well tonight!
        </motion.div>
      )}

      <p className="text-center text-xs text-muted-foreground mt-4 mb-4 font-light">
        Tap ✓ to log each item as you go
      </p>
    </motion.div>
  );
};

export default NightOffDashboard;
