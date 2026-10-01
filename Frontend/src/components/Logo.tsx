import { Link } from 'react-router-dom';
import { useAppStore } from '@/store/appStore';

const HOME_BY_ROLE: Record<string, string> = {
  attendee: '/dashboard',
  organizer: '/organizer/dashboard',
  admin: '/admin/dashboard',
};

/**
 * Brand logo. When signed in it links to the user's in-app home (so clicking it
 * keeps you inside the app instead of dropping you on the public landing page,
 * which looks like a logout). Anonymous visitors go to the landing page.
 * Pass `to` to override the destination.
 */
export const Logo = ({
  size = 'md',
  to,
  collapsible = false,
  clickable = true,
}: {
  size?: 'sm' | 'md' | 'lg';
  to?: string;
  /**
   * For collapsible icon-rail sidebars: show just the T mark while the rail is
   * collapsed, and reveal the full wordmark when the rail expands on hover (the
   * parent `aside` carries the `group` class). Without this the wordmark gets
   * clipped into a "molded" sliver at the 64px collapsed width.
   */
  collapsible?: boolean;
  /**
   * When false, renders the logo as a plain div/span instead of a Link.
   * Use this when the logo should not be clickable (e.g., in the attendee
   * layout where Dashboard is already in the nav list).
   */
  clickable?: boolean;
}) => {
  // Logo is ~93×24; scale by height and let width follow the aspect ratio.
  const heights = { sm: 'h-5', md: 'h-6', lg: 'h-8' };

  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const role = useAppStore((s) => s.user?.role);
  const target = to ?? (isAuthenticated ? HOME_BY_ROLE[role ?? 'attendee'] ?? '/dashboard' : '/');

  // Two variants swapped by the `dark` class (darkMode: 'class') — no JS needed.
  // logo-light = dark text for light backgrounds; logo-dark = white text for dark.
  const logoContent = (
    <>
      {collapsible && (
        // Blue T mark — reads on both themes; hidden once the rail expands.
        <img src="/logo-mark.png" alt="TapByWisein" className={`${heights[size]} w-auto block group-hover:hidden`} />
      )}
      <img
        src="/logo-light.png"
        alt="TapByWisein"
        className={`${heights[size]} w-auto ${collapsible ? 'hidden group-hover:block' : 'block'} dark:hidden`}
      />
      <img
        src="/logo-dark.png"
        alt="TapByWisein"
        className={`${heights[size]} w-auto hidden ${collapsible ? 'dark:group-hover:block' : 'dark:block'}`}
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
