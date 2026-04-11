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

interface ToneConfig {
  frequencies: number[];
  durations: number[];
  type: OscillatorType;
  volume: number;
}

const soundConfigs: Record<SoundType, ToneConfig> = {
  hydration: {
    // Gentle water droplet: two quick high notes
    frequencies: [880, 1100],
    durations: [0.08, 0.12],
    type: "sine",
    volume: 0.15,
  },
  meal: {
    // Warm chime: ascending three-note chord
    frequencies: [523, 659, 784],
    durations: [0.12, 0.12, 0.2],
    type: "sine",
    volume: 0.18,
  },
  phase: {
    // Alert tone: two-tone attention grabber
    frequencies: [660, 880, 660],
    durations: [0.1, 0.15, 0.1],
    type: "triangle",
    volume: 0.2,
  },
  tip: {
    // Soft bell: single gentle tone with decay
    frequencies: [698],
    durations: [0.3],
    type: "sine",
    volume: 0.12,
  },
};

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

  // Envelope: quick attack, natural decay
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(volume, startTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(startTime);
  osc.stop(startTime + duration + 0.05);
}

export function playNotificationSound(tag: string, volume: number = 0.5) {
  try {
    const soundType = (tag in soundConfigs ? tag : "tip") as SoundType;
    const config = soundConfigs[soundType];
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
