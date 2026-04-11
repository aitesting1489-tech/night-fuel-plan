// Synthesized notification sounds using Web Audio API
// No external dependencies needed

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  if (audioContext.state === "suspended") {
    audioContext.resume();
  }
  return audioContext;
}

type SoundType = "hydration" | "meal" | "phase" | "tip";
export type SoundTheme = "default" | "nature" | "digital" | "minimal";

interface ToneConfig {
  frequencies: number[];
  durations: number[];
  type: OscillatorType;
  volume: number;
}

export const soundThemes: Record<SoundTheme, { label: string; desc: string; emoji: string }> = {
  default: { label: "Classic", desc: "Warm chimes & soft bells", emoji: "🔔" },
  nature: { label: "Nature", desc: "Gentle rain, birdsong tones", emoji: "🌿" },
  digital: { label: "Digital", desc: "Crisp synth bleeps & pulses", emoji: "💎" },
  minimal: { label: "Minimal", desc: "Ultra-subtle single tones", emoji: "🤍" },
};

const themeConfigs: Record<SoundTheme, Record<SoundType, ToneConfig>> = {
  default: {
    hydration: { frequencies: [880, 1100], durations: [0.08, 0.12], type: "sine", volume: 0.15 },
    meal: { frequencies: [523, 659, 784], durations: [0.12, 0.12, 0.2], type: "sine", volume: 0.18 },
    phase: { frequencies: [660, 880, 660], durations: [0.1, 0.15, 0.1], type: "triangle", volume: 0.2 },
    tip: { frequencies: [698], durations: [0.3], type: "sine", volume: 0.12 },
  },
  nature: {
    hydration: { frequencies: [440, 554, 659], durations: [0.15, 0.12, 0.18], type: "sine", volume: 0.12 },
    meal: { frequencies: [392, 494, 587], durations: [0.2, 0.15, 0.25], type: "sine", volume: 0.14 },
    phase: { frequencies: [330, 440, 523], durations: [0.12, 0.18, 0.15], type: "sine", volume: 0.16 },
    tip: { frequencies: [523, 659], durations: [0.25, 0.35], type: "sine", volume: 0.1 },
  },
  digital: {
    hydration: { frequencies: [1200, 1600], durations: [0.05, 0.08], type: "square", volume: 0.08 },
    meal: { frequencies: [800, 1000, 1200], durations: [0.06, 0.06, 0.1], type: "square", volume: 0.1 },
    phase: { frequencies: [600, 900, 600, 900], durations: [0.05, 0.05, 0.05, 0.08], type: "sawtooth", volume: 0.1 },
    tip: { frequencies: [1000], durations: [0.12], type: "square", volume: 0.07 },
  },
  minimal: {
    hydration: { frequencies: [660], durations: [0.2], type: "sine", volume: 0.1 },
    meal: { frequencies: [523, 660], durations: [0.15, 0.2], type: "sine", volume: 0.1 },
    phase: { frequencies: [440, 554], durations: [0.12, 0.15], type: "triangle", volume: 0.12 },
    tip: { frequencies: [554], durations: [0.25], type: "sine", volume: 0.08 },
  },
};

let currentTheme: SoundTheme = "default";

export function setCurrentTheme(theme: SoundTheme) {
  currentTheme = theme;
}

function playTone(
  ctx: AudioContext,
  frequency: number,
  startTime: number,
  duration: number,
  type: OscillatorType,
  volume: number
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, startTime);

  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(volume, startTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(startTime);
  osc.stop(startTime + duration + 0.05);
}

export function playNotificationSound(tag: string, volume: number = 0.5, theme?: SoundTheme) {
  try {
    const activeTheme = theme || currentTheme;
    const configs = themeConfigs[activeTheme] || themeConfigs.default;
    const soundType = (tag in configs ? tag : "tip") as SoundType;
    const config = configs[soundType];
    const ctx = getAudioContext();
    const scaledVolume = config.volume * Math.max(0, Math.min(1, volume)) * 2;

    let time = ctx.currentTime;
    for (let i = 0; i < config.frequencies.length; i++) {
      playTone(ctx, config.frequencies[i], time, config.durations[i], config.type, scaledVolume);
      time += config.durations[i] * 0.8;
    }
  } catch {
    // Audio not available
  }
}

// Check if user has interacted with the page (required for AudioContext)
let hasInteracted = false;
export function markUserInteraction() {
  hasInteracted = true;
}
export function canPlaySound(): boolean {
  return hasInteracted;
}

// Set up interaction listener once
if (typeof window !== "undefined") {
  const handler = () => {
    hasInteracted = true;
    window.removeEventListener("click", handler);
    window.removeEventListener("touchstart", handler);
    window.removeEventListener("keydown", handler);
  };
  window.addEventListener("click", handler, { once: false });
  window.addEventListener("touchstart", handler, { once: false });
  window.addEventListener("keydown", handler, { once: false });
}
