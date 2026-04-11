import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getMascotGender } from "@/lib/mascotPrefs";
import mascotBat from "@/assets/mascot-bat.png";
import mascotBatFemale from "@/assets/mascot-bat-female.png";
import Starfield from "@/components/Starfield";
import SocialShare from "@/components/SocialShare";
import SparkleBurst, { getIntensity } from "@/components/SparkleBurst";

const GAME_WIDTH = 360;
const GAME_HEIGHT = 520;
const BAT_SIZE = 40;
const GRAVITY = 0.35;
const FLAP_FORCE = -5.5;
const PIPE_WIDTH = 50;
const PIPE_GAP = 140;
const PIPE_SPEED = 2;

interface Pipe {
  id: number;
  x: number;
  gapY: number;
  scored: boolean;
}

const NoctisFlight = () => {
  const navigate = useNavigate();
  const gender = getMascotGender();
  const mascotImg = gender === "girl" ? mascotBatFemale : mascotBat;

  const [gameState, setGameState] = useState<"idle" | "playing" | "over">("idle");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    try { return parseInt(localStorage.getItem("circadia_flight_high") || "0"); } catch { return 0; }
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const batY = useRef(GAME_HEIGHT / 2);
  const batVel = useRef(0);
  const pipes = useRef<Pipe[]>([]);
  const pipeId = useRef(0);
  const scoreRef = useRef(0);
  const gameStateRef = useRef<"idle" | "playing" | "over">("idle");
  const imgRef = useRef<HTMLImageElement | null>(null);
  const lastPipeSpawn = useRef(0);

  useEffect(() => {
    const img = new Image();
    img.src = mascotImg;
    img.onload = () => { imgRef.current = img; };
  }, [mascotImg]);

  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);

  const flap = useCallback(() => {
    if (gameStateRef.current === "idle") {
      setGameState("playing");
      gameStateRef.current = "playing";
      batY.current = GAME_HEIGHT / 2;
      batVel.current = FLAP_FORCE;
      pipes.current = [];
      pipeId.current = 0;
      scoreRef.current = 0;
      setScore(0);
      lastPipeSpawn.current = 0;
    } else if (gameStateRef.current === "playing") {
      batVel.current = FLAP_FORCE;
    } else {
      setGameState("idle");
      gameStateRef.current = "idle";
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = GAME_WIDTH * dpr;
    canvas.height = GAME_HEIGHT * dpr;
    canvas.style.width = `${GAME_WIDTH}px`;
    canvas.style.height = `${GAME_HEIGHT}px`;
    ctx.scale(dpr, dpr);

    let frameCount = 0;

    const loop = () => {
      ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      frameCount++;

      const isPlaying = gameStateRef.current === "playing";

      const grad = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
      const isDark = !document.documentElement.classList.contains("light");
      if (isDark) {
        grad.addColorStop(0, "hsl(220, 40%, 8%)");
        grad.addColorStop(1, "hsl(220, 35%, 14%)");
      } else {
        grad.addColorStop(0, "hsl(210, 30%, 95%)");
        grad.addColorStop(1, "hsl(210, 20%, 88%)");
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

      ctx.fillStyle = isDark ? "rgba(120, 220, 200, 0.15)" : "rgba(100, 180, 170, 0.08)";
      for (let i = 0; i < 30; i++) {
        const sx = (i * 97 + frameCount * 0.1) % GAME_WIDTH;
        const sy = (i * 53 + Math.sin(frameCount * 0.005 + i) * 5) % GAME_HEIGHT;
        ctx.beginPath();
        ctx.arc(sx, sy, 1, 0, Math.PI * 2);
        ctx.fill();
      }

      if (isPlaying) {
        batVel.current += GRAVITY;
        batY.current += batVel.current;

        if (frameCount - lastPipeSpawn.current > 100) {
          lastPipeSpawn.current = frameCount;
          const gapY = 80 + Math.random() * (GAME_HEIGHT - PIPE_GAP - 160);
          pipes.current.push({ id: pipeId.current++, x: GAME_WIDTH, gapY, scored: false });
        }

        for (const p of pipes.current) {
          p.x -= PIPE_SPEED;
          if (!p.scored && p.x + PIPE_WIDTH < GAME_WIDTH / 2 - BAT_SIZE / 2) {
            p.scored = true;
            scoreRef.current++;
            setScore(scoreRef.current);
          }
        }
        pipes.current = pipes.current.filter(p => p.x > -PIPE_WIDTH - 10);

        const bx = GAME_WIDTH / 2 - BAT_SIZE / 2;
        const by = batY.current;
        let hit = by < 0 || by + BAT_SIZE > GAME_HEIGHT;

        for (const p of pipes.current) {
          if (bx + BAT_SIZE > p.x && bx < p.x + PIPE_WIDTH) {
            if (by < p.gapY || by + BAT_SIZE > p.gapY + PIPE_GAP) {
              hit = true;
            }
          }
        }

        if (hit) {
          gameStateRef.current = "over";
          setGameState("over");
          const hs = Math.max(scoreRef.current, highScore);
          setHighScore(hs);
          try { localStorage.setItem("circadia_flight_high", String(hs)); } catch {}
        }
      }

      const pipeColor = isDark ? "hsl(174, 50%, 35%)" : "hsl(174, 45%, 55%)";
      const pipeBorder = isDark ? "hsl(174, 60%, 45%)" : "hsl(174, 55%, 40%)";
      for (const p of pipes.current) {
        ctx.fillStyle = pipeColor;
        ctx.fillRect(p.x, 0, PIPE_WIDTH, p.gapY);
        ctx.strokeStyle = pipeBorder;
        ctx.lineWidth = 2;
        ctx.strokeRect(p.x, 0, PIPE_WIDTH, p.gapY);

        ctx.fillStyle = pipeColor;
        ctx.fillRect(p.x, p.gapY + PIPE_GAP, PIPE_WIDTH, GAME_HEIGHT - p.gapY - PIPE_GAP);
        ctx.strokeRect(p.x, p.gapY + PIPE_GAP, PIPE_WIDTH, GAME_HEIGHT - p.gapY - PIPE_GAP);

        ctx.fillStyle = pipeBorder;
        ctx.fillRect(p.x - 4, p.gapY - 16, PIPE_WIDTH + 8, 16);
        ctx.fillRect(p.x - 4, p.gapY + PIPE_GAP, PIPE_WIDTH + 8, 16);
      }

      const bx2 = GAME_WIDTH / 2 - BAT_SIZE / 2;
      const by2 = isPlaying ? batY.current : GAME_HEIGHT / 2 + Math.sin(frameCount * 0.03) * 8;
      const rotation = isPlaying ? Math.min(batVel.current * 3, 30) * Math.PI / 180 : 0;

      if (imgRef.current) {
        ctx.save();
        ctx.translate(bx2 + BAT_SIZE / 2, by2 + BAT_SIZE / 2);
        ctx.rotate(rotation);
        ctx.drawImage(imgRef.current, -BAT_SIZE / 2, -BAT_SIZE / 2, BAT_SIZE, BAT_SIZE);
        ctx.restore();
      }

      if (isPlaying) {
        ctx.fillStyle = isDark ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.6)";
        ctx.font = "bold 28px system-ui";
        ctx.textAlign = "center";
        ctx.fillText(String(scoreRef.current), GAME_WIDTH / 2, 50);
      }

      if (gameStateRef.current === "idle") {
        ctx.fillStyle = isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.5)";
        ctx.font = "bold 16px system-ui";
        ctx.textAlign = "center";
        ctx.fillText("Tap to fly!", GAME_WIDTH / 2, GAME_HEIGHT / 2 + 60);
        ctx.font = "11px system-ui";
        ctx.fillText("Navigate through the pipes", GAME_WIDTH / 2, GAME_HEIGHT / 2 + 82);
        if (highScore > 0) {
          ctx.fillText(`Best: ${highScore}`, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 100);
        }
      }

      if (gameStateRef.current === "over") {
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        ctx.fillStyle = "white";
        ctx.font = "bold 24px system-ui";
        ctx.textAlign = "center";
        ctx.fillText("Game Over!", GAME_WIDTH / 2, GAME_HEIGHT / 2 - 30);
        ctx.font = "bold 36px system-ui";
        ctx.fillStyle = "hsl(174, 60%, 56%)";
        ctx.fillText(String(scoreRef.current), GAME_WIDTH / 2, GAME_HEIGHT / 2 + 15);
        if (scoreRef.current >= highScore && scoreRef.current > 0) {
          ctx.font = "bold 14px system-ui";
          ctx.fillStyle = "hsl(45, 70%, 60%)";
          ctx.fillText("🏆 New High Score!", GAME_WIDTH / 2, GAME_HEIGHT / 2 + 42);
        }
        ctx.font = "13px system-ui";
        ctx.fillStyle = "rgba(255,255,255,0.6)";
        ctx.fillText("Tap to restart", GAME_WIDTH / 2, GAME_HEIGHT / 2 + 70);
      }

      frameRef.current = requestAnimationFrame(loop);
    };

    frameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameRef.current);
  }, [mascotImg, highScore]);

  return (
    <div className="min-h-screen relative">
      <Starfield />
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative z-10 px-4 py-6 max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate("/noctis")} className="h-9 w-9 rounded-xl bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors active:scale-95">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <span className="font-display text-sm font-semibold text-foreground">🦇 Noctis Flight</span>
          <div className="flex items-center gap-1 bg-card border border-border rounded-xl px-2.5 py-1.5">
            <span className="text-xs font-display font-bold text-foreground">🏆 {highScore}</span>
          </div>
        </div>

        <canvas
          ref={canvasRef}
          onClick={flap}
          onTouchStart={(e) => { e.preventDefault(); flap(); }}
          className="mx-auto rounded-2xl border border-border cursor-pointer touch-none select-none"
          style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
        />

        {gameState === "over" ? (
          <div className="flex flex-col items-center gap-2 mt-3">
            <SparkleBurst trigger={gameState === "over"} intensity={getIntensity(score, [5, 15])} />
            <SocialShare
              title="Noctis Flight"
              text={`🦇 I scored ${score} in Noctis Flight on Circadia! Can you beat me?`}
            />
          </div>
        ) : (
          <p className="text-center text-[10px] text-muted-foreground mt-4">
            Tap or click to flap! 🦇
          </p>
        )}
      </motion.div>
    </div>
  );
};

export default NoctisFlight;
