import { forwardRef, type ReactNode, type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface SurfaceProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  /** Apply heavier shadow stack or glass elevation */
  elevated?: boolean;
  /** Padding scale; default 'md' */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Add a subtle hover lift — used for clickable cards. */
  hover?: boolean;
  /** Option to use the panel style instead of card */
  variant?: 'card' | 'panel';
}

const paddingMap = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-7',
};

/**
 * Surface — Premium Glassmorphic card & container wrapper.
 * Directly matches the refined glass styling of the Discover page in both light and dark modes.
 */
export const Surface = forwardRef<HTMLDivElement, SurfaceProps>(
  ({ children, className, elevated = false, padding = 'md', hover = false, variant = 'card', ...rest }, ref) => {
    const base = variant === 'panel'
      ? 'premium-glass-panel rounded-2xl'
      : elevated
      ? 'premium-glass-card rounded-2xl shadow-lg'
      : 'premium-glass-card rounded-2xl';

    const hoverCls = hover
      ? 'transition-all duration-300 hover:-translate-y-1 hover:border-primary/40'
      : '';

    return (
      <div ref={ref} className={cn(base, paddingMap[padding], hoverCls, className)} {...rest}>
        {children}
      </div>
    );
  }
);
Surface.displayName = 'Surface';
