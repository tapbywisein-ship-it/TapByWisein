import { type ReactNode, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PortalLayout } from '@/components/PortalLayout';
import { PublicNav } from '@/components/PublicNav';
import { useAppStore } from '@/store/appStore';
import { Link, useSearchParams } from 'react-router-dom';
import { useEvents } from '@/hooks/useEvents';
import { getTheme } from '@/lib/eventThemes';
import { getRegistrationPricing } from '@/lib/ticketPricing';
import { Calendar, MapPin, Search, AlertCircle, CheckCircle2, Clock, Users } from 'lucide-react';
import { EVENT_CATEGORIES } from '@/constants/categories';
import { AppBackgroundGrid } from '@/components/AppBackgroundGrid';

const CATEGORIES = EVENT_CATEGORIES;

const PremiumSearchIcon = () => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
    className="flex items-center justify-center ml-1 mt-0.5 text-primary"
  >
    <Search className="w-[22px] h-[22px]" strokeWidth={2.5} />
  </motion.div>
);

const BackgroundGraphics = () => (
  <>
    {/* Base Environment: Light silver (#F4F6F8), Dark true black (#000000) */}
    <div className="fixed inset-0 pointer-events-none z-0 bg-[#F4F6F8] dark:bg-black transition-colors duration-300" />
    
    {/* Soft Radial Ambient Lighting */}
    <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,1)_0%,transparent_60%)] dark:bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.08)_0%,transparent_60%)]" />
    <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_at_50%_30%,rgba(37,99,235,0.05)_0%,transparent_60%)] dark:bg-[radial-gradient(ellipse_at_50%_30%,rgba(25,129,254,0.18)_0%,transparent_60%)]" />
    
    {/* Refined Technical Grid - Light mode: subtle dark lines */}
    <div 
      className="fixed inset-0 pointer-events-none z-0 opacity-75 dark:hidden" 
      style={{ 
        backgroundImage: 'linear-gradient(to right, rgba(173,181,189,0.30) 1px, transparent 1px), linear-gradient(to bottom, rgba(173,181,189,0.30) 1px, transparent 1px)', 
        backgroundSize: '44px 44px',
        maskImage: 'radial-gradient(ellipse 100% 100% at 50% 20%, black 20%, transparent 80%)',
        WebkitMaskImage: 'radial-gradient(ellipse 100% 100% at 50% 20%, black 20%, transparent 80%)'
      }} 
    />
    
    {/* Refined Technical Grid - Dark mode: crisp high-intensity white hairlines matching light mode prominence */}
    <div 
      className="fixed inset-0 pointer-events-none z-0 hidden dark:block opacity-70" 
      style={{ 
        backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.16) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.16) 1px, transparent 1px)', 
        backgroundSize: '44px 44px',
        maskImage: 'radial-gradient(ellipse 100% 100% at 50% 20%, black 25%, transparent 80%)',
        WebkitMaskImage: 'radial-gradient(ellipse 100% 100% at 50% 20%, black 25%, transparent 80%)'
      }} 
    />
  </>
);

const DiscoverPage = () => {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const [searchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') ?? '');
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [priceFilter, setPriceFilter] = useState<'' | 'free' | 'paid'>('');

  const { data, isLoading, isError, refetch } = useEvents({
    q: search || undefined,
    category: (CATEGORIES.find((c) => c.id === selectedCategory)?.label || selectedCategory) || undefined,
    city: city || undefined,
    price: priceFilter || undefined,
    startDate: dateFrom ? new Date(dateFrom).toISOString() : undefined,
    status: 'PUBLISHED',
    limit: 30,
    orderBy: 'startDate',
    orderDir: 'asc',
  });

  const events = data?.events ?? [];
  const hasFilters = Boolean(selectedCategory || search || city || dateFrom || priceFilter);
  const clearAll = () => {
    setSelectedCategory('');
    setSearch('');
    setCity('');
    setDateFrom('');
    setPriceFilter('');
  };

  // Scroll to top on mount to ensure clean view
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const wrap = (children: ReactNode) =>
    isAuthenticated ? (
      <PortalLayout>
        <div className="relative min-h-full px-5 lg:px-10 max-w-[1360px] mx-auto w-full">
          {children}
        </div>
      </PortalLayout>
    ) : (
      <div className="min-h-screen relative flex flex-col overflow-hidden font-sans bg-background">
        <AppBackgroundGrid />
        <div className="relative z-20">
          <PublicNav />
        </div>
        <main className="relative z-10 max-w-[1360px] w-full mx-auto px-5 lg:px-10 flex-1">{children}</main>
      </div>
    );

  return wrap(
    <div className="relative pb-[80px] w-full">
      <style>{`
        /* --- GLOBAL NAVBAR GLASS OVERRIDE --- */
        nav, header {
          background: rgba(255, 255, 255, 0.45) !important;
          backdrop-filter: blur(24px) saturate(135%) !important;
          -webkit-backdrop-filter: blur(24px) saturate(135%) !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.7) !important;
          box-shadow: 0 4px 24px -8px rgba(33, 37, 41, 0.05) !important;
        }

        .dark nav, .dark header {
          background: rgba(14, 14, 14, 0.75) !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.12) !important;
          box-shadow: 0 4px 24px -8px rgba(0, 0, 0, 0.7) !important;
        }

        /* --- MATERIAL SYSTEM (LIGHT & DARK GLASS WITH CRISP OUTLINES) --- */
        .premium-glass-panel {
          background: rgba(255, 255, 255, 0.40);
          backdrop-filter: blur(24px) saturate(135%);
          -webkit-backdrop-filter: blur(24px) saturate(135%);
          border-top: 1px solid rgba(255, 255, 255, 0.90);
          border-left: 1px solid rgba(255, 255, 255, 0.70);
          border-right: 1px solid rgba(255, 255, 255, 0.70);
          border-bottom: 1px solid rgba(255, 255, 255, 0.50);
          box-shadow: 
            inset 0 1px 1px rgba(255, 255, 255, 1),
            0 8px 32px -8px rgba(33, 37, 41, 0.06);
          position: relative;
          overflow: hidden;
        }

        .dark .premium-glass-panel {
          background: rgba(18, 18, 20, 0.72);
          border-top: 1px solid rgba(255, 255, 255, 0.24);
          border-left: 1px solid rgba(255, 255, 255, 0.16);
          border-right: 1px solid rgba(255, 255, 255, 0.16);
          border-bottom: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: 
            inset 0 1px 1px rgba(255, 255, 255, 0.14),
            0 8px 32px -8px rgba(0, 0, 0, 0.75);
        }

        .premium-glass-chip {
          background: rgba(255, 255, 255, 0.45);
          backdrop-filter: blur(20px) saturate(130%);
          -webkit-backdrop-filter: blur(20px) saturate(130%);
          border: 1px solid rgba(255, 255, 255, 0.70);
          box-shadow: 0 4px 12px -4px rgba(33, 37, 41, 0.04);
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .premium-glass-chip:hover {
          background: rgba(255, 255, 255, 0.65);
          border-color: rgba(255, 255, 255, 0.95);
          transform: translateY(-2px);
          box-shadow: 0 6px 16px -4px rgba(33, 37, 41, 0.06);
        }

        .dark .premium-glass-chip {
          background: rgba(24, 24, 27, 0.65);
          border: 1px solid rgba(255, 255, 255, 0.15);
          box-shadow: 0 4px 12px -4px rgba(0, 0, 0, 0.5);
        }
        .dark .premium-glass-chip:hover {
          background: rgba(39, 39, 42, 0.85);
          border-color: rgba(255, 255, 255, 0.30);
          box-shadow: 0 6px 16px -4px rgba(0, 0, 0, 0.7);
        }

        .premium-glass-card {
          background: rgba(255, 255, 255, 0.45);
          backdrop-filter: blur(20px) saturate(135%);
          -webkit-backdrop-filter: blur(20px) saturate(135%);
          border-top: 1px solid rgba(255, 255, 255, 0.90);
          border-left: 1px solid rgba(255, 255, 255, 0.70);
          border-right: 1px solid rgba(255, 255, 255, 0.70);
          border-bottom: 1px solid rgba(255, 255, 255, 0.50);
          box-shadow: 
            inset 0 1px 1px rgba(255, 255, 255, 1),
            0 8px 24px -8px rgba(33, 37, 41, 0.05);
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .premium-glass-card:hover {
          background: rgba(255, 255, 255, 0.65);
          border-color: rgba(255, 255, 255, 0.95);
          transform: translateY(-3px);
          box-shadow: 
            inset 0 1px 1px rgba(255, 255, 255, 1),
            0 12px 32px -8px rgba(33, 37, 41, 0.08);
        }

        .dark .premium-glass-card {
          background: rgba(18, 18, 20, 0.70);
          border-top: 1px solid rgba(255, 255, 255, 0.22);
          border-left: 1px solid rgba(255, 255, 255, 0.15);
          border-right: 1px solid rgba(255, 255, 255, 0.15);
          border-bottom: 1px solid rgba(255, 255, 255, 0.10);
          box-shadow: 
            inset 0 1px 1px rgba(255, 255, 255, 0.10),
            0 8px 24px -8px rgba(0, 0, 0, 0.6);
        }
        .dark .premium-glass-card:hover {
          background: rgba(26, 26, 30, 0.88);
          border-top-color: rgba(255, 255, 255, 0.35);
          border-left-color: rgba(255, 255, 255, 0.25);
          border-right-color: rgba(255, 255, 255, 0.25);
          border-bottom-color: rgba(255, 255, 255, 0.18);
          box-shadow: 
            inset 0 1px 1px rgba(255, 255, 255, 0.18),
            0 12px 32px -8px rgba(0, 0, 0, 0.85);
        }

        /* --- SUBTLE SILVER REFLECTION ANIMATION --- */
        @keyframes soft-sweep {
          0% { left: -100%; }
          15% { left: 200%; }
          100% { left: 200%; }
        }
        .glass-sweep-fx::after {
          content: ''; position: absolute; top: 0; left: -100%; width: 40%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent);
          transform: skewX(-20deg); pointer-events: none; z-index: 10;
          animation: soft-sweep 10s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }

        .dark .glass-sweep-fx::after {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent);
        }

        .hide-scroll::-webkit-scrollbar { display: none; }
        .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }

        /* ─────────────────────────────────────────────────────
           BYWISEIN BRAND WORDMARK — METALLIC SHINE
           ───────────────────────────────────────────────────── */
        @keyframes premium-reflection {
          0%   { background-position: 100% center; }
          25%  { background-position: 0% center; }
          100% { background-position: 0% center; }
        }

        .wordmark-premium {
          background: linear-gradient(
            110deg,
            #1e2124 0%,
            #2c3136 38%,
            #1981FE 46.5%,
            #DEE2E6 50%,
            #1981FE 53.5%,
            #2c3136 62%,
            #1e2124 100%
          );
          background-size: 300% auto;
          color: transparent;
          -webkit-background-clip: text;
          background-clip: text;
          filter: drop-shadow(0 4px 6px rgba(0,0,0,0.08));
          -webkit-text-stroke: 1px rgba(255,255,255,0.07);
          animation: premium-reflection 5s cubic-bezier(0.25, 0.1, 0.25, 1) infinite;
        }

        .dark .wordmark-premium {
          background: linear-gradient(
            110deg,
            #888888 0%,
            #CCCCCC 38%,
            #1981FE 46.5%,
            #FFFFFF 50%,
            #1981FE 53.5%,
            #CCCCCC 62%,
            #888888 100%
          );
          background-size: 300% auto;
          color: transparent;
          -webkit-background-clip: text;
          background-clip: text;
          filter: drop-shadow(0 4px 10px rgba(0,0,0,0.4));
          -webkit-text-stroke: 1px rgba(255,255,255,0.15);
        }
      `}</style>

      {/* 1. DISCOVER HEADER */}
      <div className="mt-[42px] px-1">
        <motion.p 
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, ease: [0.25, 0.1, 0.25, 1] }}
          className="font-black uppercase wordmark-premium mb-1 w-max"
          style={{ fontSize: 'clamp(2.2rem, 4vw, 3rem)', letterSpacing: '0.08em', paddingBottom: '0.1em' }}
        >
          BYWISEIN
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut" }}>
          <h1 className="text-[24px] font-[700] tracking-[-0.02em] leading-[1.2] text-foreground flex items-center gap-2">
            Discover
            <PremiumSearchIcon />
          </h1>
          <p className="mt-[6px] text-[15px] font-[450] text-muted-foreground leading-[1.5] max-w-xl">
            Find events, communities and people worth meeting.
          </p>
        </motion.div>
      </div>

      {/* 2. SEARCH BAR */}
      <motion.div 
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05, ease: "easeOut" }} 
        className="mt-[26px] premium-glass-panel glass-sweep-fx rounded-[1.5rem] lg:rounded-full flex flex-col lg:flex-row items-center w-full z-20 lg:h-[60px]"
      >
        {/* Main Search */}
        <div className="flex-1 flex items-center px-6 h-[52px] lg:h-full group relative w-full lg:w-auto">
          <Search className="w-[18px] h-[18px] text-muted-foreground group-focus-within:text-primary shrink-0 transition-colors" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events, topics, venues..."
            className="w-full h-full bg-transparent border-none outline-none pl-3 text-[14px] font-[500] text-foreground placeholder:text-muted-foreground focus:placeholder:text-foreground/70 transition-colors"
          />
          <div className="absolute inset-0 border-[1.5px] border-transparent group-focus-within:border-primary/50 rounded-[1.5rem] lg:rounded-full pointer-events-none transition-colors opacity-0 group-focus-within:opacity-100 shadow-[inset_0_0_0_1px_rgba(25,129,254,0.15)]" />
        </div>
        
        {/* Divider */}
        <div className="w-full h-px lg:w-px lg:h-[32px] bg-gradient-to-r lg:bg-gradient-to-b from-transparent via-border/80 dark:via-white/20 to-transparent self-center opacity-70" />
        
        {/* Location */}
        <div className="w-full lg:w-[190px] flex items-center px-5 h-[52px] lg:h-full group relative">
          <MapPin className="w-[18px] h-[18px] text-muted-foreground group-focus-within:text-primary shrink-0 transition-colors" />
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Location"
            className="w-full h-full bg-transparent border-none outline-none pl-2.5 text-[14px] font-[500] text-foreground placeholder:text-muted-foreground focus:placeholder:text-foreground/70"
          />
        </div>

        <div className="w-full h-px lg:w-px lg:h-[32px] bg-gradient-to-r lg:bg-gradient-to-b from-transparent via-border/80 dark:via-white/20 to-transparent self-center opacity-70" />
        
        {/* Date */}
        <div className="w-full lg:w-[170px] flex items-center px-5 h-[52px] lg:h-full group relative">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full h-full bg-transparent border-none outline-none text-[14px] font-[500] text-foreground cursor-pointer [color-scheme:light] dark:[color-scheme:dark]"
          />
        </div>

        <div className="w-full h-px lg:w-px lg:h-[32px] bg-gradient-to-r lg:bg-gradient-to-b from-transparent via-border/80 dark:via-white/20 to-transparent self-center opacity-70" />
        
        {/* Price Toggles */}
        <div className="flex items-center px-2 py-2 lg:py-0 h-[56px] lg:h-full w-full lg:w-auto">
          {(['', 'free', 'paid'] as const).map((p) => {
            const active = priceFilter === p;
            return (
              <button
                key={p || 'all'}
                onClick={() => setPriceFilter(p)}
                className={`flex-1 lg:flex-none px-[22px] py-[10px] text-[13px] font-[600] rounded-full transition-all border ${
                  active 
                    ? 'bg-gradient-to-b from-[#1981FE] to-[#1673e6] text-white shadow-[0_2px_8px_rgba(25,129,254,0.35),inset_0_1px_1px_rgba(255,255,255,0.4)] border-[#1673e6]' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 border-transparent dark:hover:border-white/10'
                }`}
              >
                {p === '' ? 'All' : p === 'free' ? 'Free' : 'Paid'}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* 3. CATEGORIES */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.10 }} className="mt-[22px] w-full overflow-hidden z-10 px-1">
        <div className="flex gap-[14px] overflow-x-auto pb-4 hide-scroll snap-x">
          {CATEGORIES.map((cat) => {
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(active ? '' : cat.id)}
                className={`premium-glass-chip snap-start shrink-0 flex items-center gap-2.5 px-[18px] py-[10px] rounded-[14px] group ${
                  active 
                    ? 'bg-white/85 dark:bg-primary/25 border-primary/60 dark:border-primary/60 shadow-sm text-primary dark:text-primary font-bold' 
                    : 'text-foreground/80 dark:text-foreground/85'
                }`}
              >
                <cat.icon className={`w-[16px] h-[16px] transition-colors ${active ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`} />
                <span className={`text-[14px] font-[600] transition-colors ${active ? 'text-primary' : 'text-foreground/80 group-hover:text-foreground'}`}>
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* 4. EVENTS SECTION */}
      <div className="mt-[34px] relative z-10">
        <div className="flex items-center gap-4 mb-[18px] px-1">
          <h2 className="text-[12px] font-[700] text-foreground/80 tracking-[0.14em] uppercase whitespace-nowrap flex items-center">
            {selectedCategory ? `${CATEGORIES.find((c) => c.id === selectedCategory)?.label ?? selectedCategory} Events` : 'All Events'}
            <span className="text-muted-foreground ml-[6px] font-[600]">({events.length})</span>
          </h2>
          <div className="h-px flex-1 bg-gradient-to-r from-border dark:from-white/15 to-transparent" />
          {hasFilters && (
            <button onClick={clearAll} className="text-[12px] font-[600] text-primary hover:underline tracking-[0.05em] uppercase transition-colors whitespace-nowrap">
              Clear filters
            </button>
          )}
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[24px]">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="premium-glass-card rounded-[1.25rem] h-[340px] animate-pulse" />
            ))}
          </div>
        )}

        {/* Compact Glass Error */}
        {isError && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="premium-glass-card p-[16px] rounded-[16px] max-w-lg flex items-center justify-between border-l-4 border-l-destructive">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-[18px] h-[18px] text-destructive shrink-0" />
              <div>
                <h3 className="text-[14px] font-[600] text-foreground">Unable to load events</h3>
                <p className="text-[13px] font-[450] text-muted-foreground mt-0.5">Check your connection and try again.</p>
              </div>
            </div>
            <button onClick={() => refetch()} className="shrink-0 px-4 py-1.5 rounded-[8px] bg-secondary text-secondary-foreground text-[13px] font-[600] hover:bg-secondary/80 transition-colors border border-border dark:border-white/15">
              Retry
            </button>
          </motion.div>
        )}

        {/* Compact Glass Empty */}
        {!isLoading && !isError && events.length === 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="py-[60px] px-4 flex flex-col items-center text-center">
            <Calendar className="w-[24px] h-[24px] text-muted-foreground mb-4" />
            <p className="text-[16px] font-[600] text-foreground">No events found</p>
            <p className="text-[14px] font-[450] text-muted-foreground mt-1.5 mb-5">Try another category, date or location.</p>
            {hasFilters && (
              <button onClick={clearAll} className="text-[13px] font-[600] text-primary hover:underline transition-colors">
                Clear all filters
              </button>
            )}
          </motion.div>
        )}

        {/* Event Glass Grid */}
        {!isLoading && !isError && events.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[24px]">
            {events.map((e, i) => {
              const theme = getTheme(e.theme);
              const { topLabel: price } = getRegistrationPricing(e);
              const org = e.organizer;
              const organizerName = org?.profile?.company || (org?.profile ? `${org.profile.firstName ?? ''} ${org.profile.lastName ?? ''}`.trim() : org?.username) || null;
              const isRegistered = e.registrationStatus === 'REGISTERED' || e.registrationStatus === 'ATTENDED';
              const isWaitlisted = e.registrationStatus === 'WAITLISTED';

              return (
                <motion.div key={e.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 + (i % 9) * 0.05, ease: "easeOut" }}>
                  <Link to={`/event/${e.id}`} className="block group h-full">
                    <div className="premium-glass-card rounded-[20px] flex flex-col h-full p-0 overflow-hidden">
                      
                      {/* Image Area */}
                      <div className="relative aspect-[4/3] w-full rounded-t-[20px] overflow-hidden bg-muted/40 border-b border-border/50 dark:border-white/10 shadow-sm z-20">
                        {e.coverImage ? (
                          <img src={e.coverImage} alt={e.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-[600ms] group-hover:scale-[1.03]" />
                        ) : (
                          <div className="w-full h-full transition-transform duration-[600ms] group-hover:scale-[1.03]" style={{ background: theme.gradient }} aria-hidden />
                        )}
                        
                        {e.category && (
                          <span className="absolute top-[10px] left-[10px] px-[10px] py-[4px] rounded-[8px] text-[10px] font-[700] tracking-[0.05em] uppercase bg-background/85 dark:bg-card/90 text-foreground shadow-sm backdrop-blur-md border border-border/60 dark:border-white/15">
                            {e.category}
                          </span>
                        )}
                        <div className="absolute top-[10px] right-[10px] flex gap-2">
                          {isRegistered && (
                            <span className="px-[10px] py-[4px] rounded-[8px] text-[10px] font-[700] tracking-[0.05em] uppercase bg-[#10B981]/95 text-white shadow-sm backdrop-blur-md flex items-center gap-[4px] border border-white/20">
                              <CheckCircle2 className="w-[12px] h-[12px]" /> Registered
                            </span>
                          )}
                          {!isRegistered && isWaitlisted && (
                            <span className="px-[10px] py-[4px] rounded-[8px] text-[10px] font-[700] tracking-[0.05em] uppercase bg-[#F59E0B]/95 text-white shadow-sm backdrop-blur-md border border-white/20">
                              Waitlisted
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Content Area */}
                      <div className="p-5 flex flex-col flex-1 bg-transparent z-20">
                        <h3 className="text-[18px] font-[700] text-foreground leading-[1.3] line-clamp-2 group-hover:text-primary transition-colors">
                          {e.title}
                        </h3>
                        
                        <div className="mt-[12px] space-y-[6px]">
                          <p className="text-[13px] font-[500] text-muted-foreground flex items-center gap-[6px]">
                            <Clock className="w-[14px] h-[14px] text-muted-foreground/80" />
                            {new Date(e.startDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                          {(e.city || e.address) && (
                            <p className="text-[13px] font-[500] text-muted-foreground flex items-center gap-[6px]">
                              <MapPin className="w-[14px] h-[14px] text-muted-foreground/80" />
                              <span className="truncate">{e.locationType === 'VIRTUAL' ? 'Online' : (e.city || e.address)}</span>
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-[16px] mt-auto border-t border-border/50 dark:border-white/10">
                          <div className="flex items-center gap-[8px]">
                            <div className="w-[22px] h-[22px] rounded-full bg-muted border border-border dark:border-white/15 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                              {organizerName ? <span className="text-[10px] font-[700] text-foreground">{organizerName.charAt(0).toUpperCase()}</span> : <Users className="w-[12px] h-[12px] text-muted-foreground" />}
                            </div>
                            <span className="text-[13px] font-[500] text-muted-foreground truncate max-w-[120px]">
                              {organizerName || 'Organizer'}
                            </span>
                          </div>
                          
                          <span className="text-[14px] font-[700] text-foreground">
                            {price}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DiscoverPage;
