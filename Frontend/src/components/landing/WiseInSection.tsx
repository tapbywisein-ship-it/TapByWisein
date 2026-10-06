import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Arrow from "./Arrow";

interface Section {
  id: string;
  index: string;
  mark: string;
  title: string;
  copy: string;
  cta: string;
  href: string;
  external: boolean;
}

const SECTIONS: Section[] = [
  {
    id: "tapbywisein",
    index: "01",
    mark: "TAPWISEIN",
    title: "THE ONE TAP THAT CONNECTS PEOPLE.",
    copy: "TapByWisein turns a simple tap into an instant professional connection, helping people exchange details and start meaningful relationships at the moment they meet.",
    cta: "EXPLORE TAPWISEIN",
    href: "/tapbywisein/product",
    external: false,
  },
  {
    id: "bywisein",
    index: "02",
    mark: "BYWISEIN",
    title: "WHERE PEOPLE MEET.",
    copy: "BYWISEIN brings events, people and opportunities together, helping professionals discover events, meet new people, and create meaningful connections.",
    cta: "EXPLORE BYWISEIN",
    href: "/discover",
    external: false,
  },
  {
    id: "wisein",
    index: "03",
    mark: "WISEIN",
    title: "WHERE CONNECTIONS CONTINUE.",
    copy: "WiseIN is the broader professional networking platform where people discover opportunities, build meaningful connections, and continue relationships long after the moment they meet.",
    cta: "EXPLORE WISEIN",
    href: "https://www.wisein.in/",
    external: true,
  },
];

/** Right side: scrolling ecosystem sections with active indicator. */
export default function WiseInSection({ pulse = 0 }: { pulse?: number }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = sectionRefs.current.indexOf(entry.target as HTMLElement);
            if (idx !== -1) setActiveIdx(idx);
          }
        }
      },
      { rootMargin: "-40% 0px -40% 0px", threshold: 0 }
    );

    sectionRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <aside className="hero-right" aria-labelledby="wisein-title-0">
      {/* Section indicators */}
      <div className="section-indicators reveal reveal-3" aria-hidden="true">
        {SECTIONS.map((s, i) => (
          <button
            key={s.id}
            className={`section-dot${i === activeIdx ? " is-active" : ""}`}
            onClick={() => {
              sectionRefs.current[i]?.scrollIntoView({ behavior: "smooth", block: "center" });
            }}
            aria-label={`Go to ${s.mark}`}
          >
            <span className="section-dot-fill" />
          </button>
        ))}
      </div>

      {/* Scrolling sections */}
      <div className="hero-right-scroll" ref={scrollRef}>
        {SECTIONS.map((s, i) => (
          <section
            key={s.id}
            ref={(el) => { sectionRefs.current[i] = el; }}
            className={`ecosystem-section reveal reveal-3 ${i === activeIdx ? "is-active" : ""}`}
            style={{ animationDelay: `${0.65 + i * 0.15}s` }}
          >
            <div className="wisein-id">
              {i === 0 && (
                <span className="thread-node" aria-hidden="true">
                  <span key={pulse} className={pulse ? "thread-ping" : undefined} />
                </span>
              )}
              <span className="wisein-mark">{s.mark}</span>
            </div>

            <div className="wisein-body">
              <h2 id={`wisein-title-${i}`} className="wisein-title">
                {s.title}
              </h2>
              <p className="wisein-copy">{s.copy}</p>
              
              {s.external ? (
                <a className="cta" href={s.href} target="_blank" rel="noopener noreferrer">
                  {s.cta}
                  <Arrow />
                </a>
              ) : (
                <Link className="cta" to={s.href}>
                  {s.cta}
                  <Arrow />
                </Link>
              )}
            </div>
          </section>
        ))}
      </div>
    </aside>
  );
}