import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Mail, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/Logo';
import { AppBackgroundGrid } from '@/components/AppBackgroundGrid';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAppStore, type UserRole } from '@/store/appStore';
import { apiGetMe } from '@/services/auth.service';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  getLoginReturnPathname,
  safePublicEventReturnPath,
  getReturnPathFromSearch,
  setPostAuthReturnPath,
} from '@/lib/loginReturnPath';

const ROLE_PATHS: Record<UserRole, string> = {
  attendee: '/dashboard',
  organizer: '/organizer/dashboard',
  admin: '/admin/dashboard',
};

/**
 * Login — email + password, with Google OAuth as a parallel option.
 *
 * Same email always = same account regardless of which path you choose.
 * Demo-mode fallback (when backend is offline) uses mockAttendee.
 */
const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // Deep-link support: respect both `location.state.from` (ProtectedRoute
  // redirect) and `?from=/some/path` on the URL (shareable login link).
  // The state-based path keeps its strict /e/:slug check; the query-string
  // path goes through the broader same-origin guard in safeAppReturnPath.
  const rawFrom = getLoginReturnPathname(location.state);
  const returnPath =
    safePublicEventReturnPath(rawFrom) ?? getReturnPathFromSearch(location.search);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const login = useAppStore((s) => s.login);
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const currentRole = useAppStore((s) => s.user?.role);

  // Already signed in? Don't show the login form — go straight to the app.
  if (isAuthenticated) {
    return <Navigate to={ROLE_PATHS[(currentRole as UserRole) ?? 'attendee'] ?? '/dashboard'} replace />;
  }

  const goAfterAuth = (role: UserRole) => {
    navigate(returnPath ?? ROLE_PATHS[role]);
  };

  const handleSignIn = async (e: FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();
    if (!cleanEmail || !cleanPassword) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password: cleanPassword });
      if (error) throw new Error(error.message);
      const user = await apiGetMe();
      login(user);
      toast.success('Welcome back');
      goAfterAuth(user.role);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sign-in failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      if (returnPath) setPostAuthReturnPath(returnPath);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Google sign-in failed';
      toast.error(msg);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      <AppBackgroundGrid />

      <style>{`
        @keyframes premium-reflection {
          0%   { background-position: 100% center; }
          25%  { background-position: 0% center; }
          100% { background-position: 0% center; }
        }

        .wordmark-premium {
          background: linear-gradient(
            110deg,
            #1e293b 0%,
            #334155 38%,
            #3B82F6 47.5%,
            #93C5FD 50%,
            #3B82F6 52.5%,
            #334155 62%,
            #1e293b 100%
          );
          background-size: 300% auto;
          color: transparent;
          -webkit-background-clip: text;
          background-clip: text;
          filter: drop-shadow(0 2px 6px rgba(15, 23, 42, 0.08));
          -webkit-text-stroke: 1px rgba(0, 0, 0, 0.04);
          animation: premium-reflection 4.5s cubic-bezier(0.25, 0.1, 0.25, 1) infinite;
        }

        .dark .wordmark-premium {
          background: linear-gradient(
            110deg,
            #e2e8f0 0%,
            #ffffff 35%,
            #38bdf8 46%,
            #ffffff 50%,
            #38bdf8 54%,
            #ffffff 65%,
            #e2e8f0 100%
          );
          background-size: 300% auto;
          color: transparent;
          -webkit-background-clip: text;
          background-clip: text;
          filter: drop-shadow(0 0 24px rgba(56,189,248,0.45)) drop-shadow(0 4px 14px rgba(0,0,0,0.8));
          -webkit-text-stroke: 1px rgba(255,255,255,0.25);
        }
      `}</style>

      <header className="relative z-10 px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between max-w-xwide mx-auto w-full">
        <Logo size="md" />
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <Link
            to={returnPath ?? '/'}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors py-1.5 px-2 rounded-lg"
          >
            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>{returnPath ? 'Back to event' : 'Back to home'}</span>
          </Link>
        </div>
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 py-6 sm:py-12">
        <div className="w-full max-w-[420px] mx-auto space-y-5 sm:space-y-6">
          <div className="text-center space-y-1">
            <p className="text-[11px] sm:text-xs uppercase tracking-[0.22em] text-muted-foreground font-semibold">
              Welcome to
            </p>
            <h1
              className="font-black uppercase wordmark-premium mx-auto w-max text-2xl sm:text-3xl md:text-4xl tracking-[0.06em] pb-0.5 select-none"
            >
              TAPBYWISEIN
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 px-2">
              Sign in with your email and password, or continue with Google.
            </p>
          </div>

          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="login-email" className="text-xs sm:text-sm font-medium">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="login-email"
                  type="email"
                  placeholder="you@email.com"
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11 text-base sm:text-sm"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="login-pw" className="text-xs sm:text-sm font-medium">Password</Label>
                <Link to="/forgot-password" className="text-xs text-primary hover:underline font-medium">
                  Forgot password?
                </Link>
              </div>
              <div className="relative flex items-center">
                <Input
                  id="login-pw"
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-3.5 pr-11 h-11 text-base sm:text-sm leading-normal tracking-wider"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                  className="absolute right-2.5 w-8 h-8 text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center rounded-lg hover:bg-muted/60"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full h-11 text-sm font-semibold rounded-xl shadow-sm"
              disabled={loading || !email || !password}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <div className="relative my-1">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/60" />
            </div>
            <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
              <span className="bg-background/90 backdrop-blur-md px-3 py-0.5 rounded-full border border-border/40 text-muted-foreground shadow-sm">
                or
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full h-11 text-sm font-medium rounded-xl gap-2.5 bg-card/70 hover:bg-card border-border/80"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </Button>

          <p className="text-center text-xs sm:text-sm text-muted-foreground pt-1">
            New to TapByWisein?{' '}
            {/* Forward the return path so signup doesn't lose "go back to /e/:id" */}
            <Link to="/register" state={location.state} className="text-primary font-semibold hover:underline">
              Create an account
            </Link>
          </p>

          <p className="text-center text-xs text-muted-foreground">
            By continuing, you agree to our{' '}
            <Link to="/terms" className="text-primary hover:underline">Terms</Link> and{' '}
            <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
          </p>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;
