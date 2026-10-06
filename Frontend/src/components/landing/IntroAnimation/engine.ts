/* =====================================================================
 * TapByWiseIN intro — renderer
 * Mountable, no globals, cover-fits its container. Reads a Timeline
 * (timeline.ts), the traced character data (assets/characters.bin +
 * characters.meta.json) and the hand tracks (assets/rig.json).
 *
 * Layers, back to front:
 *   1. plates      DOM <img>, camera transform, grade/blur/opacity
 *   2. characters  canvas
 *        shot "hall": one traced frame per source frame (cleaned)
 *        shot "tap" : hand rig — one clean frame of each hand moved by
 *                     its tracked motion — with the designed phone
 *                     between the left hand's layers and the designed
 *                     card under the right hand's fingers; cross-fades
 *                     into a clean two-shot hold for the pull-back
 *   3. tap         canvas (flash, rings in the phone's plane, sparks)
 *   4. sparkle     SVG (as supplied)
 *   5. label       HTML "CONNECTED" (badge draws, letters resolve)
 *   6. loop fade
 * ===================================================================== */
import type { CameraKey, CharacterMeta, RigTracks, Shot, TapIntroAPI, Timeline } from "./types";
import { clamp, easeInOutCubic, easeOutCubic, lerp, prog, quadMatrix, track, tv } from "./anim";
import { CARD_H, CARD_W, drawCard, paintCardTexture } from "./card";
import { PHONE_H, PHONE_W, drawPhone } from "./phone";
import { drawTap } from "./tap";

export interface EngineData {
  bin: ArrayBuffer;
  meta: CharacterMeta;
  rig: RigTracks;
}
export interface EngineOptions {
  onCue?: (name: string) => void;
}

type Piece = Float32Array[][][]; // [side][layer][polygon]

async function decode(bin: ArrayBuffer, meta: CharacterMeta): Promise<Piece[]> {
  const stream = new Blob([bin]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  const buf = new Uint8Array(await new Response(stream).arrayBuffer());
  let p = 0;
  const uv = () => {
    let r = 0, s = 0, b: number;
    do { b = buf[p++]; r += (b & 0x7f) * 2 ** s; s += 7; } while (b & 0x80);
    return r;
  };
  const zz = () => { const n = uv(); return n % 2 ? -(n + 1) / 2 : n / 2; };
  const NL = meta.layers.length, out: Piece[] = [];
  for (let f = 0; f < meta.frameCount; f++) {
    const fr: Float32Array[][][] = [];
    for (let s = 0; s < 2; s++) {
      const side: Float32Array[][] = [];
      for (let l = 0; l < NL; l++) {
        const np = uv(), polys: Float32Array[] = [];
        for (let i = 0; i < np; i++) {
          const n = uv(), a = new Float32Array(n * 2);
          let x = zz(), y = zz();
          a[0] = x / 2; a[1] = y / 2;
          for (let j = 1; j < n; j++) { x += zz(); y += zz(); a[2 * j] = x / 2; a[2 * j + 1] = y / 2; }
          polys.push(a);
        }
        side.push(polys);
      }
      fr.push(side);
    }
    out.push(fr);
  }
  return out;
}

export function createTapIntro(root: HTMLElement, TL: Timeline, data: EngineData, opts: EngineOptions = {}) {
  const W = TL.width, H = TL.height, { meta, rig } = data;
  const mk = <K extends keyof HTMLElementTagNameMap>(tag: K, cls: string, parent: HTMLElement) => {
    const e = document.createElement(tag); e.className = cls; parent.appendChild(e); return e;
  };

  /* ---------- DOM ---------- */
  const stage = mk("div", "ti-stage", root);
  const platesEl = mk("div", "ti-plates", stage);
  const charCanvas = mk("canvas", "ti-layer", stage);
  const fxCanvas = mk("canvas", "ti-layer", stage);
  for (const c of [charCanvas, fxCanvas]) { c.width = W; c.height = H; }
  if (TL.sparkle) {
    const { x, y, r, color } = TL.sparkle, k = 0.18 * r;
    stage.insertAdjacentHTML("beforeend",
      `<svg class="ti-layer" viewBox="0 0 ${W} ${H}" aria-hidden="true"><path fill="${color}" d="M${x} ${y - r} Q${x + k} ${y - k} ${x + r} ${y} Q${x + k} ${y + k} ${x} ${y + r} Q${x - k} ${y + k} ${x - r} ${y} Q${x - k} ${y - k} ${x} ${y - r}Z"/></svg>`);
  }
  const label = mk("div", "ti-label", root);
  label.innerHTML =
    `<span class="ti-sheen" aria-hidden="true"></span>` +
    `<svg class="ti-badge" viewBox="0 0 24 24" aria-hidden="true"><circle class="ti-badge-bg" cx="12" cy="12" r="10.5"/>` +
    `<circle class="ti-badge-ring" cx="12" cy="12" r="10.5" pathLength="1"/><path class="ti-badge-check" d="M7.4 12.3l3.1 3.1 6.1-6.7" pathLength="1"/></svg>` +
    `<span class="ti-label-text">${[...TL.label.text].map((c) => `<span class="ti-ch">${c}</span>`).join("")}</span>`;
  const ring = label.querySelector<SVGElement>(".ti-badge-ring")!;
  const check = label.querySelector<SVGElement>(".ti-badge-check")!;
  const sheenEl = label.querySelector<HTMLElement>(".ti-sheen")!;
  const chars = [...label.querySelectorAll<HTMLElement>(".ti-ch")];
  const fadeEl = mk("div", "ti-fade", root);
  fadeEl.style.background = TL.fade.color;

  const cc = charCanvas.getContext("2d")!, fx = fxCanvas.getContext("2d")!;
  const off = document.createElement("canvas"); // for cross-fading whole groups
  const oc = off.getContext("2d")!;
  /* canvases draw at on-screen resolution (RS = backing px per stage px), not at 1920x1080 */
  let RS = 1, CW = W, CH = H, scaleM = new DOMMatrix();
  function setResolution(rs: number) {
    RS = rs; CW = Math.round(W * rs); CH = Math.round(H * rs); scaleM = new DOMMatrix().scale(rs);
    for (const c of [charCanvas, fxCanvas, off]) { c.width = CW; c.height = CH; }
  }
  setResolution(1);
  let cardTex = paintCardTexture(TL.card);
  document.fonts?.ready.then(() => { cardTex = paintCardTexture(TL.card, cardTex); if (isReady) render(time); });

  const shotAt = (t: number): Shot => TL.shots.find((s) => t >= s.start && t < s.end) || TL.shots[TL.shots.length - 1];

  /* ---------- camera ---------- */
  function camera(world: string, t: number) {
    const k: CameraKey[] = TL.camera[world];
    if (k[0].lz === undefined) k.forEach((key) => (key.lz = Math.log(key.zoom)));
    let z = Math.exp(track(k, t, "lz"));
    if (world === "B") z *= tv(TL.tap.impact, t) || 1;
    const cx = track(k, t, "cx"), cy = track(k, t, "cy"), r = track(k, t, "rot");
    return new DOMMatrix().translate(W / 2, H / 2).rotate(0, 0, (-r * 180) / Math.PI).scale(z).translate(-cx, -cy);
  }

  /* ---------- 1. plates (grade is static; only blur/opacity/transform change) ---------- */
  const plates = TL.plates.map((p) => {
    const img = new Image();
    img.src = p.src; img.className = "ti-plate"; img.alt = ""; img.decoding = "async";
    img.style.width = p.size[0] + "px"; img.style.height = p.size[1] + "px";
    platesEl.appendChild(img);
    return { p, img, last: { op: "", tf: "", fl: "" } };
  });
  function drawPlates(t: number) {
    for (const pl of plates) {
      const { p, img, last } = pl;
      const on = t >= p.visible[0] && t < p.visible[1];
      const op = String(on ? (p.opacity ? tv(p.opacity, t) : 1) : 0);
      if (op !== last.op) { img.style.opacity = op; last.op = op; }
      if (op === "0") continue;
      const tf = camera(p.world, t).multiply(new DOMMatrix(p.place)).toString();
      if (tf !== last.tf) { img.style.transform = tf; last.tf = tf; }
      const b = p.blur ? tv(p.blur, t) : 0;
      const fl = [TL.plateGrade !== "none" ? TL.plateGrade : "", b > 0.05 ? `blur(${b.toFixed(1)}px)` : ""].join(" ").trim() || "none";
      if (fl !== last.fl) { img.style.filter = fl; last.fl = fl; }
    }
  }

  /* ---------- 2. characters ---------- */
  const LAYERS = meta.layers, NL = LAYERS.length;
  let pieces: Piece[] | null = null;
  const frameCache = new Map<number, Path2D>();
  const pieceCache = new Map<number, Path2D>();
  function path(f: number, s: number, l: number, permanent = false) {
    const key = f * 64 + s * 8 + l, cache = permanent ? pieceCache : frameCache;
    let P = cache.get(key);
    if (!P) {
      P = new Path2D();
      for (const a of pieces![f][s][l]) {
        P.moveTo(a[0], a[1]);
        for (let j = 2; j < a.length; j += 2) P.lineTo(a[j], a[j + 1]);
        P.closePath();
      }
      if (!permanent && cache.size > 300) cache.delete(cache.keys().next().value!);
      cache.set(key, P);
    }
    return P;
  }
  const seam = TL.characters.seam;
  function fillLayers(ctx: CanvasRenderingContext2D, f: number, s: number, from: number, to: number, permanent: boolean) {
    for (let l = from; l < to; l++) {
      const P = path(f, s, l, permanent), c = TL.characters.colors[LAYERS[l]];
      ctx.fillStyle = c; ctx.fill(P, "evenodd");
      if (seam > 0) { ctx.strokeStyle = c; ctx.stroke(P); }
    }
  }
  function prep(ctx: CanvasRenderingContext2D, m: DOMMatrix) {
    ctx.setTransform(m);
    ctx.lineWidth = seam; ctx.lineJoin = "round";
  }

  function drawHall(t: number, shot: Shot) {
    const m = scaleM.multiply(camera(shot.world, t));
    const f = clamp(Math.round(t * meta.fps), 0, meta.hallFrames - 1);
    const R = TL.characters.reflection;
    if (R && shot.id === R.shot) {
      for (let s = 0; s < 2; s++) {
        const bb = meta.bbox[f][s]; if (!bb) continue;
        const floorY = bb[3];
        cc.save();
        cc.setTransform(m.multiply(new DOMMatrix().translate(0, 2 * floorY).scale(1, -1)));
        cc.globalAlpha = R.opacity; cc.fillStyle = R.color;
        cc.beginPath(); cc.rect(bb[0] - 50, floorY - R.fadeLength, bb[2] - bb[0] + 100, R.fadeLength); cc.clip();
        for (const l of [LAYERS.indexOf("charbase"), LAYERS.indexOf("black")]) cc.fill(path(f, s, l), "evenodd");
        cc.restore();
      }
      cc.save(); cc.globalCompositeOperation = "destination-out"; cc.setTransform(m);
      for (let s = 0; s < 2; s++) {
        const bb = meta.bbox[f][s]; if (!bb) continue;
        const g = cc.createLinearGradient(0, bb[3], 0, bb[3] + R.fadeLength);
        g.addColorStop(0, "rgba(0,0,0,0.15)"); g.addColorStop(1, "rgba(0,0,0,1)");
        cc.fillStyle = g; cc.fillRect(bb[0] - 60, bb[3] + 0.5, bb[2] - bb[0] + 120, R.fadeLength);
      }
      cc.restore();
    }
    prep(cc, m);
    for (let s = 0; s < 2; s++) fillLayers(cc, f, s, 0, NL, false);
  }

  /** rigid hand transform (reference frame -> time t), interpolated between source frames */
  function hand(side: "L" | "R", t: number) {
    const tr = rig[side], fi = clamp(t * meta.fps - tr.start, 0, tr.keys.length - 1);
    const i = Math.floor(fi), j = Math.min(i + 1, tr.keys.length - 1), k = fi - i;
    const a = tr.keys[i], b = tr.keys[j];
    const ang = lerp(a[0], b[0], k), tx = lerp(a[1], b[1], k), ty = lerp(a[2], b[2], k);
    const [ox, oy] = tr.origin;
    return { ang, M: new DOMMatrix().translate(ox + tx, oy + ty).rotate(ang).translate(-ox, -oy) };
  }

  let phoneM: DOMMatrix | null = null;
  function drawRig(ctx: CanvasRenderingContext2D, m: DOMMatrix, t: number) {
    const P = meta.pieces.rig, L = hand("L", t), Rh = hand("R", t);
    const ML = m.multiply(L.M), MR = m.multiply(Rh.M);
    // left arm: light layers (cuff) -> phone -> dark layers (hand over the phone)
    prep(ctx, ML); fillLayers(ctx, P, 0, 0, 4, true);
    phoneM = ML.multiply(quadMatrix(TL.rig.phone, PHONE_W, PHONE_H));
    drawPhone(ctx, phoneM, TL.phone, t, TL.tap.point);
    prep(ctx, ML); fillLayers(ctx, P, 0, 4, NL, true);
    // card, pressed around the contact point, under the right hand's fingers
    let cardM = MR.multiply(quadMatrix(TL.rig.card, CARD_W, CARD_H));
    const press = tv(TL.card.press, t);
    if (press !== 1) {
      const c = cardM.inverse().transformPoint(phoneM.transformPoint(new DOMPoint(...TL.tap.point)));
      cardM = cardM.translate(c.x, c.y).scale(press).translate(-c.x, -c.y);
    }
    drawCard(ctx, cardTex, cardM, TL.card, t, Rh.ang, RS);
    prep(ctx, MR); fillLayers(ctx, P, 1, 0, NL, true);
  }
  function drawHold(ctx: CanvasRenderingContext2D, m: DOMMatrix) {
    prep(ctx, m);
    for (let s = 0; s < 2; s++) fillLayers(ctx, meta.pieces.hold, s, 0, NL, true);
  }
  function composite(alpha: number, blur: number, draw: (ctx: CanvasRenderingContext2D) => void) {
    if (alpha <= 0.001) return;
    if (alpha >= 0.999 && blur < 0.05) { draw(cc); return; }
    oc.setTransform(1, 0, 0, 1, 0, 0); oc.clearRect(0, 0, CW, CH);
    draw(oc);
    cc.save(); cc.setTransform(1, 0, 0, 1, 0, 0);
    cc.globalAlpha = alpha; if (blur >= 0.05) cc.filter = `blur(${blur * RS}px)`;
    cc.drawImage(off, 0, 0); cc.restore();
  }

  function drawCharacters(t: number, shot: Shot) {
    cc.setTransform(1, 0, 0, 1, 0, 0); cc.clearRect(0, 0, CW, CH);
    phoneM = null;
    if (!pieces) return;
    if (shot.mode === "frames") { drawHall(t, shot); return; }
    const m = scaleM.multiply(camera(shot.world, t)), X = TL.rig.crossfade;
    const kin = easeInOutCubic(prog(t, ...X.holdIn)), kout = easeInOutCubic(prog(t, ...X.rigOut));
    composite(kin, X.blur * (1 - kin), (ctx) => drawHold(ctx, m));
    composite(1 - kout, X.blur * kout, (ctx) => drawRig(ctx, m, t));
  }

  /* ---------- 3. tap ---------- */
  function drawFx(t: number) {
    fx.setTransform(1, 0, 0, 1, 0, 0); fx.clearRect(0, 0, CW, CH);
    if (phoneM) drawTap(fx, phoneM, TL.tap, t);
  }

  /* ---------- 5. label ---------- */
  label.style.left = TL.label.x * 100 + "%";
  label.style.top = TL.label.y * 100 + "%";
  let labelOn = false;
  function drawLabel(t: number) {
    const S = TL.label, k = t - S.start;
    const out = prog(t, S.out, S.out + S.outDuration);
    const vis = k > 0 && out < 1;
    if (vis !== labelOn) { label.style.visibility = vis ? "visible" : "hidden"; labelOn = vis; }
    if (!vis) return;
    const appear = easeOutCubic(prog(k, 0, 0.3));
    const open = easeInOutCubic(prog(k, 0.22, 0.7));
    label.style.opacity = String(appear * (1 - easeInOutCubic(out)));
    label.style.transform = `translate(-50%, -50%) translateY(${(1 - appear) * 6 - out * 8}px) scale(${0.94 + 0.06 * appear})`;
    label.style.clipPath = `inset(0 ${(1 - open) * 72}% 0 0 round 999px)`;
    label.style.filter = out > 0.01 ? `blur(${out * 4}px)` : "";
    ring.style.strokeDashoffset = String(1 - easeOutCubic(prog(k, 0.04, 0.5)));
    check.style.strokeDashoffset = String(1 - easeOutCubic(prog(k, 0.36, 0.62)));
    chars.forEach((c, i) => {
      const q = easeOutCubic(prog(k, 0.42 + i * 0.04, 0.42 + i * 0.04 + 0.34));
      c.style.opacity = String(q);
      c.style.transform = `translateY(${(1 - q) * 0.45}em)`;
      c.style.filter = q < 0.99 ? `blur(${(1 - q) * 3}px)` : "";
    });
    const sh = prog(k, 1.0, 1.9);
    sheenEl.style.transform = `translateX(${-120 + sh * 340}%) skewX(-18deg)`;
    sheenEl.style.opacity = sh > 0 && sh < 1 ? "1" : "0";
  }

  function render(t: number) {
    const shot = shotAt(t);
    drawPlates(t); drawCharacters(t, shot); drawFx(t); drawLabel(t);
    fadeEl.style.opacity = String(tv(TL.fade.opacity, t));
  }

  let time = 0, playing = false, last = 0, raf = 0, destroyed = false, isReady = false;

  /* ---------- fit (cover) ---------- */
  function fit() {
    const w = root.clientWidth, h = root.clientHeight;
    if (!w || !h) return;
    const k = Math.max(w / W, h / H);
    stage.style.transform = `translate(${(w - W * k) / 2}px, ${(h - H * k) / 2}px) scale(${k})`;
    // backing resolution: what the screen actually shows (device pixels), never above the stage size
    const rs = Math.min(1, Math.ceil(k * (window.devicePixelRatio || 1) * 20) / 20);
    if (Math.abs(rs - RS) > 0.01) { setResolution(rs); if (isReady) render(time); }
  }
  const ro = new ResizeObserver(fit);
  ro.observe(root); fit();

  /* ---------- clock ---------- */
  const cueNames = Object.keys(TL.cues);
  function fireCues(from: number, to: number) {
    if (!opts.onCue) return;
    for (const n of cueNames) {
      const c = TL.cues[n];
      if (from <= to ? c > from && c <= to : c > from || c <= to) opts.onCue(n);
    }
  }
  function tick(now: number) {
    if (!playing || destroyed) return;
    const prev = time;
    // clamp long gaps (tab switch, jank) so the animation never jumps
    time += Math.min(0.05, (now - last) / 1000) * TL.speed; last = now;
    if (time >= TL.duration) {
      if (TL.loop) time %= TL.duration;
      else { time = TL.duration - 1e-4; playing = false; }
    }
    fireCues(prev, time);
    render(time);
    if (playing) raf = requestAnimationFrame(tick);
  }

  const api: TapIntroAPI = {
    get time() { return time; },
    get playing() { return playing; },
    play() {
      if (playing || destroyed) return;
      if (time >= TL.duration - 1e-3) time = 0;
      playing = true; last = performance.now();
      if (isReady) raf = requestAnimationFrame(tick);
    },
    pause() { playing = false; cancelAnimationFrame(raf); },
    seek(s: number) { time = clamp(s, 0, TL.duration - 1e-4); if (isReady) render(time); },
    destroy() {
      destroyed = true; playing = false; cancelAnimationFrame(raf); ro.disconnect();
      root.replaceChildren();
    },
  };

  const ready = Promise.all([
    decode(data.bin, meta).then((p) => { pieces = p; }),
    ...plates.map(({ img }) => img.decode().catch(() => {})),
  ]).then(() => {
    if (destroyed) return;
    isReady = true;
    render(time);
    if (playing) { last = performance.now(); raf = requestAnimationFrame(tick); }
  });

  return { api, ready };
}
