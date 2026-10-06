const fs = require('fs');
let content = fs.readFileSync('Frontend/src/styles/page.css', 'utf8');

// Strip out any previous broken appended data if it exists
if (content.includes('/* ---------- right-side scroll container ---------- */')) {
  content = content.substring(0, content.indexOf('/* ---------- right-side scroll container ---------- */'));
} else {
  // Try reading as utf16le if the previous echo ruined it
  let c2 = fs.readFileSync('Frontend/src/styles/page.css', 'utf16le');
  if (c2.includes('/* ---------- right-side scroll container ---------- */')) {
    content = c2.substring(0, c2.indexOf('/* ---------- right-side scroll container ---------- */'));
  }
}

// Remove trailing null bytes from Powershell corruption
content = content.replace(/\0/g, '');

const appended = \
/* ---------- right-side scroll container ---------- */
.hero {
  display: grid;
  grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
}
.hero-left {
  position: sticky;
  top: 40px;
  align-self: start;
}
.hero-right {
  position: relative;
  padding-left: clamp(22px, 2.6vw, 40px);
}
.hero-right-scroll {
  display: flex;
  flex-direction: column;
}
/* ---------- individual ecosystem section ---------- */
.ecosystem-section {
  position: relative;
  min-height: 75vh;
  display: flex;
  flex-direction: column;
}
/* ---------- section indicators ---------- */
.section-indicators {
  position: sticky;
  top: 50vh;
  left: 0;
  float: left;
  margin-left: calc(-1 * clamp(22px, 2.6vw, 40px) - 20px);
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 16px;
  z-index: 10;
}
.section-dot {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  background: transparent;
  border: none;
  cursor: pointer;
}
.section-dot-fill {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--silver-300);
  border: 1px solid var(--silver-400);
  transition: all 0.4s var(--ease-out);
}
.section-dot:hover .section-dot-fill {
  background: var(--silver-400);
}
.section-dot.is-active .section-dot-fill {
  width: 8px;
  height: 8px;
  background: var(--blue-600);
  border-color: var(--blue-500);
  box-shadow: 0 0 12px 2px rgba(59, 130, 246, 0.35), 0 0 0 3px rgba(59, 130, 246, 0.12);
}
.wisein-title {
  font-size: clamp(2rem, 3vw, 2.75rem);
  font-weight: 800;
  line-height: 1.05;
  letter-spacing: -0.035em;
  color: var(--graphite-900);
  max-width: 14ch;
  text-wrap: balance;
  opacity: 0.35;
  transform: translateY(12px);
  transition: opacity 0.8s cubic-bezier(0.2, 0.7, 0.3, 1), transform 0.8s cubic-bezier(0.2, 0.7, 0.3, 1);
}
.ecosystem-section.is-active .wisein-title {
  opacity: 1;
  transform: translateY(0);
}
.cta {
  margin-top: 32px;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  height: 44px;
  padding: 0 20px 0 22px;
  border-radius: 999px;
  font-size: 13.5px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #fff;
  background: linear-gradient(180deg, #3b82f6, #2563eb);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 4px 8px rgba(37, 99, 235, 0.2);
  transition: background 0.3s, box-shadow 0.3s, transform 0.25s var(--ease-out);
}
.cta .arrow,
.eco-action .arrow {
  transition: transform 0.3s var(--ease-out);
}
.cta:hover {
  background: linear-gradient(180deg, #60a5fa, #3b82f6);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.3), 0 6px 14px rgba(37, 99, 235, 0.3), 0 0 14px rgba(59, 130, 246, 0.35);
}
.cta:hover .arrow {
  transform: translateX(4px);
}
.cta:active {
  transform: translateY(1px);
}
@media (max-width: 1024px) {
  .hero {
    display: flex;
    flex-direction: column;
    gap: 48px;
  }
  .hero-left {
    position: relative;
    top: 0;
  }
  .section-indicators {
    display: none;
  }
  .ecosystem-section {
    min-height: auto;
    margin-bottom: 48px;
  }
}
\;

fs.writeFileSync('Frontend/src/styles/page.css', content + '\n' + appended, 'utf8');
