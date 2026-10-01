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
}: {
  size?: 'sm' | 'md' | 'lg';
  to?: string;
  collapsible?: boolean;
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

  return (
    <Link to={target} className="flex items-center">
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
    </Link>
  );
};
