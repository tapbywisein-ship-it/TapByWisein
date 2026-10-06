import React, { useEffect, useRef } from 'react';
import '../../styles/tbw-heading.css';

export default function TbwHeading() {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const STAGGER = 35;
    const RISE = 700;
    const h1 = headingRef.current;
    if (!h1) return;

    const words = h1.querySelectorAll('.tbw-word') as NodeListOf<HTMLElement>;

    // We only want to populate letters once
    if (h1.dataset.populated) return;
    h1.dataset.populated = "true";

    let i = 0;
    words.forEach((word) => {
      const text = word.getAttribute('data-text') || '';
      [...text].forEach((ch) => {
        const s = document.createElement('span');
        s.setAttribute('aria-hidden', 'true');
        s.textContent = ch;
        s.style.animationDelay = (i++ * STAGGER) + 'ms';
        word.appendChild(s);
      });
    });

    const end = i * STAGGER + RISE;

    function measure() {
      words.forEach((w) => {
        w.style.setProperty('--W', w.getBoundingClientRect().width + 'px');
        w.querySelectorAll('span').forEach((s) => {
          const el = s as HTMLElement;
          el.style.setProperty('--o', (el.offsetLeft - w.offsetLeft) + 'px');
        });
      });
    }

    let isMounted = true;
    let loopInterval: NodeJS.Timeout;

    document.fonts.ready.then(() => {
      if (!isMounted) return;
      measure();
      const core = h1.querySelector('.tbw-core') as HTMLElement;
      if (core) core.style.animationDelay = end + 'ms';
      
      requestAnimationFrame(() => h1.classList.add('is-playing'));
      
      // Initial shine
      setTimeout(() => { 
        if (isMounted) h1.classList.add('is-shining'); 
      }, end - 150);
      
      const ring = h1.querySelector('.tbw-ring') as HTMLElement;
      setTimeout(() => { if (isMounted && ring) ring.classList.add('is-on'); }, end + 200);
      
      setTimeout(() => {
        if (!isMounted) return;
        h1.classList.remove('is-shining');
        h1.classList.add('is-ready');
        
        // Start recurring shine loop (e.g. shine every 3.5 seconds)
        loopInterval = setInterval(() => {
          if (!isMounted) return;
          // Temporarily remove is-ready so we can re-trigger animation by re-adding is-shining
          h1.classList.remove('is-ready');
          h1.classList.add('is-shining');
          
          setTimeout(() => {
            if (!isMounted) return;
            h1.classList.remove('is-shining');
            h1.classList.add('is-ready');
          }, 1600); // 1.6s is the duration of tbw-sweep
        }, 3500);
        
      }, end + 1600);
    });

    let r: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(r);
      r = setTimeout(measure, 100);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      isMounted = false;
      clearInterval(loopInterval);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <h1 ref={headingRef} className="tbw" aria-label="TapByWisein">
      <span className="tbw-word tbw-blue" data-text="Tap"></span>
      <span className="tbw-word tbw-chrome" data-text="ByWisein"></span>
    </h1>
  );
}
