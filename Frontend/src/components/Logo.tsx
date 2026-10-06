import { Link } from 'react-router-dom';
import { useAppStore } from '@/store/appStore';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

const HOME_BY_ROLE: Record<string, string> = {
  attendee: '/dashboard',
  organizer: '/organizer/dashboard',
  admin: '/admin/dashboard',
};

export const Logo = ({
  size = 'md',
  to,
  collapsible = false,
  clickable = true,
}: {
  size?: 'sm' | 'md' | 'lg';
  to?: string;
  collapsible?: boolean;
  /**
   * When false, renders the logo as a plain div/span instead of a Link.
   * Use this when the logo should not be clickable (e.g., in the attendee
   * layout where Dashboard is already in the nav list).
   */
  clickable?: boolean;
}) => {
  const heights = { sm: 'h-5', md: 'h-6', lg: 'h-8' };

  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const role = useAppStore((s) => s.user?.role);
  const target = to ?? (isAuthenticated ? HOME_BY_ROLE[role ?? 'attendee'] ?? '/dashboard' : '/');

  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted
    ? resolvedTheme === 'dark'
    : typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

  const logoContent = (
    <>
      {collapsible && (
        <img
          src="/logo-mark.png"
          alt="TapByWisein"
          className={`${heights[size]} w-auto block group-hover:hidden`}
        />
      )}
      <img
        src={isDark ? '/logo-dark.png' : '/logo-light.png'}
        alt="TapByWisein"
        className={`${heights[size]} w-auto ${collapsible ? 'hidden group-hover:block' : 'block'}`}
      />
    </>
  );

  if (!clickable) {
    return (
      <div className="flex items-center group cursor-default">
        {logoContent}
      </div>
    );
  }

  return (
    <Link to={target} className="flex items-center group">
      {logoContent}
    </Link>
  );
};
