/* =====================================================================
 * TapByWiseIN intro — EDITABLE TIMELINE
 * ---------------------------------------------------------------------
 * Ported from the supplied tap-intro/timeline.js. Every value that
 * defines the animation lives here; engine.ts only reads it.
 *
 *  - Times are in SECONDS (source: 60 fps, 9.933 s, 1920x1080 stage).
 *  - Screen coordinates are in the 1920x1080 stage. "World" coordinates
 *    are the space the plates and characters live in; the camera maps
 *    world -> screen.
 *  - Easing: [x1, y1, x2, y2] cubic-bezier (same as CSS) or "linear".
 *
 * Changes from the supplied timeline (landing-page edit):
 *  - removed: compass, serif "Connected." title, "Events • Network •
 *    Experiences • Direction" tagline, ray burst
 *  - close-up rebuilt as a rig: clean hands on tracked motion, with a
 *    designed titanium TAP card (card.ts) and phone (phone.ts) — no
 *    frame-to-frame flicker on the objects
 *  - tap: press, flash, rings in the phone's plane, sparks (tap.ts)
 *  - "CONNECTED": badge + letter-by-letter reveal
 *  - phone screen lights up from the contact point and shows the
 *    connected profile
 *  - end fade dissolves into the page colour and back, so it loops
 *  - plates graded toward silver; silhouettes toward graphite
 * ===================================================================== */
import type { Timeline } from "./types";
import hallStart from "./assets/bg-hall-start.jpg";
import hallEnd from "./assets/bg-hall-end.jpg";
import twoShot from "./assets/bg-twoshot.jpg";
import closeUp from "./assets/bg-closeup.jpg";

const f = (frame: number) => frame / 60; // source frame -> seconds

/** the moment the card touches the phone */
const TAP = f(300); // 5.0 s

export const TIMELINE: Timeline = {
  width: 1920,
  height: 1080,
  duration: f(596), // 9.933 s
  loop: true,
  autoplay: true,
  speed: 1,
  posterTime: 8.0,

  /* ---------------- SHOTS ----------------
   * Shot 1: wide conference hall, the two people walk toward each
   *         other, slow dolly-in, they meet, one offers the card.
   * Shot 2: cut to the close-up of the hands (phone + card), tap,
   *         pull-back to the two-shot (both looking at their phones). */
  shots: [
    { id: "hall", start: 0, end: f(269), world: "A", mode: "frames" },
    { id: "tap", start: f(269), end: f(596), world: "B", mode: "rig" },
  ],

  /* ---------------- CAMERA ----------------
   * Per world: zoom (screen px per world unit), centre (world point at
   * screen centre) and roll (radians). ease = easing to the next key. */
  camera: {
    A: [
      { t: 0, zoom: 0.7449, cx: 959.14, cy: 546.06, rot: 0.0006, ease: [0.449, 0.013, 0.653, 0.985] },
      { t: f(268), zoom: 1.0, cx: 960.0, cy: 540.0, rot: 0 },
    ],
    B: [
      { t: f(269), zoom: 1.8247, cx: 950.9, cy: 570.72, rot: 0.0045, ease: [0.432, -0.593, 0.112, 1.624] },
      { t: f(390), zoom: 1.8373, cx: 947.06, cy: 566.69, rot: 0.0009, ease: [0.706, 0.061, 0.786, 0.658] }, // pull-back starts
      { t: f(452), zoom: 1.2415, cx: 961.71, cy: 546.01, rot: -0.0028, ease: [0.117, 0.664, 0.298, 0.885] },
      { t: f(595), zoom: 1.0, cx: 960.0, cy: 540.0, rot: 0 },
    ],
  },

  /* ---------------- BACKGROUND PLATES ----------------
   * Illustrated conference-hall backgrounds (people removed).
   * place = matrix [a,b,c,d,e,f] mapping plate pixels -> world.
   * plateGrade: an extra CSS filter on all plates. The silver grade
   * (saturate .42, brightness 1.1, contrast .92) is already baked into
   * the JPGs by tools/intro-data/bake_plates.py — cheaper to draw.  */
  plateGrade: "none",
  plates: [
    // conference hall as seen at the start of shot 1 ...
    { id: "hallStart", src: hallStart, world: "A", size: [2640, 1512], place: [1, 0, 0, 1, -361, -210], visible: [0, f(269)] },
    // ... and at the end of the dolly-in (dissolves over the first, emulating floor parallax)
    {
      id: "hallEnd", src: hallEnd, world: "A", size: [2639, 1512], place: [1, 0, 0, 1, -360, -210], visible: [0, f(269)],
      opacity: [{ t: 1.7, v: 0, ease: [0.42, 0, 0.58, 1] }, { t: 2.5, v: 1 }],
    },
    // medium two-shot background (end) — sits under the close-up plate
    {
      id: "twoShot", src: twoShot, world: "B", size: [1970, 1136], place: [1, 0, 0, 1, -25, -28], visible: [f(269), 99],
      blur: [{ t: f(400), v: 6 }, { t: f(470), v: 0 }],
    },
    // defocused close-up background (behind the hands); dissolves during the pull-back
    {
      id: "closeUp", src: closeUp, world: "B", size: [1985, 1152],
      place: [0.54802, 0.00245, -0.00245, 0.54802, 426.123 - 34 * 0.54802 + 41 * 0.00245, 272.434 - 34 * 0.00245 - 41 * 0.54802],
      visible: [f(269), 99],
      // fades with the hands: the plate has a patched area where the hands were removed
      opacity: [{ t: f(390), v: 1, ease: [0.45, 0, 0.55, 1] }, { t: f(414), v: 0 }],
    },
  ],

  /* ---------------- CHARACTERS ----------------
   * Shot "hall": the traced people, one cleaned frame per source frame
   * (specks removed, outlines simplified — see tools/intro-data).
   * Shot "tap": the hand rig (one clean frame of each hand, moved by
   * its tracked motion) with the designed card and phone.          */
  characters: {
    colors: {
      lightbase: "#b6babd", // silver: shirt shading
      light: "#d6d9dc",
      white: "#f8f9fa", // shirts, cuffs
      mid: "#7c8287",
      charbase: "#30353a", // suit highlights (graphite)
      black: "#15181b", // silhouettes (deep graphite)
    },
    seam: 2.2,
    reflection: { shot: "hall", opacity: 0.3, color: "#2b3a4a", fadeLength: 220 },
  },

  /* ---------------- CLOSE-UP RIG ----------------
   * Card and phone positions in the reference frame (world B), as
   * parallelograms: top-left, top-right, bottom-left corners.
   * They follow the hands' tracked motion (assets/rig.json).       */
  rig: {
    phone: { tl: [911, 491], tr: [1008, 561], bl: [659, 653] },
    card: { tl: [863, 514], tr: [1092, 558], bl: [804, 618] },
    crossfade: { rigOut: [f(390), f(414)], holdIn: [f(420), f(448)], blur: 8 },
  },

  /* ---------------- THE CARD ---------------- */
  card: {
    metal: ["#f5f6f7", "#dde1e5", "#f0f2f4", "#c8cdd2", "#e7eaed"],
    ink: "#2b3035",
    accent: "#2563eb",
    wordmark: "TAPBYWISEIN",
    // a small press into the phone at the tap
    press: [
      { t: TAP - 0.2, v: 1, ease: [0.4, 0, 0.6, 1] },
      { t: TAP, v: 0.972, ease: [0.2, 0.7, 0.3, 1] },
      { t: TAP + 0.35, v: 1 },
    ],
    sheen: {
      strength: 0.32,
      // light sweep across the face at the tap (0 -> 1)
      sweep: [{ t: TAP - 0.02, v: 0, ease: [0.3, 0, 0.3, 1] }, { t: TAP + 0.7, v: 1 }],
    },
    shadow: { color: "rgba(12,16,22,0.45)", blur: 24, offset: [6, 12] },
  },

  /* ---------------- THE PHONE ---------------- */
  phone: {
    frame: ["#9aa2a9", "#3b4147", "#ced4da", "#2a2f34"],
    screenIdle: ["#0b1220", "#121b2e"],
    screenLive: ["#f8fafc", "#e8edf4"],
    accent: "#2563eb",
    reveal: [{ t: TAP + 0.02, v: 0, ease: [0.25, 0.6, 0.3, 1] }, { t: TAP + 0.7, v: 1 }],
    content: [{ t: TAP + 0.3, v: 0 }, { t: TAP + 1.25, v: 1 }],
    contentAt: [38, 124], // the part of the screen the fingers, thumb and card leave visible
  },

  /* ---------------- THE TAP ----------------
   * Units are phone units (the phone is 100 x 206).                */
  tap: {
    time: TAP,
    point: [50, 62],
    flash: {
      radius: 42,
      opacity: [{ t: TAP - 0.02, v: 0 }, { t: TAP + 0.05, v: 0.95, ease: [0.3, 0, 0.5, 1] }, { t: TAP + 0.5, v: 0 }],
      size: [{ t: TAP - 0.02, v: 0.35, ease: [0.2, 0.7, 0.3, 1] }, { t: TAP + 0.14, v: 1 }, { t: TAP + 0.55, v: 1.35 }],
    },
    rings: [
      { delay: 0.0, duration: 0.8, from: 6, to: 92, width: 2.4, color: "255,255,255", alpha: 0.95 },
      { delay: 0.1, duration: 0.95, from: 8, to: 128, width: 1.7, color: "147,197,253", alpha: 0.75 },
      { delay: 0.22, duration: 1.1, from: 10, to: 160, width: 1.1, color: "191,219,254", alpha: 0.5 },
    ],
    sparks: { count: 16, duration: 0.95, distance: 72, size: 1.5, color: "224,236,255", seed: 11 },
    impact: [
      { t: TAP - 0.01, v: 1, ease: [0.2, 0.8, 0.3, 1] },
      { t: TAP + 0.07, v: 1.012, ease: [0.3, 0, 0.3, 1] },
      { t: TAP + 0.65, v: 1 },
    ],
  },

  /* ---------------- "CONNECTED" ----------------
   * Glass pill: badge ring draws, check draws, letters resolve one by
   * one, a light passes over it; leaves with a soft blur. Styled in
   * IntroAnimation.css. x / y are fractions of the visible frame.  */
  label: { text: "Connected", x: 0.5, y: 0.3, start: TAP + 0.32, out: 8.5, outDuration: 0.55 },

  cues: { connect: TAP },

  /* small ✦ mark, bottom-right — kept as supplied */
  sparkle: { x: 1740, y: 900, r: 37, color: "rgba(255,255,255,0.3)" },

  /* ---------------- LOOP SEAM ----------------
   * Dissolve into the page colour at the end and back in at the start,
   * so the loop reads as one continuous, calm cycle.                */
  fade: {
    color: "#f5f6f7",
    opacity: [
      { t: 0, v: 1, ease: [0.4, 0, 0.6, 1] },
      { t: 0.75, v: 0 },
      { t: 9.2, v: 0, ease: [0.4, 0, 0.6, 1] },
      { t: f(596), v: 1 },
    ],
  },
};
