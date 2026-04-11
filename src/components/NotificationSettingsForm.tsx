import { Bell, Droplets, UtensilsCrossed, Zap, Lightbulb, Volume2, Music } from "lucide-react";
import type { WaterSettings } from "@/hooks/useWaterSettings";
import { playNotificationSound, soundThemes, type SoundTheme } from "@/lib/notificationSounds";
import mascotBat from "@/assets/mascot-bat.png";
import mascotBatFemale from "@/assets/mascot-bat-female.png";
import type { MascotGender } from "./MascotTip";

interface NotificationSettingsFormProps {
  settings: WaterSettings;
  onChange: (settings: WaterSettings) => void;
  mascotGender?: MascotGender;
  onMascotGenderChange?: (gender: MascotGender) => void;
}

const toggles = [
  { key: "notify_hydration" as const, label: "Hydration Reminders", icon: Droplets, desc: "Drink water alerts at your set interval", color: "text-hydration" },
  { key: "notify_meals" as const, label: "Meal Time Alerts", icon: UtensilsCrossed, desc: "Notifications when it's time to eat", color: "text-primary" },
  { key: "notify_phases" as const, label: "Shift Phase Alerts", icon: Zap, desc: "Caffeine cutoff & energy dip warnings", color: "text-amber-400" },
  { key: "notify_tips" as const, label: "Wellness Tips", icon: Lightbulb, desc: "Random health tips during your shift", color: "text-emerald-400" },
  { key: "notify_sound" as const, label: "Sound Effects", icon: Volume2, desc: "Play a chime when alerts fire", color: "text-violet-400" },
];

const themeKeys = Object.keys(soundThemes) as SoundTheme[];

const NotificationSettingsForm = ({ settings, onChange, mascotGender = "boy", onMascotGenderChange }: NotificationSettingsFormProps) => {
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
            onClick={() => {
              const newVal = !settings[key];
              onChange({ ...settings, [key]: newVal });
              if (key === "notify_sound" && newVal) {
                playNotificationSound("meal", settings.notify_volume, settings.sound_theme as SoundTheme);
              }
            }}
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

      {/* Sound settings - only show when sound is enabled */}
      {settings.notify_sound && (
        <>
          {/* Theme picker */}
          <div className="rounded-xl border border-border bg-card/80 dreamy-blur p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Music className="h-4 w-4 text-violet-400" />
              <label className="text-xs font-medium text-foreground">Sound Theme</label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {themeKeys.map((key) => {
                const theme = soundThemes[key];
                const active = (settings.sound_theme || "default") === key;
                return (
                  <button
                    key={key}
                    onClick={() => {
                      onChange({ ...settings, sound_theme: key });
                      playNotificationSound("meal", settings.notify_volume, key);
                    }}
                    className={`rounded-xl p-3 text-left transition-all active:scale-[0.97] ${
                      active
                        ? "bg-primary/10 border-2 border-primary/50 glow-primary"
                        : "border border-border hover:border-primary/30"
                    }`}
                  >
                    <span className="text-base">{theme.emoji}</span>
                    <p className={`text-xs font-display font-medium mt-1 ${active ? "text-primary" : "text-foreground"}`}>
                      {theme.label}
                    </p>
                    <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{theme.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Volume slider */}
          <div className="rounded-xl border border-border bg-card/80 dreamy-blur p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 className="h-4 w-4 text-violet-400" />
                <label className="text-xs font-medium text-foreground">Volume</label>
              </div>
              <span className="text-xs font-semibold text-muted-foreground">
                {Math.round(settings.notify_volume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={Math.round(settings.notify_volume * 100)}
              onChange={(e) => onChange({ ...settings, notify_volume: parseInt(e.target.value) / 100 })}
              onMouseUp={() => {
                if (settings.notify_sound) playNotificationSound("meal", settings.notify_volume, settings.sound_theme as SoundTheme);
              }}
              onTouchEnd={() => {
                if (settings.notify_sound) playNotificationSound("meal", settings.notify_volume, settings.sound_theme as SoundTheme);
              }}
              className="w-full accent-violet-400"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Silent</span>
              <span>Max</span>
            </div>
          </div>
        </>
      )}

      {/* Mascot Gender Picker */}
      <div className="rounded-xl border border-border bg-card/80 dreamy-blur p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-base">🦇</span>
          <label className="text-xs font-medium text-foreground">Noctis Style</label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {([
            { value: "boy" as MascotGender, label: "Boy", img: mascotBat },
            { value: "girl" as MascotGender, label: "Girl", img: mascotBatFemale },
          ]).map(({ value, label, img }) => {
            const active = mascotGender === value;
            return (
              <button
                key={value}
                onClick={() => onMascotGenderChange?.(value)}
                className={`rounded-xl p-3 flex flex-col items-center gap-2 transition-all active:scale-[0.97] ${
                  active
                    ? "bg-primary/10 border-2 border-primary/50 glow-primary"
                    : "border border-border hover:border-primary/30"
                }`}
              >
                <img src={img} alt={`Noctis ${label}`} width={48} height={48} className="drop-shadow-md" />
                <p className={`text-xs font-display font-medium ${active ? "text-primary" : "text-foreground"}`}>
                  {label}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default NotificationSettingsForm;
