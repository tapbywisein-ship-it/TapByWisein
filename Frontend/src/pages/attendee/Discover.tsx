import { type ReactNode, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PortalLayout } from '@/components/PortalLayout';
import { PublicNav } from '@/components/PublicNav';
import { useAppStore } from '@/store/appStore';
import { Link, useSearchParams } from 'react-router-dom';
import { useEvents } from '@/hooks/useEvents';
import { getTheme } from '@/lib/eventThemes';
import { getRegistrationPricing } from '@/lib/ticketPricing';
import { Calendar, MapPin, Search, AlertCircle, CheckCircle2, Clock, Cpu, TrendingUp, Palette, HeartPulse, Sparkles, Music, Trophy, Utensils, Users, Compass } from 'lucide-react';

const CATEGORIES = [
  { id: 'tech',     label: 'Tech',     icon: Cpu },
  { id: 'business', label: 'Business', icon: TrendingUp },
  { id: 'design',   label: 'Design',   icon: Palette },
  { id: 'health',   label: 'Health',   icon: HeartPulse },
  { id: 'social',   label: 'Social',   icon: Sparkles },
  { id: 'arts',     label: 'Arts',     icon: Music },
  { id: 'sports',   label: 'Sports',   icon: Trophy },
  { id: 'food',     label: 'Food',     icon: Utensils },
];

const PremiumSearchIcon = () => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
    className="flex items-center justify-center ml-1 mt-0.5 text-[#3B82F6]"
  >
    <Search className="w-[22px] h-[22px]" strokeWidth={2.5} />
  </motion.div>
);

const BackgroundGraphics = () => (
  <>
    {/* Base Silver Environment */}
    <div className="fixed inset-0 pointer-events-none z-0 bg-[#F4F6F8]" />
    
    {/* Soft Radial Ambient Lighting */}
    <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,1)_0%,transparent_60%)]" />
    <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_at_50%_30%,rgba(37,99,235,0.03)_0%,transparent_60%)]" />
    
    {/* Refined Technical Grid - 44px spacing, #ADB5BD at low opacity to show clearly through glass */}
    <div 
      className="fixed inset-0 pointer-events-none z-0" 
      style={{ 
        backgroundImage: 'linear-gradient(to right, rgba(173,181,189,0.25) 1px, transparent 1px), linear-gradient(to bottom, rgba(173,181,189,0.25) 1px, transparent 1px)', 
        backgroundSize: '44px 44px',
        maskImage: 'radial-gradient(ellipse 100% 100% at 50% 20%, black 20%, transparent 80%)',
        WebkitMaskImage: 'radial-gradient(ellipse 100% 100% at 50% 20%, black 20%, transparent 80%)'
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
    category: selectedCategory || undefined,
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
        <div className="relative min-h-full">
          <BackgroundGraphics />
          <div className="relative z-10 px-5 lg:px-10 max-w-[1360px] mx-auto w-full">{children}</div>
        </div>
      </PortalLayout>
    ) : (
      <div className="min-h-screen relative flex flex-col overflow-hidden font-sans">
        <BackgroundGraphics />
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

        /* --- MATERIAL SYSTEM --- */
        .premium-glass-panel {
          background: rgba(255, 255, 255, 0.40);
          backdrop-filter: blur(24px) saturate(135%);
          -webkit-backdrop-filter: blur(24px) saturate(135%);
          border-top: 1px solid rgba(255, 255, 255, 0.85);
          border-left: 1px solid rgba(255, 255, 255, 0.65);
          border-right: 1px solid rgba(255, 255, 255, 0.65);
          border-bottom: 1px solid rgba(255, 255, 255, 0.45);
          box-shadow: 
            inset 0 1px 1px rgba(255, 255, 255, 1),
            0 8px 32px -8px rgba(33, 37, 41, 0.06);
          position: relative;
          overflow: hidden;
        }

        .premium-glass-chip {
          background: rgba(255, 255, 255, 0.45);
          backdrop-filter: blur(20px) saturate(130%);
          -webkit-backdrop-filter: blur(20px) saturate(130%);
          border: 1px solid rgba(255, 255, 255, 0.65);
          box-shadow: 0 4px 12px -4px rgba(33, 37, 41, 0.04);
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .premium-glass-chip:hover {
          background: rgba(255, 255, 255, 0.65);
          border-color: rgba(255, 255, 255, 0.95);
          transform: translateY(-2px);
          box-shadow: 0 6px 16px -4px rgba(33, 37, 41, 0.06);
        }

        .premium-glass-card {
          background: rgba(255, 255, 255, 0.45);
          backdrop-filter: blur(20px) saturate(135%);
          -webkit-backdrop-filter: blur(20px) saturate(135%);
          border-top: 1px solid rgba(255, 255, 255, 0.85);
          border-left: 1px solid rgba(255, 255, 255, 0.65);
          border-right: 1px solid rgba(255, 255, 255, 0.65);
          border-bottom: 1px solid rgba(255, 255, 255, 0.45);
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

        /* --- SUBTLE SILVER REFLECTION ANIMATION --- */
        @keyframes soft-sweep {
          0% { left: -100%; }
          15% { left: 200%; }
          100% { left: 200%; } /* long pause */
        }
        .glass-sweep-fx::after {
          content: ''; position: absolute; top: 0; left: -100%; width: 40%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent);
          transform: skewX(-20deg); pointer-events: none; z-index: 10;
          animation: soft-sweep 10s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }

        .hide-scroll::-webkit-scrollbar { display: none; }
        .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }

        /* ─────────────────────────────────────────────────────
           BYWISEIN BRAND WORDMARK — PREMIUM METALLIC
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
            #2563EB 46.5%,
            #DEE2E6 50%,
            #2563EB 53.5%,
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
      `}</style>

      {/* 1. DISCOVER HEADER - Fixed spacing: mt-[42px] */}
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
          <h1 className="text-[24px] font-[700] tracking-[-0.02em] leading-[1.2] text-[#495057] flex items-center gap-2">
            Discover
            <PremiumSearchIcon />
          </h1>
          {/* Fixed spacing: mt-[10px] */}
          <p className="mt-[6px] text-[15px] font-[450] text-[#6C757D] leading-[1.5] max-w-xl">
            Find events, communities and people worth meeting.
          </p>
        </motion.div>
      </div>

      {/* 2. SEARCH BAR - Fixed spacing: mt-[26px], Strict Height: 60px */}
      <motion.div 
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05, ease: "easeOut" }} 
        className="mt-[26px] premium-glass-panel glass-sweep-fx rounded-[1.5rem] lg:rounded-full flex flex-col lg:flex-row items-center w-full z-20 lg:h-[60px]"
      >
        {/* Main Search */}
        <div className="flex-1 flex items-center px-6 h-[52px] lg:h-full group relative w-full lg:w-auto">
          <Search className="w-[18px] h-[18px] text-[#495057] group-focus-within:text-[#2563EB] shrink-0 transition-colors" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events, topics, venues..."
            className="w-full h-full bg-transparent border-none outline-none pl-3 text-[14px] font-[500] text-[#212529] placeholder:text-[#495057] focus:placeholder:text-[#343A40] transition-colors"
          />
          <div className="absolute inset-0 border-[1.5px] border-transparent group-focus-within:border-[#3B82F6]/30 rounded-[1.5rem] lg:rounded-full pointer-events-none transition-colors opacity-0 group-focus-within:opacity-100 shadow-[inset_0_0_0_1px_rgba(59,130,246,0.05)]" />
        </div>
        
        {/* Divider */}
        <div className="w-full h-px lg:w-px lg:h-[32px] bg-gradient-to-r lg:bg-gradient-to-b from-transparent via-[#CED4DA] to-transparent self-center opacity-70" />
        
        {/* Location */}
        <div className="w-full lg:w-[190px] flex items-center px-5 h-[52px] lg:h-full group relative">
          <MapPin className="w-[18px] h-[18px] text-[#6C757D] group-focus-within:text-[#2563EB] shrink-0 transition-colors" />
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Location"
            className="w-full h-full bg-transparent border-none outline-none pl-2.5 text-[14px] font-[500] text-[#212529] placeholder:text-[#495057] focus:placeholder:text-[#343A40]"
          />
        </div>

        <div className="w-full h-px lg:w-px lg:h-[32px] bg-gradient-to-r lg:bg-gradient-to-b from-transparent via-[#CED4DA] to-transparent self-center opacity-70" />
        
        {/* Date */}
        <div className="w-full lg:w-[170px] flex items-center px-5 h-[52px] lg:h-full group relative">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full h-full bg-transparent border-none outline-none text-[14px] font-[500] text-[#343A40] cursor-pointer"
          />
        </div>

        <div className="w-full h-px lg:w-px lg:h-[32px] bg-gradient-to-r lg:bg-gradient-to-b from-transparent via-[#CED4DA] to-transparent self-center opacity-70" />
        
        {/* Price Toggles */}
        <div className="flex items-center px-2 py-2 lg:py-0 h-[56px] lg:h-full w-full lg:w-auto">
          {(['', 'free', 'paid'] as const).map((p) => {
            const active = priceFilter === p;
            return (
              <button
                key={p || 'all'}
                onClick={() => setPriceFilter(p)}
                className={`flex-1 lg:flex-none px-[22px] py-[10px] text-[13px] font-[600] rounded-full transition-all ${
                  active 
                    ? 'bg-gradient-to-b from-[#3B82F6] to-[#2563EB] text-white shadow-[0_2px_8px_rgba(37,99,235,0.3),inset_0_1px_1px_rgba(255,255,255,0.4)] border border-[#1D4ED8]' 
                    : 'text-[#495057] hover:text-[#212529] hover:bg-white/50 border border-transparent'
                }`}
              >
                {p === '' ? 'All' : p === 'free' ? 'Free' : 'Paid'}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* 3. CATEGORIES - Fixed spacing: mt-[22px] */}
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
                    ? 'bg-white/70 border-[#3B82F6]/40 shadow-[inset_0_1px_2px_rgba(255,255,255,0.9)] text-[#2563EB]' 
                    : 'text-[#343A40]'
                }`}
              >
                <cat.icon className={`w-[16px] h-[16px] transition-colors ${active ? 'text-[#2563EB]' : 'text-[#6C757D] group-hover:text-[#2563EB]'}`} />
                <span className={`text-[14px] font-[600] transition-colors ${active ? 'text-[#2563EB]' : 'text-[#343A40] group-hover:text-[#212529]'}`}>
                  {cat.label}
                </span>
              </button>
            )
          })}
        </div>
      </motion.div>

      {/* 4. EVENTS SECTION - Fixed spacing: mt-[34px] */}
      <div className="mt-[34px] relative z-10">
        <div className="flex items-center gap-4 mb-[18px] px-1">
          <h2 className="text-[12px] font-[700] text-[#343A40] tracking-[0.14em] uppercase whitespace-nowrap flex items-center">
            {selectedCategory ? `${CATEGORIES.find((c) => c.id === selectedCategory)?.label ?? selectedCategory} Events` : 'All Events'}
            <span className="text-[#ADB5BD] ml-[6px] font-[600]">({events.length})</span>
          </h2>
          <div className="h-px flex-1 bg-gradient-to-r from-[#CED4DA]/60 to-transparent" />
          {hasFilters && (
            <button onClick={clearAll} className="text-[12px] font-[600] text-[#2563EB] hover:text-[#1D4ED8] tracking-[0.05em] uppercase transition-colors whitespace-nowrap">
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
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="premium-glass-card p-[16px] rounded-[16px] max-w-lg flex items-center justify-between border-l-4 border-l-[#EF4444]">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-[18px] h-[18px] text-[#EF4444] shrink-0" />
              <div>
                <h3 className="text-[14px] font-[600] text-[#343A40]">Unable to load events</h3>
                <p className="text-[13px] font-[450] text-[#6C757D] mt-0.5">Check your connection and try again.</p>
              </div>
            </div>
            <button onClick={() => refetch()} className="shrink-0 px-4 py-1.5 rounded-[8px] bg-[#F8F9FA] border border-[#DEE2E6] text-[#343A40] text-[13px] font-[600] hover:bg-white transition-colors">
              Retry
            </button>
          </motion.div>
        )}

        {/* Compact Glass Empty */}
        {!isLoading && !isError && events.length === 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="py-[60px] px-4 flex flex-col items-center text-center">
            <Calendar className="w-[24px] h-[24px] text-[#ADB5BD] mb-4" />
            <p className="text-[16px] font-[600] text-[#212529]">No events found</p>
            <p className="text-[14px] font-[450] text-[#6C757D] mt-1.5 mb-5">Try another category, date or location.</p>
            {hasFilters && (
              <button onClick={clearAll} className="text-[13px] font-[600] text-[#2563EB] hover:text-[#1D4ED8] transition-colors">
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
                    <div className="premium-glass-card rounded-[20px] flex flex-col h-full p-[8px]">
                      
                      {/* Image Area */}
                      <div className="relative aspect-[16/9] w-full rounded-[14px] overflow-hidden bg-[#F8F9FA] border border-[#DEE2E6]/50 shadow-[0_2px_8px_rgba(0,0,0,0.03)] z-20">
                        {e.coverImage ? (
                          <img src={e.coverImage} alt={e.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-[600ms] group-hover:scale-[1.03]" />
                        ) : (
                          <div className="w-full h-full transition-transform duration-[600ms] group-hover:scale-[1.03]" style={{ background: theme.gradient }} aria-hidden />
                        )}
                        
                        {e.category && (
                          <span className="absolute top-[10px] left-[10px] px-[10px] py-[4px] rounded-[8px] text-[10px] font-[700] tracking-[0.05em] uppercase bg-white/85 text-[#343A40] shadow-sm backdrop-blur-md border border-white/70">
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
                      <div className="p-[16px] pt-[18px] flex flex-col flex-1 bg-transparent z-20">
                        <h3 className="text-[18px] font-[700] text-[#212529] leading-[1.3] line-clamp-2 group-hover:text-[#2563EB] transition-colors">
                          {e.title}
                        </h3>
                        
                        <div className="mt-[12px] space-y-[6px]">
                          <p className="text-[13px] font-[500] text-[#495057] flex items-center gap-[6px]">
                            <Clock className="w-[14px] h-[14px] text-[#6C757D]" />
                            {new Date(e.startDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                          {(e.city || e.address) && (
                            <p className="text-[13px] font-[500] text-[#495057] flex items-center gap-[6px]">
                              <MapPin className="w-[14px] h-[14px] text-[#6C757D]" />
                              <span className="truncate">{e.locationType === 'VIRTUAL' ? 'Online' : (e.city || e.address)}</span>
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-[16px] mt-auto border-t border-[#CED4DA]/40">
                          <div className="flex items-center gap-[8px]">
                            <div className="w-[22px] h-[22px] rounded-full bg-white/70 border border-[#DEE2E6] flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                              {organizerName ? <span className="text-[10px] font-[700] text-[#495057]">{organizerName.charAt(0).toUpperCase()}</span> : <Users className="w-[12px] h-[12px] text-[#ADB5BD]" />}
                            </div>
                            <span className="text-[13px] font-[500] text-[#6C757D] truncate max-w-[120px]">
                              {organizerName || 'Organizer'}
                            </span>
                          </div>
                          
                          <span className="text-[14px] font-[700] text-[#212529]">
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
