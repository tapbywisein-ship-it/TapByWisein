/* Small animation helpers shared by the engine and the drawn objects. */
import type { Ease, Key, Quad } from "./types";

export const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
/** 0..1 progress of t through [a, b] */
export const prog = (t: number, a: number, b: number) => clamp((t - a) / (b - a), 0, 1);
export const easeOutCubic = (x: number) => 1 - (1 - x) ** 3;
export const easeOutQuint = (x: number) => 1 - (1 - x) ** 5;
export const easeInOutCubic = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);

export function bezier(e: Ease | undefined, x: number): number {
  if (!e || e === "linear") return x;
  const [x1, y1, x2, y2] = e;
  let u = x;
  for (let i = 0; i < 12; i++) {
    const bx = 3 * (1 - u) ** 2 * u * x1 + 3 * (1 - u) * u * u * x2 + u ** 3;
    const d = 3 * (1 - u) ** 2 * x1 + 6 * (1 - u) * u * (x2 - x1) + 3 * u * u * (1 - x2);
    u = clamp(u - (bx - x) / (Math.abs(d) < 1e-6 ? 1e-6 : d), 0, 1);
  }
  return 3 * (1 - u) ** 2 * u * y1 + 3 * (1 - u) * u * u * y2 + u ** 3;
}

/** keyframe track -> value at t (ease of a key applies to the segment after it) */
export function track<K extends { t: number; ease?: Ease }>(keys: K[] | undefined, t: number, prop: keyof K): number {
  if (!keys || !keys.length) return NaN;
  const get = (k: K) => k[prop] as unknown as number;
  if (t <= keys[0].t) return get(keys[0]);
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i], b = keys[i + 1];
    if (t < b.t) return get(a) + (get(b) - get(a)) * bezier(a.ease || "linear", (t - a.t) / (b.t - a.t));
  }
  return get(keys[keys.length - 1]);
}
export const tv = (keys: Key[] | undefined, t: number) => track(keys, t, "v");

/** matrix mapping local (0..w, 0..h) onto a parallelogram */
export function quadMatrix(q: Quad, w: number, h: number) {
  const [x0, y0] = q.tl;
  return new DOMMatrix([(q.tr[0] - x0) / w, (q.tr[1] - y0) / w, (q.bl[0] - x0) / h, (q.bl[1] - y0) / h, x0, y0]);
}

/** deterministic pseudo-random sequence (mulberry32) */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function roundRect(ctx: CanvasRenderingContext2D | Path2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
