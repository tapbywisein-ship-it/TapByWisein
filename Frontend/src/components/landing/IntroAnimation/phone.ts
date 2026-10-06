/* =====================================================================
 * The phone — drawn as vectors every frame in phone space (100 x 206,
 * top edge = the end nearest the card). Before the tap: a dark "ready"
 * screen. At the tap: a light wave from the contact point turns the
 * screen on, then the connected profile builds in.
 * ===================================================================== */
import type { PhoneStyle, Vec } from "./types";
import { clamp, easeOutCubic, prog, roundRect, tv } from "./anim";

export const PHONE_W = 100;
export const PHONE_H = 206;

function screenPath(ctx: CanvasRenderingContext2D) {
  ctx.beginPath();
  roundRect(ctx, 3.4, 3.4, PHONE_W - 6.8, PHONE_H - 6.8, 11);
}

/** the profile block that appears after the tap */
function profile(ctx: CanvasRenderingContext2D, s: PhoneStyle, k: number, at: Vec, t: number) {
  const [cx, cy] = at;
  const step = (i: number) => easeOutCubic(clamp(k * 1.6 - i * 0.18, 0, 1));
  // avatar
  let e = step(0);
  if (e > 0) {
    ctx.save();
    ctx.globalAlpha = e;
    ctx.translate(cx - 14, cy + (1 - e) * 5);
    ctx.scale(0.72, 0.72);
    const g = ctx.createLinearGradient(-12, -12, 12, 12);
    g.addColorStop(0, "#495057");
    g.addColorStop(1, "#212529");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#dee2e6";
    ctx.beginPath(); // head + shoulders
    ctx.arc(0, -3, 4.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, 7.5, 7.5, 5, 0, Math.PI, 0);
    ctx.fill();
    // ring that completes around the avatar
    ctx.strokeStyle = s.accent;
    ctx.lineWidth = 1.6;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(0, 0, 14.6, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * easeOutCubic(prog(k, 0.1, 0.7)));
    ctx.stroke();
    // check badge
    const b = easeOutCubic(prog(k, 0.45, 0.8));
    if (b > 0) {
      ctx.translate(10.5, 10.5);
      ctx.scale(0.6 + 0.4 * b, 0.6 + 0.4 * b);
      ctx.fillStyle = s.accent;
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 1.4;
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(-2.2, 0.1);
      ctx.lineTo(-0.6, 1.8);
      ctx.lineTo(2.4, -1.6);
      ctx.stroke();
    }
    ctx.restore();
  }
  // name + role bars
  const bar = (i: number, y: number, w: number, h: number, color: string) => {
    const q = step(i);
    if (q <= 0) return;
    ctx.globalAlpha = q;
    ctx.fillStyle = color;
    ctx.beginPath();
    roundRect(ctx, cx - 2, y, w * q, h, h / 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  };
  bar(1, cy - 6, 30, 4.2, "#212529");
  bar(1.5, cy + 1.5, 20, 3, "#adb5bd");
  // "connected" chip
  const c = step(2.2);
  if (c > 0) {
    ctx.save();
    ctx.globalAlpha = c;
    ctx.translate(cx + 4, cy + 17 + (1 - c) * 4);
    ctx.scale(0.8, 0.8);
    ctx.fillStyle = s.accent;
    ctx.beginPath();
    roundRect(ctx, -22, -5.5, 44, 11, 5.5);
    ctx.fill();
    // a soft travelling light across the chip
    const sx = -22 + ((t * 0.6) % 1) * 70;
    const g = ctx.createLinearGradient(sx - 8, 0, sx + 8, 0);
    g.addColorStop(0, "rgba(255,255,255,0)");
    g.addColorStop(0.5, "rgba(255,255,255,0.35)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    roundRect(ctx, -22, -5.5, 44, 11, 5.5);
    ctx.fill();
    ctx.fillStyle = "#fff";
    for (let i = 0; i < 3; i++) {
      ctx.globalAlpha = c * 0.95;
      ctx.beginPath();
      roundRect(ctx, -13 + i * 9.5, -1.1, 7, 2.2, 1.1);
      ctx.fill();
    }
    ctx.restore();
  }
}

/** idle "ready to tap" mark: breathing contactless rings */
function ready(ctx: CanvasRenderingContext2D, s: PhoneStyle, at: Vec, t: number, alpha: number) {
  if (alpha <= 0.01) return;
  const [cx, cy] = at;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = s.accent;
  ctx.lineCap = "round";
  for (let i = 0; i < 3; i++) {
    const ph = (t * 0.9 + i / 3) % 1;
    ctx.globalAlpha = alpha * (1 - ph) * 0.9;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(cx, cy, 6 + ph * 18, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = alpha;
  ctx.fillStyle = s.accent;
  ctx.beginPath();
  ctx.arc(cx, cy, 3.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * Draw the phone. `M` maps phone space (100 x 206) to the canvas.
 * `tapPoint` is the contact point in phone space; `t` the timeline time.
 */
export function drawPhone(ctx: CanvasRenderingContext2D, M: DOMMatrix, s: PhoneStyle, t: number, tapPoint: Vec) {
  ctx.save();
  ctx.setTransform(M);

  // titanium frame
  const fr = ctx.createLinearGradient(0, 0, PHONE_W, PHONE_H);
  s.frame.forEach((c, i) => fr.addColorStop(i / (s.frame.length - 1), c));
  ctx.fillStyle = fr;
  ctx.beginPath();
  roundRect(ctx, 0, 0, PHONE_W, PHONE_H, 14);
  ctx.fill();
  ctx.fillStyle = "#050607";
  ctx.beginPath();
  roundRect(ctx, 1.5, 1.5, PHONE_W - 3, PHONE_H - 3, 12.6);
  ctx.fill();

  // screen
  const reveal = clamp(tv(s.reveal, t), 0, 1);
  const content = clamp(tv(s.content, t), 0, 1);
  screenPath(ctx);
  ctx.save();
  ctx.clip();
  const idle = ctx.createLinearGradient(0, 0, PHONE_W, PHONE_H);
  idle.addColorStop(0, s.screenIdle[0]);
  idle.addColorStop(1, s.screenIdle[1]);
  ctx.fillStyle = idle;
  ctx.fillRect(0, 0, PHONE_W, PHONE_H);
  // faint blue field near the contact point while waiting
  const [tx, ty] = tapPoint;
  const f = ctx.createRadialGradient(tx, ty, 0, tx, ty, 90);
  f.addColorStop(0, "rgba(59,130,246,0.28)");
  f.addColorStop(1, "rgba(59,130,246,0)");
  ctx.fillStyle = f;
  ctx.fillRect(0, 0, PHONE_W, PHONE_H);
  ready(ctx, s, s.contentAt, t, 1 - reveal);

  if (reveal > 0) {
    // light wave from the contact point
    const r = easeOutCubic(reveal) * 260;
    ctx.save();
    ctx.beginPath();
    ctx.arc(tx, ty, r, 0, Math.PI * 2);
    ctx.clip();
    const live = ctx.createLinearGradient(0, 0, 0, PHONE_H);
    live.addColorStop(0, s.screenLive[0]);
    live.addColorStop(1, s.screenLive[1]);
    ctx.fillStyle = live;
    ctx.fillRect(0, 0, PHONE_W, PHONE_H);
    profile(ctx, s, content, s.contentAt, t);
    ctx.restore();
    // bright leading edge of the wave
    if (reveal < 1) {
      ctx.strokeStyle = `rgba(147,197,253,${0.9 * (1 - reveal)})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(tx, ty, r, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // glass reflection
  const gl = ctx.createLinearGradient(0, 0, PHONE_W * 0.9, PHONE_H * 0.5);
  gl.addColorStop(0, "rgba(255,255,255,0.10)");
  gl.addColorStop(0.45, "rgba(255,255,255,0.03)");
  gl.addColorStop(0.46, "rgba(255,255,255,0)");
  ctx.fillStyle = gl;
  ctx.fillRect(0, 0, PHONE_W, PHONE_H);
  ctx.restore();

  // dynamic island
  ctx.fillStyle = "#000";
  ctx.beginPath();
  roundRect(ctx, 38, 7, 24, 6.5, 3.25);
  ctx.fill();

  // frame highlight
  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  roundRect(ctx, 0.5, 0.5, PHONE_W - 1, PHONE_H - 1, 13.5);
  ctx.stroke();
  ctx.restore();
}
