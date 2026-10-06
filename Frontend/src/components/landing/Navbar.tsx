import { LINKS } from "../../config/links";

/** Monogram "T" mark. Placeholder for the official TAP logo asset —
 *  replace the <svg> with the brand file when it's available. */
export function TapMark({ size = 32 }: { size?: number }) {
  return (
    <svg className="tap-mark" width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <defs>
        <linearGradient id="tm-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#495057" />
          <stop offset="0.5" stopColor="#2b3035" />
          <stop offset="1" stopColor="#212529" />
        </linearGradient>
        <linearGradient id="tm-glyph" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f8f9fa" />
          <stop offset="0.55" stopColor="#ced4da" />
          <stop offset="1" stopColor="#adb5bd" />
        </linearGradient>
      </defs>
      <rect x="0.5" y="0.5" width="31" height="31" rx="8.5" fill="url(#tm-body)" />
      <rect x="0.5" y="0.5" width="31" height="31" rx="8.5" fill="none" stroke="rgba(255,255,255,.14)" />
      <path d="M9 9.25h14v3.1h-5.35V23h-3.3V12.35H9z" fill="url(#tm-glyph)" />
      <circle cx="23.2" cy="22.4" r="1.55" fill="#3b82f6" />
    </svg>
  );
}

export default function Navbar() {
  return (
    <header className="nav">
      <div className="nav-inner">
        <a className="nav-brand" href={LINKS.tapbywisein ?? undefined} aria-label="TapByWiseIN home">
        </a>
        <a className="nav-signin" href={LINKS.signIn ?? undefined} aria-disabled={LINKS.signIn ? undefined : true}>
          Sign in
        </a>
      </div>
    </header>
  );
}