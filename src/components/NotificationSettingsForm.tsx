import { Bell, Droplets, UtensilsCrossed, Zap, Lightbulb, Volume2 } from "lucide-react";
import type { WaterSettings } from "@/hooks/useWaterSettings";
import { playNotificationSound } from "@/lib/notificationSounds";

interface NotificationSettingsFormProps {
  settings: WaterSettings;
  onChange: (settings: WaterSettings) => void;
}

const toggles = [
  { key: "notify_hydration" as const, label: "Hydration Reminders", icon: Droplets, desc: "Drink water alerts at your set interval", color: "text-hydration" },
  { key: "notify_meals" as const, label: "Meal Time Alerts", icon: UtensilsCrossed, desc: "Notifications when it's time to eat", color: "text-primary" },
  { key: "notify_phases" as const, label: "Shift Phase Alerts", icon: Zap, desc: "Caffeine cutoff & energy dip warnings", color: "text-amber-400" },
  { key: "notify_tips" as const, label: "Wellness Tips", icon: Lightbulb, desc: "Random health tips during your shift", color: "text-emerald-400" },
  { key: "notify_sound" as const, label: "Sound Effects", icon: Volume2, desc: "Play a chime when alerts fire", color: "text-violet-400" },
];

const NotificationSettingsForm = ({ settings, onChange }: NotificationSettingsFormProps) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <Bell className="h-4 w-4 text-primary" />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Notification Preferences
        </span>
      </div>

      <div className="rounded-xl border border-border bg-card/80 dreamy-blur p-3 space-y-1">
        {toggles.map(({ key, label, icon: Icon, desc, color }) => (
          <button
            key={key}
            onClick={() => onChange({ ...settings, [key]: !settings[key] })}
            className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-primary/5 active:scale-[0.99]"
          >
            <Icon className={`h-4 w-4 shrink-0 ${settings[key] ? color : "text-muted-foreground/40"}`} />
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-display font-medium ${settings[key] ? "text-foreground" : "text-muted-foreground"}`}>
                {label}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">{desc}</p>
            </div>
            <div
              className={`w-9 h-5 rounded-full transition-colors flex items-center px-0.5 ${
                settings[key] ? "bg-primary" : "bg-muted"
              }`}
            >
              <div
                className={`h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                  settings[key] ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default NotificationSettingsForm;
