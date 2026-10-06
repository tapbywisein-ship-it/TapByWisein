import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createTapIntro } from "./engine";
import { TIMELINE } from "./timeline";
import type { CharacterMeta, RigTracks, TapIntroAPI, Timeline } from "./types";
import type { EngineData } from "./engine";
import binUrl from "./assets/characters.bin?url";
import meta from "./assets/characters.meta.json";
import rig from "./assets/rig.json";
import "./IntroAnimation.css";

/* The traced character data (~1.2 MB, binary) is fetched once, starting as
 * soon as this module loads, and shared by every mounted instance. */
let dataPromise: Promise<EngineData> | null = null;
const loadData = () =>
  (dataPromise ??= fetch(binUrl).then(async (r) => {
    if (!r.ok) throw new Error(`characters.bin: ${r.status}`);
    return { bin: await r.arrayBuffer(), meta: meta as unknown as CharacterMeta, rig: rig as unknown as RigTracks };
  }));
if (typeof window !== "undefined") loadData().catch(() => {});

export interface IntroAnimationProps {
  className?: string;
  /** override the timeline (defaults to ./timeline.ts) */
  timeline?: Timeline;
  /** show a still of this moment (seconds) instead of playing — handy while editing */
  still?: number;
  /** fires when playback crosses a named cue in timeline.cues (e.g. "connect") */
  onCue?: (name: string) => void;
  /** access to play / pause / seek */
  onReady?: (api: TapIntroAPI) => void;
  /** if true, viewers with the OS "reduce motion" setting see a still frame
   *  (timeline.posterTime) instead of playback. Off by default: the animation
   *  is the page's centrepiece and plays for everyone. */
  respectReducedMotion?: boolean;
}

/**
 * TapByWiseIN intro animation. Self-contained: drop it into any sized box
 * (it cover-fits the 1920x1080 stage to the box). Pauses when scrolled
 * off-screen and resumes when visible again.
 */
export default function IntroAnimation({
  className,
  timeline = TIMELINE,
  still,
  onCue,
  onReady,
  respectReducedMotion = false,
}: IntroAnimationProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const cueRef = useRef(onCue);
  const readyRef = useRef(onReady);
  useLayoutEffect(() => {
    cueRef.current = onCue;
    readyRef.current = onReady;
  });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const root = rootRef.current!;
    let api: TapIntroAPI | null = null;
    let io: IntersectionObserver | null = null;
    let cancelled = false;
    const reduced = respectReducedMotion && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    loadData()
      .then((data) => {
        if (cancelled) return;
        const inst = createTapIntro(root, timeline, data, { onCue: (n) => cueRef.current?.(n) });
        api = inst.api;
        const frozen = still !== undefined || reduced;
        if (frozen) api.seek(still ?? timeline.posterTime);
        inst.ready.then(() => {
          if (cancelled) return;
          setLoaded(true);
          readyRef.current?.(inst.api);
        });
        if (frozen || !timeline.autoplay) return;
        io = new IntersectionObserver(([e]) => (e.isIntersecting ? api!.play() : api!.pause()), { threshold: 0.15 });
        io.observe(root);
      })
      .catch((err) => console.error("[IntroAnimation] could not start — is the page served over http (npm run dev), not opened as a file?", err));

    return () => {
      cancelled = true;
      io?.disconnect();
      api?.destroy();
    };
  }, [timeline, still, respectReducedMotion]);

  return (
    <div
      ref={rootRef}
      className={`ti-root${loaded ? " is-ready" : ""}${className ? ` ${className}` : ""}`}
      role="img"
      aria-label="Two people walk toward each other at an event, tap a card to a phone, and are connected."
    />
  );
}
