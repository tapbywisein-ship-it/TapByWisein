import React from 'react';

/**
 * Universal Technical Grid & Ambient Lighting Background.
 * Renders the silver ambient lighting and 44px technical grid in light mode,
 * and the crisp white grid lines with deep brand luminescence in dark mode.
 */
export const AppBackgroundGrid: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      {/* Base Tint Layer: subtle silver tint in light, dark deep black in dark */}
      <div className="absolute inset-0 bg-[#F4F6F8]/60 dark:bg-black transition-colors duration-300" />

      {/* Ambient Lighting Gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.9)_0%,transparent_60%)] dark:bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.08)_0%,transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_25%,rgba(37,99,235,0.04)_0%,transparent_60%)] dark:bg-[radial-gradient(ellipse_at_50%_25%,rgba(25,129,254,0.16)_0%,transparent_60%)]" />

      {/* Light Mode Grid: dark silver grid lines */}
      <div
        className="absolute inset-0 opacity-75 dark:hidden"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(173,181,189,0.28) 1px, transparent 1px), linear-gradient(to bottom, rgba(173,181,189,0.28) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
          maskImage: 'radial-gradient(ellipse 100% 100% at 50% 20%, black 20%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse 100% 100% at 50% 20%, black 20%, transparent 80%)',
        }}
      />

      {/* Dark Mode Grid: crisp high-intensity white grid lines */}
      <div
        className="absolute inset-0 hidden dark:block opacity-70"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(255,255,255,0.16) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.16) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
          maskImage: 'radial-gradient(ellipse 100% 100% at 50% 20%, black 25%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse 100% 100% at 50% 20%, black 25%, transparent 80%)',
        }}
      />
    </div>
  );
};

