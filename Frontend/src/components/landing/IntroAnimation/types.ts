/* Types for the TapByWiseIN intro animation. */

/** Cubic-bezier [x1, y1, x2, y2] (same as CSS) or "linear". */
export type Ease = [number, number, number, number] | "linear";

/** A keyframe for a single value. `ease` applies to the segment after this key. */
export interface Key {
  t: number;
  v: number;
  ease?: Ease;
}

export interface CameraKey {
  t: number;
  zoom: number;
  cx: number;
  cy: number;
  rot: number;
  ease?: Ease;
  /** internal: log(zoom), filled in by the engine */
  lz?: number;
}

export type Vec = [number, number];

/** a parallelogram given by three corners (the fourth is implied) */
export interface Quad {
  tl: Vec;
  tr: Vec;
  bl: Vec;
}

export interface Shot {
  id: string;
  start: number;
  end: number;
  world: string;
  /** "frames": traced frame per source frame; "rig": hand rig + designed card/phone */
  mode: "frames" | "rig";
}

export interface Plate {
  id: string;
  src: string;
  world: string;
  size: [number, number];
  /** matrix [a,b,c,d,e,f] plate px -> world */
  place: [number, number, number, number, number, number];
  visible: [number, number];
  opacity?: Key[];
  blur?: Key[];
}

export interface Timeline {
  width: number;
  height: number;
  duration: number;
  loop: boolean;
  autoplay: boolean;
  speed: number;
  /** time shown when a still is requested (reduced motion opt-in) */
  posterTime: number;
  shots: Shot[];
  camera: Record<string, CameraKey[]>;
  /** colour grade baked into every plate once at load (CSS filter syntax) */
  plateGrade: string;
  plates: Plate[];
  characters: {
    colors: Record<string, string>;
    /** stroke width (world px) in each layer's colour; closes hairline seams between traced shapes */
    seam: number;
    reflection: { shot: string; opacity: number; color: string; fadeLength: number } | null;
  };
  /** close-up: one clean frame of each hand moved by its tracked motion, with the designed card and phone */
  rig: {
    phone: Quad;
    card: Quad;
    /** pull-back: the close-up rig blurs out, then the two-shot hold resolves in */
    crossfade: { rigOut: [number, number]; holdIn: [number, number]; blur: number };
  };
  card: CardStyle;
  phone: PhoneStyle;
  tap: TapStyle;
  label: LabelStyle;
  /** named moments; the component's onCue callback fires when playback crosses them */
  cues: Record<string, number>;
  /** small ✦ mark carried over from the supplied animation (screen space) */
  sparkle: { x: number; y: number; r: number; color: string } | null;
  fade: { color: string; opacity: Key[] };
}

export interface CardStyle {
  /** brushed-metal face, light -> dark stops */
  metal: string[];
  ink: string; // engraving / wordmark
  accent: string;
  wordmark: string;
  /** card scale around the tap point (the "press") */
  press: Key[];
  /** travelling reflection: base offset driven by the hand's rotation, plus the tap sweep */
  sheen: { strength: number; sweep: Key[] };
  shadow: { color: string; blur: number; offset: Vec };
}

export interface PhoneStyle {
  frame: string[]; // titanium edge gradient
  screenIdle: [string, string];
  screenLive: [string, string];
  accent: string;
  /** progress 0..1 of the light wave that turns the screen on at the tap */
  reveal: Key[];
  /** progress 0..1 of the profile content appearing */
  content: Key[];
  /** where on the screen the content block sits (phone-local units, 100 x 206) */
  contentAt: Vec;
}

export interface TapStyle {
  /** when the card touches */
  time: number;
  /** the contact point in phone-local units (100 x 206) */
  point: Vec;
  flash: { radius: number; opacity: Key[]; size: Key[] };
  rings: { delay: number; duration: number; from: number; to: number; width: number; color: string; alpha: number }[];
  sparks: { count: number; duration: number; distance: number; size: number; color: string; seed: number };
  /** small camera push at the tap (zoom multiplier) */
  impact: Key[];
}

export interface LabelStyle {
  text: string;
  /** position as a fraction of the visible frame (0..1) */
  x: number;
  y: number;
  /** when the label starts to build */
  start: number;
  /** when it begins to leave, and how long that takes */
  out: number;
  outDuration: number;
}

export interface CharacterMeta {
  fps: number;
  frameCount: number;
  sides: string[];
  layers: string[];
  hallFrames: number;
  pieces: { rig: number; hold: number };
  refFrame: number;
  holdFrame: number;
  bbox: ([number, number, number, number] | null)[][];
}

export interface HandTrack {
  origin: Vec;
  start: number;
  /** per source frame from `start`: [angle (deg), tx, ty], reference frame -> this frame */
  keys: [number, number, number][];
}

export interface RigTracks {
  L: HandTrack;
  R: HandTrack;
}

export interface TapIntroAPI {
  readonly time: number;
  readonly playing: boolean;
  play(): void;
  pause(): void;
  seek(seconds: number): void;
  destroy(): void;
}
