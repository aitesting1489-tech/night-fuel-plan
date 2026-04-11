import { Droplets, Weight, GlassWater, Clock, Calculator } from "lucide-react";
import { WaterSettings, calculateGoalFromWeight } from "@/hooks/useWaterSettings";

interface WaterSettingsFormProps {
  settings: WaterSettings;
  onChange: (settings: WaterSettings) => void;
}

const cupOptions = [150, 200, 250, 300, 350, 500, 750];
const intervalOptions = [
  { value: 30, label: "30 min" },
  { value: 45, label: "45 min" },
  { value: 60, label: "1 hour" },
  { value: 90, label: "1.5 hours" },
  { value: 120, label: "2 hours" },
];

const WaterSettingsForm = ({ settings, onChange }: WaterSettingsFormProps) => {
  const update = (partial: Partial<WaterSettings>) => {
    onChange({ ...settings, ...partial });
  };

  const calculatedGoal = settings.body_weight_kg
    ? calculateGoalFromWeight(settings.body_weight_kg)
    : null;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 mb-1">
        <Droplets className="h-4 w-4 text-hydration" />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Water Intake Settings
        </span>
      </div>

      {/* Body weight */}
      <div className="rounded-xl border border-border bg-card/80 dreamy-blur p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Weight className="h-4 w-4 text-primary" />
          <label className="text-xs font-medium text-foreground">Body Weight</label>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="number"
            value={settings.body_weight_kg ?? ""}
            onChange={(e) => {
              const v = e.target.value ? parseFloat(e.target.value) : null;
              update({ body_weight_kg: v && v > 0 && v < 500 ? v : null });
            }}
            placeholder="e.g. 70"
            min={20}
            max={300}
            step={0.5}
            className="w-24 rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground font-body placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <span className="text-xs text-muted-foreground">kg</span>
        </div>

        {settings.body_weight_kg && (
          <button
            onClick={() => update({ use_weight_calculation: !settings.use_weight_calculation })}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs transition-all ${
              settings.use_weight_calculation
                ? "bg-hydration/15 text-hydration border border-hydration/30"
                : "bg-muted text-muted-foreground border border-border hover:bg-primary/5"
            }`}
          >
            <Calculator className="h-3.5 w-3.5" />
            {settings.use_weight_calculation
              ? `Auto-calculated: ${calculatedGoal}ml/day`
              : "Use weight-based calculation (35ml/kg)"}
          </button>
        )}
      </div>

      {/* Daily goal */}
      {!settings.use_weight_calculation && (
        <div className="rounded-xl border border-border bg-card/80 dreamy-blur p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Droplets className="h-4 w-4 text-hydration" />
              <label className="text-xs font-medium text-foreground">Daily Goal</label>
            </div>
            <span className="text-xs font-semibold text-hydration">{settings.daily_goal_ml}ml</span>
          </div>
          <input
            type="range"
            min={1000}
            max={5000}
            step={100}
            value={settings.daily_goal_ml}
            onChange={(e) => update({ daily_goal_ml: parseInt(e.target.value) })}
            className="w-full accent-hydration"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>1L</span>
            <span>5L</span>
          </div>
        </div>
      )}

      {/* Cup size */}
      <div className="rounded-xl border border-border bg-card/80 dreamy-blur p-4 space-y-3">
        <div className="flex items-center gap-2">
          <GlassWater className="h-4 w-4 text-primary" />
          <label className="text-xs font-medium text-foreground">Cup / Bottle Size</label>
        </div>
        <div className="flex flex-wrap gap-2">
          {cupOptions.map((size) => (
            <button
              key={size}
              onClick={() => update({ cup_size_ml: size })}
              className={`rounded-lg px-3 py-1.5 text-xs font-display font-medium transition-all active:scale-95 ${
                settings.cup_size_ml === size
                  ? "bg-primary/10 border border-primary/50 text-primary glow-primary"
                  : "border border-border bg-card text-muted-foreground hover:border-primary/30"
              }`}
            >
              {size}ml
            </button>
          ))}
        </div>
      </div>

      {/* Reminder frequency */}
      <div className="rounded-xl border border-border bg-card/80 dreamy-blur p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          <label className="text-xs font-medium text-foreground">Reminder Frequency</label>
        </div>
        <div className="flex flex-wrap gap-2">
          {intervalOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => update({ reminder_interval_minutes: opt.value })}
              className={`rounded-lg px-3 py-1.5 text-xs font-display font-medium transition-all active:scale-95 ${
                settings.reminder_interval_minutes === opt.value
                  ? "bg-primary/10 border border-primary/50 text-primary glow-primary"
                  : "border border-border bg-card text-muted-foreground hover:border-primary/30"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WaterSettingsForm;
