import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/appStore';

/**
 * The single top nav for every public (shareable / logged-out-browsable) page:
 * brand + primary links + Sign in / Get started, or a Dashboard link when
 * already authenticated. `loginFrom` is the path to return to after auth;
 * defaults to the current URL so a visitor lands back where they were browsing.
 */
export function PublicNav({ loginFrom }: { loginFrom?: string }) {
  const [open, setOpen] = useState(false);
  const { isAuthenticated, user } = useAppStore();
  const dashPath =
    user?.role === 'organizer'
      ? '/organizer/dashboard'
      : user?.role === 'admin'
        ? '/admin/dashboard'
        : '/dashboard';
  const loginState = {
    from: { pathname: loginFrom ?? window.location.pathname + window.location.search },
  };

  const links = (
    <>
      <Link to="/discover" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground" onClick={() => setOpen(false)}>Discover</Link>
      <Link to="/communities" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground" onClick={() => setOpen(false)}>Communities</Link>
      <Link to="/ambassadors" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground" onClick={() => setOpen(false)}>Ambassadors</Link>
      {/* TEMP DISABLED: Plans page, re-enable when paid plans launch */}
      {/* <Link to="/pricing" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground" onClick={() => setOpen(false)}>Pricing</Link> */}
    </>
  );

  const cta = isAuthenticated ? (
    <Button variant="outline" size="sm" asChild>
      <Link to={dashPath}>Dashboard</Link>
    </Button>
  ) : (
    <>
      <Link 
        to="/login" 
        state={loginState} 
        className="text-sm font-semibold text-[#343A40] hover:text-[#212529] px-3 py-1.5 transition-colors"
      >
        Sign in
      </Link>
      <Link 
        to="/login" 
        state={loginState} 
        className="nav-btn-premium group text-sm font-semibold text-white px-4 py-1.5 rounded-md shadow-sm transition-transform active:scale-[0.98] border border-[#1E3A8A] relative overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #3B82F6 0%, #2563EB 50%, #1D4ED8 100%)',
          boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.3), 0 4px 10px -2px rgba(37,99,235,0.3)'
        }}
      >
        <span className="relative z-10">Get started</span>
        <div className="absolute inset-0 z-0 bg-[linear-gradient(60deg,transparent_40%,rgba(255,255,255,0.25)_50%,transparent_60%)] -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-700 ease-out" />
      </Link>
    </>
  );

  return (
    <header className="border-b border-[#DEE2E6] bg-white/70 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-xwide mx-auto px-4 h-14 flex items-center justify-between">
        <div className="hover:opacity-90 transition-opacity">
          <Logo />
        </div>
        <div className="hidden md:flex items-center gap-6">{links}</div>
        <div className="hidden md:flex items-center gap-2">{cta}</div>
        <button
          className="md:hidden text-foreground"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen(!open)}
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>
      {open && (
        <div className="md:hidden px-4 py-4 border-t border-[#DEE2E6] flex flex-col gap-4 bg-[#F8F9FA]">
          {links}
          <div className="flex items-center gap-2">{cta}</div>
        </div>
      )}
    </header>
  );
}
