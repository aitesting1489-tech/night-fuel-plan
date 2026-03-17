import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Moon } from "lucide-react";
import { generateSchedule, type ScheduleItem, type DietType } from "@/lib/schedule";
import EnergyGauge from "./EnergyGauge";
import HydrationGauge from "./HydrationGauge";
import FuelCard from "./FuelCard";
import DripCard from "./DripCard";
import NutritionSummary from "./NutritionSummary";
import ProUpsell from "./ProUpsell";

interface ShiftDashboardProps {
  startTime: string;
  endTime: string;
  diet: DietType;
  onBack: () => void;
}

const ShiftDashboard = ({ startTime, endTime, diet, onBack }: ShiftDashboardProps) => {
  const schedule = useMemo(() => generateSchedule(startTime, endTime, diet), [startTime, endTime, diet]);
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
      className="min-h-screen px-4 py-6 max-w-lg mx-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="h-9 w-9 rounded-lg bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors active:scale-95"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2">
          <Moon className="h-4 w-4 text-energy" />
          <span className="font-display text-sm font-semibold text-foreground">
            {startTime} — {endTime}
          </span>
        </div>
        <div className="w-9" />
      </div>

      {/* Gauges */}
      <div className="space-y-3 mb-6">
        <EnergyGauge level={energyLevel} />
        <HydrationGauge current={hydrationLogged} target={hydrationTarget} />
      </div>

      {/* Timeline */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
          Your Shift Schedule
        </p>
        {schedule.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.15 }}
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
      <div className="mt-6 mb-4">
        <NutritionSummary totalCalories={totalCalories} loggedCalories={loggedCalories} />
      </div>

      <p className="text-center text-xs text-muted-foreground mt-4 mb-4">
        Tap ✓ to log each item as you go
      </p>
    </motion.div>
  );
};

export default ShiftDashboard;
