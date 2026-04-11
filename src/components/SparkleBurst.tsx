import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Particle {
  id: number;
  angle: number;
  distance: number;
  size: number;
  color: string;
  delay: number;
  wave: number; // which burst wave (0 = first, 1 = second, etc.)
}

const colors = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(170 80% 70%)",
  "hsl(45 100% 70%)",
  "hsl(280 70% 70%)",
  "hsl(200 90% 65%)",
];

const epicColors = [
  "hsl(45 100% 65%)",
  "hsl(35 100% 55%)",
  "hsl(50 100% 75%)",
  "hsl(var(--primary))",
  "hsl(280 80% 65%)",
  "hsl(320 80% 65%)",
  "hsl(170 90% 60%)",
];

// intensity: 1 = normal, 2 = great, 3 = epic
interface SparkleBurstProps {
  trigger: boolean;
  intensity?: 1 | 2 | 3;
}

const INTENSITY_CONFIG = {
  1: { particles: 24, waves: 1, maxDist: 160, maxSize: 8, duration: 0.8, clearDelay: 1200 },
  2: { particles: 36, waves: 2, maxDist: 200, maxSize: 10, duration: 1.0, clearDelay: 1800 },
  3: { particles: 50, waves: 3, maxDist: 260, maxSize: 14, duration: 1.2, clearDelay: 2500 },
};

const SparkleBurst = ({ trigger, intensity = 1 }: SparkleBurstProps) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [activeWaves, setActiveWaves] = useState(0);

  useEffect(() => {
    if (!trigger) return;
    const cfg = INTENSITY_CONFIG[intensity];
    const palette = intensity === 3 ? epicColors : colors;

    const spawnWave = (wave: number) => {
      const count = Math.round(cfg.particles / cfg.waves);
      const waveParticles: Particle[] = Array.from({ length: count }, (_, i) => ({
        id: wave * 1000 + i,
        angle: (360 / count) * i + (Math.random() - 0.5) * 25,
        distance: 60 + Math.random() * (cfg.maxDist - 60),
        size: 3 + Math.random() * (cfg.maxSize - 3),
        color: palette[Math.floor(Math.random() * palette.length)],
        delay: Math.random() * 0.15,
        wave,
      }));

      setParticles((prev) => [...prev, ...waveParticles]);
    };

    setParticles([]);
    setActiveWaves(cfg.waves);
    spawnWave(0);

    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let w = 1; w < cfg.waves; w++) {
      timers.push(setTimeout(() => spawnWave(w), w * 350));
    }
    timers.push(setTimeout(() => { setParticles([]); setActiveWaves(0); }, cfg.clearDelay));

    return () => timers.forEach(clearTimeout);
  }, [trigger, intensity]);

  const cfg = INTENSITY_CONFIG[intensity];

  return (
    <AnimatePresence>
      {particles.length > 0 && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          {particles.map((p) => {
            const rad = (p.angle * Math.PI) / 180;
            const x = Math.cos(rad) * p.distance;
            const y = Math.sin(rad) * p.distance;
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                animate={{ opacity: 0, scale: 0, x, y }}
                exit={{ opacity: 0 }}
                transition={{ duration: cfg.duration, delay: p.delay + p.wave * 0.3, ease: "easeOut" }}
                style={{
                  position: "absolute",
                  width: p.size,
                  height: p.size,
                  borderRadius: p.size > 8 ? "2px" : "50%",
                  backgroundColor: p.color,
                  boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
                }}
              />
            );
          })}

          {/* Central glow — scales with intensity */}
          <motion.div
            initial={{ opacity: 1, scale: 0.5 }}
            animate={{ opacity: 0, scale: 1.5 + intensity }}
            transition={{ duration: 0.6 + intensity * 0.2, ease: "easeOut" }}
            className="absolute rounded-full"
            style={{
              width: 48 + intensity * 16,
              height: 48 + intensity * 16,
              background:
                intensity === 3
                  ? "radial-gradient(circle, hsl(45 100% 65% / 0.5), hsl(var(--primary) / 0.2), transparent 70%)"
                  : "radial-gradient(circle, hsl(var(--primary) / 0.4), transparent 70%)",
            }}
          />

          {/* Extra ring pulse for intensity 2+ */}
          {intensity >= 2 && (
            <motion.div
              initial={{ opacity: 0.6, scale: 0.3 }}
              animate={{ opacity: 0, scale: 3 }}
              transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
              className="absolute rounded-full border-2"
              style={{
                width: 80,
                height: 80,
                borderColor: intensity === 3 ? "hsl(45 100% 65% / 0.4)" : "hsl(var(--primary) / 0.3)",
              }}
            />
          )}

          {/* Second ring for epic */}
          {intensity === 3 && (
            <motion.div
              initial={{ opacity: 0.4, scale: 0.5 }}
              animate={{ opacity: 0, scale: 4 }}
              transition={{ duration: 1.3, delay: 0.5, ease: "easeOut" }}
              className="absolute rounded-full border"
              style={{
                width: 60,
                height: 60,
                borderColor: "hsl(280 80% 65% / 0.3)",
              }}
            />
          )}
        </div>
      )}
    </AnimatePresence>
  );
};

export default SparkleBurst;

/** Helper: map a score/streak to an intensity tier */
export function getIntensity(value: number, thresholds: [number, number] = [5, 15]): 1 | 2 | 3 {
  if (value >= thresholds[1]) return 3;
  if (value >= thresholds[0]) return 2;
  return 1;
}
