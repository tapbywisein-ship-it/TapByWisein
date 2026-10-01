import { ReactNode, useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { useAppStore } from '@/store/appStore';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  LayoutDashboard, Calendar, Users, Download, LogOut, Ticket,
  Wallet, UserCircle, Plus, QrCode, Boxes, Scan, Compass, Network,
  Menu, X, Bell, ChevronDown, Search, Zap,
} from 'lucide-react';

/* ── Nav structure ─────────────────────────────────────────────────────── */
const navSections = [
  {
    label: 'MENU',
    items: [
      { label: 'Dashboard',    icon: LayoutDashboard, path: '/organizer/dashboard' },
      { label: 'Create Event', icon: Calendar,         path: '/organizer/events/create' },
      { label: 'Attendees',    icon: Users,            path: '/organizer/attendees' },
      { label: 'Communities',  icon: Boxes,            path: '/organizer/communities' },
    ],
  },
  {
    label: 'MANAGE',
    items: [
      { label: 'Leads',         icon: Download,   path: '/organizer/leads' },
      { label: 'Payouts',       icon: Wallet,     path: '/organizer/payouts' },
      { label: 'Browse Events', icon: Compass,    path: '/events' },
      { label: 'Connections',   icon: Network,    path: '/connections' },
    ],
  },
  {
    label: 'ACCOUNT',
    items: [
      { label: 'Connect',    icon: Scan,       path: '/connect' },
      { label: 'My Tickets', icon: Ticket,     path: '/my-tickets' },
      { label: 'Tap Card',   icon: QrCode,     path: '/apply-card' },
      { label: 'Profile',    icon: UserCircle, path: '/profile' },
    ],
  },
];

const mobileQuickNav = [
  { label: 'Home',      icon: LayoutDashboard, path: '/organizer/dashboard' },
  { label: 'Attendees', icon: Users,            path: '/organizer/attendees' },
  { label: 'New',       icon: Plus,             path: '/organizer/events/create' },
  { label: 'Connect',   icon: Scan,             path: '/connect' },
];

/* ── Sidebar content (shared between desktop + drawer) ────────────────── */
const SidebarContent = ({
  onClose,
  handleLogout,
}: {
  onClose?: () => void;
  handleLogout: () => void;
}) => {
  const location = useLocation();

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-border">
        <Logo size="md" />
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" strokeWidth={1.75} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
        {navSections.map((section) => (
          <div key={section.label}>
            <span className="section-label">{section.label}</span>
            <div className="space-y-0.5 mt-1">
              {section.items.map((item) => {
                const active =
                  location.pathname === item.path ||
                  (item.path !== '/organizer/dashboard' &&
                    location.pathname.startsWith(item.path));
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={`nav-item ${active ? 'active' : ''}`}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" strokeWidth={1.75} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Pro Plan upgrade card */}
      <div className="mx-3 mb-4 p-4 rounded-xl bg-muted border border-border">
        <div className="flex items-center gap-2 mb-1">
          <Zap className="w-4 h-4 text-primary flex-shrink-0" strokeWidth={1.75} />
          <p className="text-sm font-semibold text-foreground">Pro Plan</p>
        </div>
        <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
          Unlock advanced analytics &amp; unlimited events.
        </p>
        <Link
          to="/pricing"
          onClick={onClose}
          className="block w-full text-center text-sm font-medium text-white bg-primary hover:bg-[#2F4BD8] rounded-lg py-2 transition-colors"
        >
          Upgrade Now
        </Link>
      </div>

      {/* Sign out */}
      <div className="px-3 pb-4 border-t border-border pt-3">
        <button
          type="button"
          onClick={handleLogout}
          className="nav-item w-full text-left"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" strokeWidth={1.75} />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  );
};

/* ── Top header ────────────────────────────────────────────────────────── */
const TopHeader = ({
  pageTitle,
  pageSubtitle,
  onMenuOpen,
}: {
  pageTitle?: string;
  pageSubtitle?: string;
  onMenuOpen: () => void;
}) => {
  const user = useAppStore((s) => s.user);
  const displayName = user?.name?.split(' ')[0] || user?.username || 'User';

  return (
    <header className="sticky top-0 z-30 bg-card border-b border-border px-4 md:px-6 h-16 flex items-center gap-4">
      {/* Mobile menu button */}
      <button
        type="button"
        onClick={onMenuOpen}
        className="lg:hidden p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" strokeWidth={1.75} />
      </button>

      {/* Page title */}
      <div className="flex-1 min-w-0 hidden sm:block">
        {pageTitle && (
          <h2 className="text-base font-semibold text-foreground leading-tight truncate">
            {pageTitle}
          </h2>
        )}
        {pageSubtitle && (
          <p className="text-xs text-muted-foreground leading-tight truncate">
            {pageSubtitle}
          </p>
        )}
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 ml-auto">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
            strokeWidth={1.75}
          />
          <input
            type="search"
            placeholder="Search…"
            className="h-9 w-48 lg:w-56 rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
          />
        </div>

        {/* Dark mode toggle */}
        <ThemeToggle />

        {/* Notification bell */}
        <button
          type="button"
          aria-label="Notifications"
          className="relative p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <Bell className="w-5 h-5" strokeWidth={1.75} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive border-2 border-card" />
        </button>

        {/* Avatar + name */}
        <button
          type="button"
          className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-muted transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-semibold flex-shrink-0">
            {displayName[0]?.toUpperCase()}
          </div>
          <span className="text-sm font-medium text-foreground hidden md:block">
            {displayName}
          </span>
          <ChevronDown
            className="w-4 h-4 text-muted-foreground hidden md:block"
            strokeWidth={1.75}
          />
        </button>
      </div>
    </header>
  );
};

/* ── Main layout ───────────────────────────────────────────────────────── */
export const OrganizerLayout = ({
  children,
  pageTitle,
  pageSubtitle,
}: {
  children: ReactNode;
  pageTitle?: string;
  pageSubtitle?: string;
}) => {
  const navigate = useNavigate();
  const logout = useAppStore((s) => s.logout);
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  // Close drawer on route change
  useEffect(() => { setDrawerOpen(false); }, [location.pathname]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  return (
    <div className="min-h-screen bg-background flex">

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-[240px] flex-shrink-0 fixed inset-y-0 left-0 z-40 bg-card border-r border-border">
        <SidebarContent handleLogout={handleLogout} />
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50"
          onClick={() => setDrawerOpen(false)}
        >
          <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" />
          <div
            className="absolute inset-y-0 left-0 w-[240px] bg-card border-r border-border shadow-card-md animate-slide-in"
            onClick={(e) => e.stopPropagation()}
          >
            <SidebarContent
              onClose={() => setDrawerOpen(false)}
              handleLogout={handleLogout}
            />
          </div>
        </div>
      )}

      {/* Content area */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-[240px]">
        <TopHeader
          pageTitle={pageTitle}
          pageSubtitle={pageSubtitle}
          onMenuOpen={() => setDrawerOpen(true)}
        />
        <main className="flex-1 p-4 md:p-6 max-w-[1280px] w-full mx-auto pb-24 lg:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile bottom tab bar */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border flex items-center justify-around px-2"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)', paddingTop: '8px' }}
      >
        {mobileQuickNav.map((item) => {
          const active = location.pathname === item.path;
          const isNew = item.label === 'New';
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors ${
                active ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <div className={isNew ? 'w-8 h-8 rounded-full bg-primary flex items-center justify-center' : ''}>
                <item.icon
                  className={isNew ? 'w-4 h-4 text-white' : 'w-5 h-5'}
                  strokeWidth={1.75}
                />
              </div>
              {!isNew && <span className="text-[10px] font-medium">{item.label}</span>}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-muted-foreground"
        >
          <Menu className="w-5 h-5" strokeWidth={1.75} />
          <span className="text-[10px] font-medium">More</span>
        </button>
      </nav>
    </div>
  );
};
