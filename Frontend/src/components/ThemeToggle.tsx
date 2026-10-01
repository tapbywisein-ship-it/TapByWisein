import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

/**
 * Inline icon button — used in the top header of each layout.
 * Tailgrids style: 20px icon, strokeWidth 1.75, muted hover.
 */
export const ThemeToggle = () => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="w-9 h-9" aria-hidden />;

  const current = theme === 'system' ? resolvedTheme : theme;
  const next = current === 'dark' ? 'light' : 'dark';

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={`Switch to ${next} mode`}
      className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
    >
      {current === 'dark'
        ? <Sun  className="w-5 h-5" strokeWidth={1.75} />
        : <Moon className="w-5 h-5" strokeWidth={1.75} />
      }
    </button>
  );
};

/**
 * @deprecated The new OrganizerLayout/AppLayout include the toggle in their
 * top header. This wrapper is kept only for the mobile "More" sheet and any
 * page that explicitly renders it.
 */
export const NavbarThemeToggle = ({ className = '' }: { className?: string }) => (
  <div className={className}>
    <ThemeToggle />
  </div>
);
