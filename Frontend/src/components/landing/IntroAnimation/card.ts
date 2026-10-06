/* =====================================================================
 * The TAP card — brushed titanium, drawn once into a texture, then
 * placed on the card quad every frame with a live reflection.
 * Card space is 1012 x 638 (ISO card proportions, ~11.8 px / mm).
 * ===================================================================== */
import type { CardStyle } from "./types";
import { clamp, rng, roundRect, tv } from "./anim";

export const CARD_W = 1012;
export const CARD_H = 638;
const R = 40; // corner radius

const FONT = '"Manrope Variable", Manrope, "Segoe UI", system-ui, -apple-system, sans-serif';

/** contactless symbol: three arcs opening to the right */
function contactless(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, color: string) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineCap = "round";
  ctx.lineWidth = s * 0.085;
  for (let i = 0; i < 4; i++) {
    const r = s * (0.18 + i * 0.2);
    ctx.globalAlpha = 1 - i * 0.16;
    ctx.beginPath();
    ctx.arc(x - s * 0.35, y, r, -0.62, 0.62);
    ctx.stroke();
  }
  ctx.restore();
}

/** the TAP monogram: graphite tile with a silver T and a blue dot */
function monogram(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, accent: string) {
  ctx.save();
  const g = ctx.createLinearGradient(x, y, x, y + s);
  g.addColorStop(0, "#4b5258");
  g.addColorStop(0.5, "#2b3035");
  g.addColorStop(1, "#1d2125");
  ctx.fillStyle = g;
  ctx.beginPath();
  roundRect(ctx, x, y, s, s, s * 0.27);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.lineWidth = 2;
  ctx.stroke();
  const t = ctx.createLinearGradient(x, y + s * 0.28, x, y + s * 0.72);
  t.addColorStop(0, "#f8f9fa");
  t.addColorStop(1, "#adb5bd");
  ctx.fillStyle = t;
  const u = s / 32; // same geometry as the navbar mark
  ctx.beginPath();
  ctx.moveTo(x + 9 * u, y + 9.25 * u);
  ctx.lineTo(x + 23 * u, y + 9.25 * u);
  ctx.lineTo(x + 23 * u, y + 12.35 * u);
  ctx.lineTo(x + 17.65 * u, y + 12.35 * u);
  ctx.lineTo(x + 17.65 * u, y + 23 * u);
  ctx.lineTo(x + 14.35 * u, y + 23 * u);
  ctx.lineTo(x + 14.35 * u, y + 12.35 * u);
  ctx.lineTo(x + 9 * u, y + 12.35 * u);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(x + 23.2 * u, y + 22.4 * u, 1.55 * u, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Paint the static card face. Call again after web fonts load. */
export function paintCardTexture(style: CardStyle, canvas = document.createElement("canvas")) {
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, CARD_W, CARD_H);
  ctx.save();
  ctx.beginPath();
  roundRect(ctx, 0, 0, CARD_W, CARD_H, R);
  ctx.clip();

  // titanium base
  const base = ctx.createLinearGradient(0, 0, CARD_W, CARD_H);
  style.metal.forEach((c, i) => base.addColorStop(i / (style.metal.length - 1), c));
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  // brushed grain: fine horizontal strokes
  const rand = rng(7);
  for (let i = 0; i < 1400; i++) {
    const y = rand() * CARD_H, x = rand() * CARD_W * 1.2 - CARD_W * 0.1, len = 120 + rand() * 520;
    const light = rand() > 0.5;
    ctx.strokeStyle = light ? `rgba(255,255,255,${0.05 + rand() * 0.1})` : `rgba(52,58,64,${0.025 + rand() * 0.05})`;
    ctx.lineWidth = 0.6 + rand() * 0.9;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + len, y + (rand() - 0.5) * 0.6);
    ctx.stroke();
  }

  // soft studio falloff (top-left light, bottom-right shade)
  const fall = ctx.createRadialGradient(CARD_W * 0.18, CARD_H * 0.05, 40, CARD_W * 0.4, CARD_H * 0.4, CARD_W * 0.95);
  fall.addColorStop(0, "rgba(255,255,255,0.35)");
  fall.addColorStop(1, "rgba(33,37,41,0.12)");
  ctx.fillStyle = fall;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  // monogram + contactless
  monogram(ctx, 64, 60, 92, style.accent);
  contactless(ctx, CARD_W - 112, 106, 76, style.ink);

  // wordmark
  ctx.fillStyle = style.ink;
  ctx.textBaseline = "alphabetic";
  ctx.font = `800 46px ${FONT}`;
  ctx.letterSpacing = "6px";
  ctx.fillText(style.wordmark, 66, CARD_H - 92);
  ctx.font = `700 17px ${FONT}`;
  ctx.letterSpacing = "5px";
  ctx.fillStyle = "rgba(73,80,87,0.85)";
  ctx.fillText("SMART NETWORKING CARD", 68, CARD_H - 58);
  ctx.letterSpacing = "0px";

  // blue hairline accent
  ctx.fillStyle = style.accent;
  ctx.fillRect(CARD_W - 196, CARD_H - 74, 92, 4);
  ctx.beginPath();
  ctx.arc(CARD_W - 84, CARD_H - 72, 7, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  // machined edge: light on the top-left, dark on the bottom-right
  const edge = ctx.createLinearGradient(0, 0, CARD_W, CARD_H);
  edge.addColorStop(0, "rgba(255,255,255,0.95)");
  edge.addColorStop(0.5, "rgba(173,181,189,0.6)");
  edge.addColorStop(1, "rgba(52,58,64,0.55)");
  ctx.strokeStyle = edge;
  ctx.lineWidth = 4;
  ctx.beginPath();
  roundRect(ctx, 2, 2, CARD_W - 4, CARD_H - 4, R - 2);
  ctx.stroke();
  return canvas;
}

/**
 * Draw the card. `M` maps card space (CARD_W x CARD_H) to the canvas.
 * `angle` is the hand's rotation (deg) — it drives the reflection.
 */
export function drawCard(
  ctx: CanvasRenderingContext2D,
  tex: HTMLCanvasElement,
  M: DOMMatrix,
  style: CardStyle,
  t: number,
  angle: number,
  px = 1, // canvas px per stage px (shadow sizes are in canvas px)
) {
  ctx.save();
  ctx.setTransform(M);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // body thickness + contact shadow
  ctx.shadowColor = style.shadow.color;
  ctx.shadowBlur = style.shadow.blur * px;
  ctx.shadowOffsetX = style.shadow.offset[0] * px;
  ctx.shadowOffsetY = style.shadow.offset[1] * px;
  ctx.fillStyle = "#7d858c";
  ctx.beginPath();
  roundRect(ctx, 3, 12, CARD_W - 2, CARD_H - 6, R);
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.fillStyle = "#5c636a";
  ctx.beginPath();
  roundRect(ctx, 2, 8, CARD_W - 2, CARD_H - 4, R);
  ctx.fill();

  // face
  ctx.drawImage(tex, 0, 0, CARD_W, CARD_H);

  // reflection: a soft diagonal band that rides the hand's rotation, plus the tap sweep
  const sweep = tv(style.sheen.sweep, t);
  const pos = clamp(0.62 - angle * 0.045, -0.4, 1.4);
  ctx.beginPath();
  roundRect(ctx, 0, 0, CARD_W, CARD_H, R);
  ctx.clip();
  const band = (p: number, a: number, w: number) => {
    if (a <= 0.001) return;
    const cx = -CARD_W * 0.3 + p * CARD_W * 1.6;
    const g = ctx.createLinearGradient(cx - w, 0, cx + w, CARD_H * 0.35);
    g.addColorStop(0, "rgba(255,255,255,0)");
    g.addColorStop(0.5, `rgba(255,255,255,${a})`);
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, CARD_W, CARD_H);
  };
  band(pos, style.sheen.strength, 260);
  if (sweep > 0 && sweep < 1) band(sweep, 0.75 * Math.sin(Math.PI * sweep), 150);
  ctx.restore();
}
