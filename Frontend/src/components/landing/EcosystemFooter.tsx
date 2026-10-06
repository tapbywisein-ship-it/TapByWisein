import { ECOSYSTEM, type EcosystemProduct } from "../../config/ecosystem";
import Arrow from "./Arrow";

const YEAR = new Date().getFullYear();

function Item({ p, index }: { p: EcosystemProduct; index: number }) {
  const linked = !!p.href && p.status !== "current";
  const Tag = linked ? "a" : "div";
  return (
    <Tag
      className={`eco-item is-${p.status}${linked ? " is-linked" : ""}`}
      {...(linked ? { href: p.href! } : {})}
      aria-current={p.status === "current" ? "page" : undefined}
    >
      <div className="eco-top" aria-hidden="true">
        <span className="eco-node" />
        <span className="eco-index">{String(index + 1).padStart(2, "0")}</span>
        <span className="eco-line" />
      </div>
      <h3 className="eco-name">{p.name}</h3>
      <p className="eco-tagline">{p.tagline}</p>
      <p className="eco-desc">{p.description}</p>
      <span className="eco-action">
        {p.status === "current" && <span className="eco-dot" aria-hidden="true" />}
        {p.action}
        {p.status === "available" && <Arrow />}
      </span>
    </Tag>
  );
}

export default function EcosystemFooter() {
  return (
    <footer className="eco reveal reveal-4" aria-labelledby="eco-title">
      <div className="eco-head">
        <h2 id="eco-title" className="eco-title">
          The WiseIN ecosystem
        </h2>
        <p className="eco-lede">One connection. Three ways forward.</p>
      </div>
      <nav className="eco-grid" aria-label="WiseIN ecosystem">
        {ECOSYSTEM.map((p, i) => (
          <Item key={p.id} p={p} index={i} />
        ))}
      </nav>
      <div className="eco-legal">
        <span>© {YEAR} TapByWiseIN</span>
        <span>Part of the WiseIN ecosystem</span>
      </div>
    </footer>
  );
}
