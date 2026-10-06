/* =====================================================================
 * The tap — a short, precise moment:
 *   flash  : a small bright core where the card meets the phone
 *   rings  : three thin rings that travel across the phone's plane
 *            (drawn in phone space, so they sit in perspective)
 *   sparks : a handful of fine points that drift out and fade
 * Everything is a pure function of time, so seeking is exact.
 * ===================================================================== */
import type { TapStyle } from "./types";
import { easeOutCubic, easeOutQuint, prog, rng, tv } from "./anim";

export function drawTap(
  ctx: CanvasRenderingContext2D,
  phoneM: DOMMatrix, // phone space -> canvas
  s: TapStyle,
  t: number,
) {
  const dt = t - s.time;
  if (dt < -0.05 || dt > 1.6) return;
  const [px, py] = s.point;
  ctx.save();
  ctx.globalCompositeOperation = "screen";

  // rings, in the phone's plane
  ctx.setTransform(phoneM);
  for (const r of s.rings) {
    const k = prog(t, s.time + r.delay, s.time + r.delay + r.duration);
    if (k <= 0 || k >= 1) continue;
    const rad = r.from + (r.to - r.from) * easeOutQuint(k);
    const a = r.alpha * Math.min(1, k / 0.06) * (1 - k) ** 1.6;
    ctx.strokeStyle = `rgba(${r.color},${a})`;
    ctx.lineWidth = r.width * (1 - k * 0.75);
    ctx.beginPath();
    ctx.arc(px, py, rad, 0, Math.PI * 2);
    ctx.stroke();
  }

  // flash + sparks in canvas space around the contact point
  const c = phoneM.transformPoint(new DOMPoint(px, py));
  const unit = Math.hypot(phoneM.a, phoneM.b); // canvas px per phone unit
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const fo = tv(s.flash.opacity, t);
  if (fo > 0.001) {
    const rad = s.flash.radius * tv(s.flash.size, t) * unit;
    const g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, rad);
    g.addColorStop(0, `rgba(255,255,255,${fo})`);
    g.addColorStop(0.18, `rgba(239,246,255,${fo * 0.85})`);
    g.addColorStop(0.5, `rgba(147,197,253,${fo * 0.28})`);
    g.addColorStop(1, "rgba(147,197,253,0)");
    ctx.fillStyle = g;
    ctx.fillRect(c.x - rad, c.y - rad, rad * 2, rad * 2);
  }

  const sp = s.sparks;
  const k = prog(t, s.time, s.time + sp.duration);
  if (k > 0 && k < 1) {
    const rand = rng(sp.seed);
    for (let i = 0; i < sp.count; i++) {
      const ang = rand() * Math.PI * 2, far = 0.45 + rand() * 0.55, delay = rand() * 0.18, size = 0.5 + rand() * 0.5;
      const q = prog(k, delay, 1);
      if (q <= 0 || q >= 1) continue;
      const d = easeOutCubic(q) * sp.distance * far * unit;
      const x = c.x + Math.cos(ang) * d, y = c.y + Math.sin(ang) * d * 0.8;
      const a = (1 - q) ** 1.3;
      const r = sp.size * size * unit * (1 - q * 0.6);
      const g = ctx.createRadialGradient(x, y, 0, x, y, r * 3);
      g.addColorStop(0, `rgba(${sp.color},${a})`);
      g.addColorStop(0.3, `rgba(${sp.color},${a * 0.45})`);
      g.addColorStop(1, `rgba(${sp.color},0)`);
      ctx.fillStyle = g;
      ctx.fillRect(x - r * 3, y - r * 3, r * 6, r * 6);
    }
  }
  ctx.restore();
}
