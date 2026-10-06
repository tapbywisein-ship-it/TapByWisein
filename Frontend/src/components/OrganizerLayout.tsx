import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { ThemeToggle, NavbarThemeToggle } from '@/components/ThemeToggle';
import { useAppStore } from '@/store/appStore';
import { SignOutConfirmDialog } from '@/components/SignOutConfirmDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  LayoutDashboard, Calendar, Users, Download, LogOut, Ticket, Wallet, UserCircle, Plus, QrCode, Boxes, Scan, Compass, Network, Menu, X,
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard',    icon: LayoutDashboard, path: '/organizer/dashboard' },
  { label: 'Create Event', icon: Calendar,         path: '/organizer/events/create' },
  { label: 'Communities',  icon: Boxes,            path: '/organizer/communities' },
  { label: 'Attendees',    icon: Users,            path: '/organizer/attendees' },
  { label: 'Leads',        icon: Download,         path: '/organizer/leads' },
  { label: 'Payouts',      icon: Wallet,           path: '/organizer/payouts' },
  { label: 'Connect',      icon: Scan,             path: '/connect' },
  { label: 'Connections',  icon: Network,          path: '/connections' },
  { label: 'Browse Events', icon: Compass,         path: '/events' },
  { label: 'My Tickets',   icon: Ticket,           path: '/my-tickets' },
  { label: 'Tap Card',     icon: QrCode,           path: '/apply-card' },
];

/* Four primary tabs for mobile bottom navigation */
const mobileNav = [
  { label: 'Home',      icon: LayoutDashboard, path: '/organizer/dashboard' },
  { label: 'Attendees', icon: Users,            path: '/organizer/attendees' },
  { label: 'New',       icon: Plus,             path: '/organizer/events/create' },
  { label: 'Connect',   icon: Scan,             path: '/connect' },
];

const UserAvatar = ({ avatar, name, email }: { avatar?: string; name?: string; email?: string }) => {
  const [imgError, setImgError] = useState(false);

  const isValidUrl =
    avatar &&
    typeof avatar === 'string' &&
    avatar.trim() !== '' &&
    (avatar.startsWith('http://') ||
      avatar.startsWith('https://') ||
      avatar.startsWith('/') ||
      avatar.startsWith('data:'));

  const getFirstLetter = () => {
    if (name?.trim()) return name.trim()[0].toUpperCase();
    if (email?.trim()) return email.trim()[0].toUpperCase();
    return 'U';
  };

  if (isValidUrl && !imgError) {
    return (
      <img
        src={avatar}
        alt={name || 'Profile'}
        className="w-full h-full object-cover"
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <span className="font-bold text-sm text-foreground select-none uppercase">
      {getFirstLetter()}
    </span>
  );
};

export const OrganizerLayout = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAppStore((s) => s.user);
  const logout = useAppStore((s) => s.logout);
  const [moreOpen, setMoreOpen] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const displayName = user?.name || user?.username || user?.email?.split('@')[0] || 'User';

  const handleSignOutConfirm = () => {
    logout();
    navigate('/login');
    setSignOutOpen(false);
  };

  return (
    <div className="min-h-screen bg-background flex">
      <NavbarThemeToggle />
      <aside className="group hidden md:flex flex-col w-16 hover:w-60 transition-[width] duration-200 ease-out overflow-hidden border-r border-border px-2 py-4 fixed h-full z-40 bg-background">
        <div className="mb-1 px-1"><Logo collapsible /></div>
        <p className="text-xs text-muted-foreground mb-6 px-3 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">Organizer</p>
        
        <nav className="flex-1 space-y-0.5 overflow-y-auto overflow-x-hidden" aria-label="Organizer">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                title={item.label}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  active
                    ? 'bg-accent text-primary font-medium border-l-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span className="whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        {/* User Profile & Actions at Sidebar Bottom */}
        <div className="pt-3 border-t border-border mt-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="w-full flex items-center gap-3 p-1.5 rounded-xl hover:bg-muted/80 transition-colors text-left outline-none focus-visible:ring-2 focus-visible:ring-primary"
                title={displayName}
              >
                <div className="w-9 h-9 rounded-full bg-primary/20 text-primary font-semibold text-xs flex items-center justify-center flex-shrink-0 overflow-hidden border border-border shadow-sm">
                  <UserAvatar avatar={user?.avatar} name={user?.name} email={user?.email} />
                </div>
                <div className="flex-1 min-w-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-sm font-semibold text-foreground truncate leading-tight">{displayName}</p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="end" className="w-52 p-1.5 shadow-lg rounded-xl mb-1">
              <DropdownMenuItem
                onClick={() => navigate('/profile')}
                className="cursor-pointer gap-2.5 py-2 px-2.5 rounded-lg text-foreground hover:bg-muted"
              >
                <UserCircle className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Profile</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1" />
              <DropdownMenuItem
                onClick={() => setSignOutOpen(true)}
                className="cursor-pointer gap-2.5 py-2 px-2.5 rounded-lg text-destructive focus:text-destructive focus:bg-destructive/10"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      <div className="flex-1 md:ml-16 min-h-screen min-w-0">
        <main className="p-4 md:p-8 max-w-xwide mx-auto pb-24 md:pb-8">{children}</main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-t border-border flex items-center justify-around px-2 pb-safe" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}>
        {mobileNav.map((item) => {
          const active = location.pathname === item.path;
          const isNew = item.label === 'New';
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl transition-colors ${active ? 'text-primary' : 'text-muted-foreground'}`}
            >
              <div className={isNew ? 'w-8 h-8 rounded-full bg-primary flex items-center justify-center' : ''}>
                <item.icon className={`${isNew ? 'w-4 h-4 text-primary-foreground' : 'w-5 h-5'}`} />
              </div>
              {!isNew && <span className="text-[10px] font-medium">{item.label}</span>}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          aria-label="More navigation"
          className="flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl text-muted-foreground transition-colors"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] font-medium">More</span>
        </button>
      </nav>

      {/* Mobile "More" sheet */}
      {moreOpen && (
        <div className="md:hidden fixed inset-0 z-[60]" onClick={() => setMoreOpen(false)}>
          <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" aria-hidden />
          <div
            className="absolute bottom-0 left-0 right-0 rounded-t-2xl border-t border-border bg-card shadow-card p-4"
            style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-primary/20 text-primary font-semibold text-xs flex items-center justify-center overflow-hidden border border-border">
                  <UserAvatar avatar={user?.avatar} name={user?.name} email={user?.email} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground leading-tight">{displayName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                aria-label="Close menu"
                className="inline-flex w-8 h-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              {navItems.map((item) => {
                const active = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMoreOpen(false)}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border py-3 px-2 text-center transition-colors ${
                      active
                        ? 'border-primary/40 bg-accent text-primary'
                        : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="text-[11px] font-medium leading-tight">{item.label}</span>
                  </Link>
                );
              })}
              <Link
                to="/profile"
                onClick={() => setMoreOpen(false)}
                className={`flex flex-col items-center gap-1.5 rounded-xl border py-3 px-2 text-center transition-colors ${
                  location.pathname === '/profile'
                    ? 'border-primary/40 bg-accent text-primary'
                    : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <UserCircle className="w-5 h-5" />
                <span className="text-[11px] font-medium leading-tight">Profile</span>
              </Link>
            </div>
            
            <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
              <ThemeToggle />
              <button
                type="button"
                onClick={() => { setMoreOpen(false); setSignOutOpen(true); }}
                className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="w-4 h-4" /> Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Sign out confirmation dialog ───────────────────── */}
      <SignOutConfirmDialog
        open={signOutOpen}
        onOpenChange={setSignOutOpen}
        onConfirm={handleSignOutConfirm}
      />
    </div>
  );
};
