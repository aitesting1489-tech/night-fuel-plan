/**
 * Generates a shareable image card using HTML Canvas.
 * Returns a data URL (PNG) for download/sharing.
 */

const CARD_WIDTH = 1080;
const CARD_HEIGHT = 1920;

interface ShareCardOptions {
  title: string;
  subtitle?: string;
  score?: number | string;
  stageName?: string;
  stageEmoji?: string;
  mascotSrc: string;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawStars(ctx: CanvasRenderingContext2D, count: number) {
  for (let i = 0; i < count; i++) {
    const x = Math.random() * CARD_WIDTH;
    const y = Math.random() * CARD_HEIGHT;
    const size = Math.random() * 2.5 + 0.5;
    const alpha = Math.random() * 0.6 + 0.2;
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
}

export async function generateShareCard(options: ShareCardOptions): Promise<string> {
  const { title, subtitle, score, stageName, stageEmoji, mascotSrc } = options;

  const canvas = document.createElement("canvas");
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const ctx = canvas.getContext("2d")!;

  // ── Background gradient (deep space theme) ──
  const bgGrad = ctx.createLinearGradient(0, 0, CARD_WIDTH, CARD_HEIGHT);
  bgGrad.addColorStop(0, "#0a0a1a");
  bgGrad.addColorStop(0.4, "#0f1033");
  bgGrad.addColorStop(0.7, "#1a0a2e");
  bgGrad.addColorStop(1, "#0d0d1f");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  // ── Stars ──
  drawStars(ctx, 120);

  // ── Decorative glow circles ──
  const glowGrad1 = ctx.createRadialGradient(270, 600, 0, 270, 600, 400);
  glowGrad1.addColorStop(0, "rgba(139, 92, 246, 0.15)");
  glowGrad1.addColorStop(1, "rgba(139, 92, 246, 0)");
  ctx.fillStyle = glowGrad1;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  const glowGrad2 = ctx.createRadialGradient(810, 1300, 0, 810, 1300, 350);
  glowGrad2.addColorStop(0, "rgba(59, 130, 246, 0.12)");
  glowGrad2.addColorStop(1, "rgba(59, 130, 246, 0)");
  ctx.fillStyle = glowGrad2;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  // ── Load mascot image ──
  const mascotImage = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = mascotSrc;
  });

  // ── Draw mascot (centered, large) ──
  const mascotSize = 320;
  const mascotX = (CARD_WIDTH - mascotSize) / 2;
  const mascotY = 480;

  // Mascot glow
  const mascotGlow = ctx.createRadialGradient(
    CARD_WIDTH / 2, mascotY + mascotSize / 2, mascotSize * 0.3,
    CARD_WIDTH / 2, mascotY + mascotSize / 2, mascotSize * 0.8
  );
  mascotGlow.addColorStop(0, "rgba(139, 92, 246, 0.2)");
  mascotGlow.addColorStop(1, "rgba(139, 92, 246, 0)");
  ctx.fillStyle = mascotGlow;
  ctx.beginPath();
  ctx.arc(CARD_WIDTH / 2, mascotY + mascotSize / 2, mascotSize * 0.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.drawImage(mascotImage, mascotX, mascotY, mascotSize, mascotSize);

  // ── App branding (top) ──
  ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
  ctx.font = "500 36px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("CIRCADIA", CARD_WIDTH / 2, 180);

  // ── Moon crescent decoration ──
  ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
  ctx.beginPath();
  ctx.arc(CARD_WIDTH / 2, 320, 80, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#0f1033";
  ctx.beginPath();
  ctx.arc(CARD_WIDTH / 2 + 30, 300, 70, 0, Math.PI * 2);
  ctx.fill();

  // ── Title ──
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 64px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(title, CARD_WIDTH / 2, 900);

  // ── Score card ──
  if (score !== undefined) {
    const cardY = 960;
    const cardH = 200;
    const cardW = 600;
    const cardX = (CARD_WIDTH - cardW) / 2;

    drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 32);
    ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.font = "500 32px system-ui, -apple-system, sans-serif";
    ctx.fillText("SCORE", CARD_WIDTH / 2, cardY + 60);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 80px system-ui, -apple-system, sans-serif";
    ctx.fillText(String(score), CARD_WIDTH / 2, cardY + 150);
  }

  // ── Stage info ──
  if (stageName) {
    const stageY = score !== undefined ? 1220 : 960;
    ctx.fillStyle = "#a78bfa";
    ctx.font = "600 44px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${stageEmoji || "⭐"} ${stageName}`, CARD_WIDTH / 2, stageY);
  }

  // ── Subtitle ──
  if (subtitle) {
    const subY = stageName ? (score !== undefined ? 1290 : 1030) : (score !== undefined ? 1220 : 960);
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.font = "400 34px system-ui, -apple-system, sans-serif";
    ctx.fillText(subtitle, CARD_WIDTH / 2, subY);
  }

  // ── Bottom CTA ──
  const ctaY = 1680;
  drawRoundedRect(ctx, (CARD_WIDTH - 500) / 2, ctaY, 500, 72, 36);
  const ctaGrad = ctx.createLinearGradient(290, ctaY, 790, ctaY + 72);
  ctaGrad.addColorStop(0, "rgba(139, 92, 246, 0.3)");
  ctaGrad.addColorStop(1, "rgba(59, 130, 246, 0.3)");
  ctx.fillStyle = ctaGrad;
  ctx.fill();
  ctx.strokeStyle = "rgba(139, 92, 246, 0.4)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
  ctx.font = "600 28px system-ui, -apple-system, sans-serif";
  ctx.fillText("Play on Circadia 🦇", CARD_WIDTH / 2, ctaY + 46);

  // ── URL ──
  ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
  ctx.font = "400 24px system-ui, -apple-system, sans-serif";
  ctx.fillText("night-fuel-plan.lovable.app", CARD_WIDTH / 2, 1800);

  return canvas.toDataURL("image/png");
}

export function downloadShareCard(dataUrl: string, filename = "circadia-share.png") {
  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
