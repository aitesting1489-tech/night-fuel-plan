import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const PARTICLE_COUNT = 24;

interface Particle {
  id: number;
  angle: number;
  distance: number;
  size: number;
  color: string;
  delay: number;
}

const colors = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(170 80% 70%)",
  "hsl(45 100% 70%)",
  "hsl(280 70% 70%)",
  "hsl(200 90% 65%)",
];

const SparkleBurst = ({ trigger }: { trigger: boolean }) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!trigger) return;
    setParticles(
      Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
        id: i,
        angle: (360 / PARTICLE_COUNT) * i + (Math.random() - 0.5) * 20,
        distance: 60 + Math.random() * 100,
        size: 3 + Math.random() * 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 0.15,
      }))
    );
    const timer = setTimeout(() => setParticles([]), 1200);
    return () => clearTimeout(timer);
  }, [trigger]);

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
                transition={{ duration: 0.8, delay: p.delay, ease: "easeOut" }}
                style={{
                  position: "absolute",
                  width: p.size,
                  height: p.size,
                  borderRadius: "50%",
                  backgroundColor: p.color,
                  boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
                }}
              />
            );
          })}
          <motion.div
            initial={{ opacity: 1, scale: 0.5 }}
            animate={{ opacity: 0, scale: 2.5 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="absolute w-16 h-16 rounded-full"
            style={{
              background: "radial-gradient(circle, hsl(var(--primary) / 0.4), transparent 70%)",
            }}
          />
        </div>
      )}
    </AnimatePresence>
  );
};

export default SparkleBurst;
