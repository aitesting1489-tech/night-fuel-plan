import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Play, RotateCcw, Droplets, Zap, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getMascotGender } from "@/lib/mascotPrefs";
import mascotBat from "@/assets/mascot-bat.png";
import mascotBatFemale from "@/assets/mascot-bat-female.png";
import Starfield from "@/components/Starfield";
import SocialShare from "@/components/SocialShare";

interface Drop {
  id: number;
  x: number;
  y: number;
  speed: number;
  type: "water" | "golden" | "poison";
  size: number;
}

const GAME_WIDTH = 360;
const GAME_HEIGHT = 520;
const MASCOT_SIZE = 56;
const DROP_SIZE = 28;

const HydrationCatch = () => {
  const navigate = useNavigate();
  const gender = getMascotGender();
  const mascotImg = gender === "girl" ? mascotBatFemale : mascotBat;

  const [gameState, setGameState] = useState<"idle" | "playing" | "over">("idle");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [highScore, setHighScore] = useState(() => {
    try { return parseInt(localStorage.getItem("circadia_catch_high") || "0"); } catch { return 0; }
  });
  const [mascotX, setMascotX] = useState(GAME_WIDTH / 2 - MASCOT_SIZE / 2);
  const [drops, setDrops] = useState<Drop[]>([]);
  const [combo, setCombo] = useState(0);
  const [splashes, setSplashes] = useState<{ id: number; x: number; y: number; text: string }[]>([]);

  const frameRef = useRef<number>(0);
  const dropIdRef = useRef(0);
  const splashIdRef = useRef(0);
  const lastSpawnRef = useRef(0);
  const difficultyRef = useRef(1);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef({ score: 0, lives: 3, combo: 0 });

  useEffect(() => { stateRef.current = { score, lives, combo }; }, [score, lives, combo]);

  const startGame = () => {
    setGameState("playing");
    setScore(0);
    setLives(3);
    setCombo(0);
    setDrops([]);
    setSplashes([]);
    difficultyRef.current = 1;
    lastSpawnRef.current = 0;
    stateRef.current = { score: 0, lives: 3, combo: 0 };
  };

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (gameState !== "playing" || !gameAreaRef.current) return;
    const rect = gameAreaRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - MASCOT_SIZE / 2;
    setMascotX(Math.max(0, Math.min(GAME_WIDTH - MASCOT_SIZE, x)));
  }, [gameState]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (gameState !== "playing" || !gameAreaRef.current) return;
    const rect = gameAreaRef.current.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left - MASCOT_SIZE / 2;
    setMascotX(Math.max(0, Math.min(GAME_WIDTH - MASCOT_SIZE, x)));
  }, [gameState]);

  useEffect(() => {
    if (gameState !== "playing") return;

    const loop = (time: number) => {
      const { score: curScore, lives: curLives, combo: curCombo } = stateRef.current;
      if (curLives <= 0) {
        setGameState("over");
        const hs = Math.max(curScore, highScore);
        setHighScore(hs);
        try { localStorage.setItem("circadia_catch_high", String(hs)); } catch {}
        return;
      }

      const spawnRate = Math.max(400, 1200 - difficultyRef.current * 40);
      if (time - lastSpawnRef.current > spawnRate) {
        lastSpawnRef.current = time;
        const rand = Math.random();
        const type = rand < 0.08 ? "poison" : rand < 0.18 ? "golden" : "water";
        const newDrop: Drop = {
          id: dropIdRef.current++,
          x: Math.random() * (GAME_WIDTH - DROP_SIZE),
          y: -DROP_SIZE,
          speed: 1.5 + difficultyRef.current * 0.15 + Math.random() * 0.5,
          type,
          size: DROP_SIZE,
        };
        setDrops(prev => [...prev, newDrop]);
      }

      setDrops(prev => {
        const next: Drop[] = [];
        let newScore = curScore;
        let newLives = curLives;
        let newCombo = curCombo;
        const newSplashes: typeof splashes = [];

        for (const d of prev) {
          const ny = d.y + d.speed;
          const catchY = GAME_HEIGHT - MASCOT_SIZE - 10;
          if (ny >= catchY && ny <= catchY + MASCOT_SIZE) {
            const mx = mascotX;
            if (d.x + d.size > mx && d.x < mx + MASCOT_SIZE) {
              if (d.type === "poison") {
                newLives = Math.max(0, newLives - 1);
                newCombo = 0;
                newSplashes.push({ id: splashIdRef.current++, x: d.x, y: ny, text: "💀 -1" });
              } else {
                const pts = d.type === "golden" ? 5 : 1;
                const comboBonus = Math.floor(newCombo / 5);
                newScore += pts + comboBonus;
                newCombo++;
                newSplashes.push({
                  id: splashIdRef.current++, x: d.x, y: ny,
                  text: d.type === "golden" ? `⭐ +${pts + comboBonus}` : `+${pts + comboBonus}`
                });
              }
              continue;
            }
          }

          if (ny > GAME_HEIGHT + 10) {
            if (d.type === "water") {
              newLives = Math.max(0, newLives - 1);
              newCombo = 0;
            }
            continue;
          }

          next.push({ ...d, y: ny });
        }

        if (newScore !== curScore) { setScore(newScore); difficultyRef.current = 1 + Math.floor(newScore / 10); }
        if (newLives !== curLives) setLives(newLives);
        if (newCombo !== curCombo) setCombo(newCombo);
        if (newSplashes.length > 0) {
          setSplashes(p => [...p, ...newSplashes]);
          setTimeout(() => setSplashes(p => p.filter(s => !newSplashes.find(ns => ns.id === s.id))), 800);
        }

        stateRef.current = { score: newScore, lives: newLives, combo: newCombo };
        return next;
      });

      frameRef.current = requestAnimationFrame(loop);
    };

    frameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameRef.current);
  }, [gameState, mascotX, highScore]);

  return (
    <div className="min-h-screen relative">
      <Starfield />
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative z-10 px-4 py-6 max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate("/noctis")} className="h-9 w-9 rounded-xl bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors active:scale-95">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <span className="font-display text-sm font-semibold text-foreground">💧 Hydration Catch</span>
          <div className="flex items-center gap-1 bg-card border border-border rounded-xl px-2.5 py-1.5">
            <Droplets className="h-3.5 w-3.5 text-hydration" />
            <span className="text-xs font-display font-bold text-foreground">{score}</span>
          </div>
        </div>

        {gameState === "playing" && (
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="flex gap-1">
              {Array.from({ length: 3 }, (_, i) => (
                <Heart key={i} className={`h-4 w-4 ${i < lives ? "text-rose-400 fill-rose-400" : "text-muted"}`} />
              ))}
            </div>
            {combo >= 3 && (
              <div className="flex items-center gap-1 bg-primary/10 rounded-lg px-2 py-0.5">
                <Zap className="h-3 w-3 text-primary" />
                <span className="text-[10px] font-bold text-primary">x{combo} COMBO</span>
              </div>
            )}
            <span className="text-[10px] text-muted-foreground">Best: {highScore}</span>
          </div>
        )}

        <div
          ref={gameAreaRef}
          onPointerMove={handlePointerMove}
          onTouchMove={handleTouchMove}
          className="relative mx-auto rounded-2xl bg-card/50 dreamy-blur border border-border overflow-hidden touch-none select-none"
          style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
        >
          {gameState === "idle" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <img src={mascotImg} alt="Noctis" width={80} height={80} className="drop-shadow-lg" />
              <p className="font-display text-sm text-foreground text-center px-8">
                Catch water drops to score!<br />
                <span className="text-[10px] text-muted-foreground">Avoid ☠️ poison drops. Don't miss 💧 water!</span>
              </p>
              <button onClick={startGame} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-display font-semibold text-sm active:scale-95 transition-transform">
                <Play className="h-4 w-4" /> Start
              </button>
              {highScore > 0 && <p className="text-[10px] text-muted-foreground">High score: {highScore}</p>}
            </div>
          )}

          {gameState === "over" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/60 dreamy-blur">
              <p className="font-display text-lg font-bold text-foreground">Game Over!</p>
              <p className="text-2xl font-bold text-primary">{score}</p>
              {score >= highScore && score > 0 && (
                <p className="text-xs font-semibold text-energy">🏆 New High Score!</p>
              )}
              <button onClick={startGame} className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground font-display font-semibold text-sm active:scale-95 transition-transform">
                <RotateCcw className="h-4 w-4" /> Play Again
              </button>
              <SocialShare
                title="Hydration Catch"
                text={`💧 I scored ${score} in Hydration Catch on Circadia! Can you beat me?`}
                className="mt-1"
              />
          )}

          {gameState === "playing" && drops.map(d => (
            <div
              key={d.id}
              className="absolute text-xl"
              style={{ left: d.x, top: d.y, width: d.size, height: d.size, textAlign: "center", lineHeight: `${d.size}px` }}
            >
              {d.type === "water" ? "💧" : d.type === "golden" ? "⭐" : "☠️"}
            </div>
          ))}

          <AnimatePresence>
            {splashes.map(s => (
              <motion.div
                key={s.id}
                initial={{ opacity: 1, y: 0, scale: 1 }}
                animate={{ opacity: 0, y: -30, scale: 1.3 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
                className="absolute text-xs font-bold text-primary pointer-events-none"
                style={{ left: s.x, top: s.y }}
              >
                {s.text}
              </motion.div>
            ))}
          </AnimatePresence>

          {gameState === "playing" && (
            <img
              src={mascotImg}
              alt="Noctis"
              width={MASCOT_SIZE}
              height={MASCOT_SIZE}
              className="absolute drop-shadow-md"
              style={{ left: mascotX, bottom: 10 }}
            />
          )}
        </div>

        <p className="text-center text-[10px] text-muted-foreground mt-4">
          {gameState === "playing" ? "Slide finger to move Noctis!" : "Catch drops, avoid poison 💜"}
        </p>
      </motion.div>
    </div>
  );
};

export default HydrationCatch;
