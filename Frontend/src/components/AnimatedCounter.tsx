import { useEffect, useRef, useState } from 'react';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * A number that animates.
 * - While `value` is undefined (still loading) it rolls random digits, like a
 *   ticker, so the card looks alive instead of showing an empty bar.
 * - Once `value` arrives it counts up to it, slowing down at the end.
 * `format` adds things like ₹ or %. People who turned off animations in their
 * system settings just see the final number.
 */
export const AnimatedCounter = ({
  value,
  format = (n: number) => String(n),
  duration = 900,
}: {
  value: number | undefined;
  format?: (n: number) => string;
  duration?: number;
}) => {
  const [shown, setShown] = useState(0);
  const [rolling, setRolling] = useState(0);
  const shownRef = useRef(0);

  // Loading: show a random 1-3 digit number that changes quickly.
  useEffect(() => {
    if (value !== undefined || prefersReducedMotion()) return;
    const id = setInterval(() => setRolling(Math.floor(Math.random() * 999)), 70);
    return () => clearInterval(id);
  }, [value]);

  // Loaded: count from the number on screen to the real one.
  useEffect(() => {
    if (value === undefined) return;
    if (prefersReducedMotion()) {
      shownRef.current = value;
      setShown(value);
      return;
    }
    const from = shownRef.current;
    const decimals = Number.isInteger(value) ? 0 : 1;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out: fast start, gentle stop
      const current = Number((from + (value - from) * eased).toFixed(decimals));
      shownRef.current = current;
      setShown(current);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);

  if (value === undefined) {
    return (
      <span className="tabular-nums text-muted-foreground/50" aria-label="Loading">
        {prefersReducedMotion() ? '–' : format(rolling)}
      </span>
    );
  }
  return <span className="tabular-nums">{format(shown)}</span>;
};
