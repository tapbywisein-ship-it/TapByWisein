import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useEvents, useSavedEvents, useMyRegistrations } from '@/hooks/useEvents';
import { useAppStore } from '@/store/appStore';
import { SaveEventButton } from '@/components/SaveEventButton';
import { QuickRegisterModal } from '@/components/QuickRegisterModal';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { getTheme } from '@/lib/eventThemes';
import { getRegistrationPricing } from '@/lib/ticketPricing';
import { registrationCountdown, hasEventEnded } from '@/lib/eventCountdown';
import type { Event } from '@/services/events.service';
import { Calendar, MapPin, Search, AlertCircle, CheckCircle2, Clock, Users, Ticket, Bookmark } from 'lucide-react';
import { EVENT_CATEGORIES } from '@/constants/categories';

const CATEGORIES = EVENT_CATEGORIES;

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

// Paid events (any enabled ticket tier with a price) go to the event page to buy.
const isPaidEvent = (e: Event) => {
  const enabled = (e.ticketTypes ?? []).filter((t) => t.isEnabled ?? true);
  return enabled.length > 0
    ? enabled.some((t) => (Number(t.price) || 0) > 0)
    : e.ticketPrice != null && Number(e.ticketPrice) > 0;
};

// Turn ?category=tech (or the category's label) into the chip id.
const categoryIdFrom = (value?: string | null) => {
  const v = (value ?? '').toLowerCase();
  return CATEGORIES.find((c) => c.id.toLowerCase() === v || c.label.toLowerCase() === v)?.id ?? '';
};

/**
 * The event browser from the old Discover page (search, location, date,
 * free/paid, categories and the event cards), as a component so both Events
 * pages use it: the attendee page on its own, the organizer page under Hosting.
 * Signed-in people also get a Saved filter, a save button and a quick Register
 * button on each card (paid events and logged-out visitors go to the event page).
 * It draws its own panel. Its colours are CSS variables (--eb-*) with a light
 * and a dark set, so it follows the app's theme. The old page's global nav/header style
 * override is left out on purpose, so it doesn't restyle the page around it.
 */
export const EventBrowser = ({
  id,
  isPageTitle = false,
  initialCategory,
  withUser,
}: {
  id?: string;
  /** True when this is the whole page, so the title is the page's h1. */
  isPageTitle?: boolean;
  /** A category from the URL (?category=tech) to start with. */
  initialCategory?: string | null;
  /** Only events this user and I are both registered for. */
  withUser?: string;
}) => {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState(() => categoryIdFrom(initialCategory));
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [priceFilter, setPriceFilter] = useState<'' | 'free' | 'paid'>('');
  const [savedOnly, setSavedOnly] = useState(false);
  const [registerFor, setRegisterFor] = useState<Event | null>(null);

  // Search once typing pauses, not on every key. Each new search used to swap
  // the grid for skeletons and fade every card in again, which flickered.
  const debouncedSearch = useDebouncedValue(search.trim(), 300);
  const { data, isLoading, isError, refetch, isPlaceholderData } = useEvents({
    q: debouncedSearch || undefined,
    category: (CATEGORIES.find((c) => c.id === selectedCategory)?.label || selectedCategory) || undefined,
    city: city || undefined,
    price: priceFilter || undefined,
    startDate: dateFrom ? new Date(dateFrom).toISOString() : undefined,
    status: 'PUBLISHED',
    limit: 50,
    orderBy: 'startDate',
    orderDir: 'asc',
    withUser,
  }, { keepPrevious: true });
  // Saved events need a login, so only ask for them when signed in.
  const { data: savedData } = useSavedEvents(1, 100, isAuthenticated);
  const savedIds = new Set(savedData?.events.map((e) => e.id) ?? []);

  // "Your events": upcoming events I've joined, soonest first. Same page size
  // as My Tickets and My Calendar, so they share one cached request.
  const { data: myRegs } = useMyRegistrations(1, 100, isAuthenticated);
  // Check the login here too: a switched-off query still returns old cached
  // data, which could be the last signed-in user's after a logout.
  const joined = (isAuthenticated ? myRegs?.registrations ?? [] : [])
    .filter((r) => r.status !== 'CANCELLED' && r.event && !hasEventEnded(r.event))
    .sort((a, b) => new Date(a.event!.startDate).getTime() - new Date(b.event!.startDate).getTime());

  const allEvents = data?.events ?? [];
  const events = savedOnly ? allEvents.filter((e) => savedIds.has(e.id)) : allEvents;
  const hasFilters = Boolean(selectedCategory || search || city || dateFrom || priceFilter || savedOnly);
  const clearAll = () => {
    setSelectedCategory('');
    setSearch('');
    setCity('');
    setDateFrom('');
    setPriceFilter('');
    setSavedOnly(false);
  };

  const startRegister = (e: Event) => {
    // Logged-out visitors use the guest RSVP form on the event page;
    // paid events need the ticket picker there too.
    if (!isAuthenticated || isPaidEvent(e)) {
      navigate(`/e/${e.id}`);
      return;
    }
    setRegisterFor(e);
  };
  const TitleTag = isPageTitle ? 'h1' : 'h2';

  return (
    <section
      id={id}
      className="event-browser relative rounded-[28px] overflow-hidden bg-[color:var(--eb-bg)] px-5 lg:px-8 pb-10 scroll-mt-6"
      style={{
        backgroundImage: 'linear-gradient(to right, var(--eb-grid) 1px, transparent 1px), linear-gradient(to bottom, var(--eb-grid) 1px, transparent 1px)',
        backgroundSize: '44px 44px',
      }}
    >
      <style>{`
        /* --- COLOURS: one set for light, one for dark (.dark is on <html>) --- */
        .event-browser {
          --eb-bg: #F4F6F8;
          --eb-grid: rgba(173, 181, 189, 0.18);
          --eb-ink-900: #212529;
          --eb-ink-800: #343A40;
          --eb-ink-700: #495057;
          --eb-ink-500: #6C757D;
          --eb-ink-400: #ADB5BD;
          --eb-line: #CED4DA;
          --eb-line-soft: rgba(206, 212, 218, 0.5);
          --eb-border: #DEE2E6;
          --eb-muted-bg: #F8F9FA;
          --eb-surface: rgba(255, 255, 255, 0.7);
          --eb-badge: rgba(255, 255, 255, 0.85);
        }
        .dark .event-browser {
          --eb-bg: #0F1114;
          --eb-grid: rgba(255, 255, 255, 0.04);
          --eb-ink-900: #F1F3F5;
          --eb-ink-800: #DEE2E6;
          --eb-ink-700: #CED4DA;
          --eb-ink-500: #ADB5BD;
          --eb-ink-400: #6C757D;
          --eb-line: #343A40;
          --eb-line-soft: rgba(255, 255, 255, 0.08);
          --eb-border: #2C3136;
          --eb-muted-bg: #1A1D21;
          --eb-surface: rgba(255, 255, 255, 0.08);
          --eb-badge: rgba(15, 17, 20, 0.8);
        }
        /* So the date picker's calendar icon shows on the dark panel. */
        .dark .event-browser input[type="date"] { color-scheme: dark; }

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

        /* --- DARK MODE: darker glass, same blue accents --- */
        .dark .premium-glass-panel,
        .dark .premium-glass-card {
          background: rgba(255, 255, 255, 0.04);
          border-color: rgba(255, 255, 255, 0.08);
          box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.05), 0 8px 32px -8px rgba(0, 0, 0, 0.5);
        }
        .dark .premium-glass-chip {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.08);
          box-shadow: none;
        }
        .dark .premium-glass-chip:hover,
        .dark .premium-glass-card:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.14);
        }
        .dark .glass-sweep-fx::after {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent);
        }
        .dark .wordmark-premium {
          background-image: linear-gradient(
            110deg,
            #F1F3F5 0%,
            #CED4DA 38%,
            #60A5FA 46.5%,
            #FFFFFF 50%,
            #60A5FA 53.5%,
            #CED4DA 62%,
            #F1F3F5 100%
          );
          filter: none;
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
          {/* h1 when this is the whole page; h2 under the organizer page's own h1. */}
          <TitleTag className="text-[24px] font-[700] tracking-[-0.02em] leading-[1.2] text-[color:var(--eb-ink-700)] flex items-center gap-2">
            Browse Events
            <PremiumSearchIcon />
          </TitleTag>
          {/* Fixed spacing: mt-[10px] */}
          <p className="mt-[6px] text-[15px] font-[450] text-[color:var(--eb-ink-500)] leading-[1.5] max-w-xl">
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
          <Search className="w-[18px] h-[18px] text-[color:var(--eb-ink-700)] group-focus-within:text-[#2563EB] shrink-0 transition-colors" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events, topics, venues..."
            className="w-full h-full bg-transparent border-none outline-none pl-3 text-base sm:text-[14px] font-[500] text-[color:var(--eb-ink-900)] placeholder:text-[color:var(--eb-ink-700)] focus:placeholder:text-[color:var(--eb-ink-800)] transition-colors"
          />
          <div className="absolute inset-0 border-[1.5px] border-transparent group-focus-within:border-[#3B82F6]/30 rounded-[1.5rem] lg:rounded-full pointer-events-none transition-colors opacity-0 group-focus-within:opacity-100 shadow-[inset_0_0_0_1px_rgba(59,130,246,0.05)]" />
        </div>
        
        {/* Divider */}
        <div className="w-full h-px lg:w-px lg:h-[32px] bg-gradient-to-r lg:bg-gradient-to-b from-transparent via-[color:var(--eb-line)] to-transparent self-center opacity-70" />
        
        {/* Location */}
        <div className="w-full lg:w-[190px] flex items-center px-5 h-[52px] lg:h-full group relative">
          <MapPin className="w-[18px] h-[18px] text-[color:var(--eb-ink-500)] group-focus-within:text-[#2563EB] shrink-0 transition-colors" />
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Location"
            className="w-full h-full bg-transparent border-none outline-none pl-2.5 text-base sm:text-[14px] font-[500] text-[color:var(--eb-ink-900)] placeholder:text-[color:var(--eb-ink-700)] focus:placeholder:text-[color:var(--eb-ink-800)]"
          />
        </div>

        <div className="w-full h-px lg:w-px lg:h-[32px] bg-gradient-to-r lg:bg-gradient-to-b from-transparent via-[color:var(--eb-line)] to-transparent self-center opacity-70" />
        
        {/* Date */}
        <div className="w-full lg:w-[170px] flex items-center px-5 h-[52px] lg:h-full group relative">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full h-full bg-transparent border-none outline-none text-base sm:text-[14px] font-[500] text-[color:var(--eb-ink-800)] cursor-pointer"
          />
        </div>

        <div className="w-full h-px lg:w-px lg:h-[32px] bg-gradient-to-r lg:bg-gradient-to-b from-transparent via-[color:var(--eb-line)] to-transparent self-center opacity-70" />
        
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
                    : 'text-[color:var(--eb-ink-700)] hover:text-[color:var(--eb-ink-900)] hover:bg-[color:var(--eb-surface)] border border-transparent'
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
        {/* Phones: one row you swipe. Wider screens: wrap onto more lines so no chip is cut off. */}
        <div className="flex gap-[14px] overflow-x-auto pt-1 pb-4 hide-scroll snap-x md:flex-wrap md:overflow-visible">
          {CATEGORIES.map((cat) => {
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(active ? '' : cat.id)}
                className={`premium-glass-chip snap-start shrink-0 flex items-center gap-2.5 px-[18px] py-[10px] rounded-[14px] group ${
                  active 
                    ? 'bg-[color:var(--eb-surface)] border-[#3B82F6]/40 shadow-[inset_0_1px_2px_rgba(255,255,255,0.9)] text-[#2563EB]' 
                    : 'text-[color:var(--eb-ink-800)]'
                }`}
              >
                <cat.icon className={`w-[16px] h-[16px] transition-colors ${active ? 'text-[#2563EB]' : 'text-[color:var(--eb-ink-500)] group-hover:text-[#2563EB]'}`} />
                <span className={`text-[14px] font-[600] transition-colors ${active ? 'text-[#2563EB]' : 'text-[color:var(--eb-ink-800)] group-hover:text-[color:var(--eb-ink-900)]'}`}>
                  {cat.label}
                </span>
              </button>
            )
          })}
        </div>
      </motion.div>

      {/* 3b. YOUR EVENTS - upcoming events I joined, only when signed in */}
      {joined.length > 0 && (
        <div className="mt-[30px] relative z-10">
          <div className="flex items-center gap-4 mb-[14px] px-1">
            <h2 className="text-[12px] font-[700] text-[color:var(--eb-ink-800)] tracking-[0.14em] uppercase whitespace-nowrap">
              Your events
              <span className="text-[color:var(--eb-ink-400)] ml-[6px] font-[600]">({joined.length})</span>
            </h2>
            <div className="h-px flex-1 bg-gradient-to-r from-[color:var(--eb-line-soft)] to-transparent" />
            <Link to="/my-tickets" className="text-[12px] font-[600] text-[#2563EB] hover:text-[#1D4ED8] tracking-[0.05em] uppercase whitespace-nowrap">
              My tickets
            </Link>
          </div>
          <div className="flex gap-[14px] overflow-x-auto pb-2 hide-scroll snap-x">
            {joined.map((r) => {
              const ev = r.event!;
              const label =
                r.status === 'WAITLISTED' ? 'Waitlisted'
                : r.status === 'PENDING_APPROVAL' ? 'Awaiting approval'
                : r.status === 'ATTENDED' ? 'Checked in'
                : 'Going';
              const labelColour = r.status === 'REGISTERED' || r.status === 'ATTENDED' ? 'text-[#10B981]' : 'text-[#F59E0B]';
              return (
                <Link
                  key={r.id}
                  to={`/event/${r.eventId}`}
                  className="premium-glass-card snap-start shrink-0 w-[260px] flex items-center gap-3 p-[10px] rounded-[16px]"
                >
                  <div className="w-[56px] h-[56px] rounded-[12px] overflow-hidden shrink-0 bg-[color:var(--eb-muted-bg)]">
                    {ev.coverImage ? (
                      <img src={ev.coverImage} alt="" loading="lazy" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full" style={{ background: getTheme(ev.theme).gradient }} aria-hidden />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-[11px] font-[700] tracking-[0.08em] uppercase ${labelColour}`}>{label}</p>
                    <p className="text-[14px] font-[700] text-[color:var(--eb-ink-900)] truncate">{ev.title}</p>
                    <p className="text-[12px] font-[500] text-[color:var(--eb-ink-500)] truncate">
                      {new Date(ev.startDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      {ev.city ? ` · ${ev.city}` : ''}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. EVENTS SECTION - Fixed spacing: mt-[34px] */}
      <div className="mt-[34px] relative z-10">
        <div className="flex items-center gap-4 mb-[18px] px-1">
          <h2 className="text-[12px] font-[700] text-[color:var(--eb-ink-800)] tracking-[0.14em] uppercase whitespace-nowrap flex items-center">
            {selectedCategory ? `${CATEGORIES.find((c) => c.id === selectedCategory)?.label ?? selectedCategory} Events` : 'All Events'}
            <span className="text-[color:var(--eb-ink-400)] ml-[6px] font-[600]">{isLoading ? null : `(${events.length})`}</span>
          </h2>
          <div className="h-px flex-1 bg-gradient-to-r from-[color:var(--eb-line-soft)] to-transparent" />
          {isAuthenticated && (
            <button
              onClick={() => setSavedOnly((s) => !s)}
              aria-pressed={savedOnly}
              className={`premium-glass-chip flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-[12px] font-[600] whitespace-nowrap ${
                savedOnly ? 'text-[#2563EB] border-[#3B82F6]/40' : 'text-[color:var(--eb-ink-700)]'
              }`}
            >
              <Bookmark className={`w-[13px] h-[13px] ${savedOnly ? 'fill-current' : ''}`} />
              Saved
            </button>
          )}
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
                <h3 className="text-[14px] font-[600] text-[color:var(--eb-ink-800)]">Unable to load events</h3>
                <p className="text-[13px] font-[450] text-[color:var(--eb-ink-500)] mt-0.5">Check your connection and try again.</p>
              </div>
            </div>
            <button onClick={() => refetch()} className="shrink-0 px-4 py-2 rounded-[8px] bg-[color:var(--eb-muted-bg)] border border-[color:var(--eb-border)] text-[color:var(--eb-ink-800)] text-[13px] font-[600] hover:bg-[color:var(--eb-surface)] transition-colors">
              Retry
            </button>
          </motion.div>
        )}

        {/* Compact Glass Empty */}
        {!isLoading && !isError && events.length === 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="py-[60px] px-4 flex flex-col items-center text-center">
            <Calendar className="w-[24px] h-[24px] text-[color:var(--eb-ink-400)] mb-4" />
            <p className="text-[16px] font-[600] text-[color:var(--eb-ink-900)]">No events found</p>
            <p className="text-[14px] font-[450] text-[color:var(--eb-ink-500)] mt-1.5 mb-5">Try another category, date or location.</p>
            {hasFilters && (
              <button onClick={clearAll} className="text-[13px] font-[600] text-[#2563EB] hover:text-[#1D4ED8] transition-colors">
                Clear all filters
              </button>
            )}
          </motion.div>
        )}

        {/* Event Glass Grid */}
        {!isLoading && !isError && events.length > 0 && (
          // While a new filter loads, the last results stay, slightly faded.
          <div
            aria-busy={isPlaceholderData || undefined}
            className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[24px] transition-opacity duration-200 ${
              isPlaceholderData ? 'opacity-60' : ''
            }`}
          >
            {events.map((e, i) => {
              const theme = getTheme(e.theme);
              const { topLabel: price } = getRegistrationPricing(e);
              const org = e.organizer;
              const organizerName = org?.profile?.company || (org?.profile ? `${org.profile.firstName ?? ''} ${org.profile.lastName ?? ''}`.trim() : org?.username) || null;
              // The list sends my registration status when I'm signed in.
              const isRegistered = e.registrationStatus === 'REGISTERED' || e.registrationStatus === 'ATTENDED';
              const isWaitlisted = e.registrationStatus === 'WAITLISTED';
              const isPending = e.registrationStatus === 'PENDING_APPROVAL';
              const isFull = e.registeredCount !== undefined && e.registeredCount >= e.capacity;
              const { closed, label: daysLeftLabel, urgent } = registrationCountdown(e.startDate, e.registrationDeadline);
              const quietPill = 'px-[14px] py-[7px] rounded-full text-[12px] font-[600] bg-[color:var(--eb-surface)] text-[color:var(--eb-ink-400)] border border-[color:var(--eb-border)]';

              return (
                <motion.div key={e.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 + (i % 9) * 0.05, ease: "easeOut" }}>
                  <div className="group h-full">
                    <div className="premium-glass-card rounded-[20px] flex flex-col h-full p-0 overflow-hidden">

                      {/* Image Area */}
                      <Link to={`/e/${e.id}`} className="block relative aspect-[4/3] w-full rounded-t-[20px] overflow-hidden bg-[color:var(--eb-muted-bg)] border-b border-[color:var(--eb-line-soft)] shadow-[0_2px_8px_rgba(0,0,0,0.03)] z-20">
                        {e.coverImage ? (
                          <img src={e.coverImage} alt={e.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-[600ms] group-hover:scale-[1.03]" />
                        ) : (
                          <div className="w-full h-full transition-transform duration-[600ms] group-hover:scale-[1.03]" style={{ background: theme.gradient }} aria-hidden />
                        )}
                        
                        {e.category && (
                          <span className="absolute top-[10px] left-[10px] px-[10px] py-[4px] rounded-[8px] text-[11px] font-[700] tracking-[0.05em] uppercase bg-[color:var(--eb-badge)] text-[color:var(--eb-ink-800)] shadow-sm backdrop-blur-md border border-white/70">
                            {e.category}
                          </span>
                        )}
                        <div className="absolute top-[10px] right-[10px] flex gap-2">
                          {isRegistered && (
                            <span className="px-[10px] py-[4px] rounded-[8px] text-[11px] font-[700] tracking-[0.05em] uppercase bg-[#10B981]/95 text-white shadow-sm backdrop-blur-md flex items-center gap-[4px] border border-white/20">
                              <CheckCircle2 className="w-[12px] h-[12px]" /> Registered
                            </span>
                          )}
                          {!isRegistered && isWaitlisted && (
                            <span className="px-[10px] py-[4px] rounded-[8px] text-[11px] font-[700] tracking-[0.05em] uppercase bg-[#F59E0B]/95 text-white shadow-sm backdrop-blur-md border border-white/20">
                              Waitlisted
                            </span>
                          )}
                        </div>
                      </Link>

                      {/* Content Area */}
                      <div className="p-5 flex flex-col flex-1 bg-transparent z-20">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="flex-1 min-w-0 text-[18px] font-[700] text-[color:var(--eb-ink-900)] leading-[1.3]">
                            <Link to={`/e/${e.id}`} className="line-clamp-2 group-hover:text-[#2563EB] transition-colors">
                              {e.title}
                            </Link>
                          </h3>
                          {isAuthenticated && <SaveEventButton eventId={e.id} initialSaved={savedIds.has(e.id)} className="-mr-1.5 -mt-1 shrink-0" />}
                        </div>

                        <div className="mt-[12px] space-y-[6px]">
                          <p className="text-[13px] font-[500] text-[color:var(--eb-ink-700)] flex items-center gap-[6px]">
                            <Clock className="w-[14px] h-[14px] text-[color:var(--eb-ink-500)]" />
                            {new Date(e.startDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                          {(e.city || e.address) && (
                            <p className="text-[13px] font-[500] text-[color:var(--eb-ink-700)] flex items-center gap-[6px]">
                              <MapPin className="w-[14px] h-[14px] text-[color:var(--eb-ink-500)]" />
                              <span className="truncate">{e.locationType === 'VIRTUAL' ? 'Online' : (e.city || e.address)}</span>
                            </p>
                          )}
                        </div>

                        {/* Guests + days left to register */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-[12px] text-[12px] font-[500] text-[color:var(--eb-ink-500)] whitespace-nowrap">
                          <span className="flex items-center gap-[5px]">
                            <Users className="w-[13px] h-[13px]" /> <span>{e.registeredCount ?? 0}/{e.capacity} attending</span>
                          </span>
                          <span className={`ml-auto flex items-center gap-[5px] ${urgent ? 'text-[#D97706] font-[600]' : ''}`}>
                            <Clock className="w-[13px] h-[13px]" /> {daysLeftLabel}
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-[14px] mt-[14px] border-t border-[color:var(--eb-line-soft)]">
                          <div className="flex items-center gap-[8px] min-w-0">
                            <div className="w-[22px] h-[22px] rounded-full bg-[color:var(--eb-surface)] border border-[color:var(--eb-border)] flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                              {organizerName ? <span className="text-[11px] font-[700] text-[color:var(--eb-ink-700)]">{organizerName.charAt(0).toUpperCase()}</span> : <Users className="w-[12px] h-[12px] text-[color:var(--eb-ink-400)]" />}
                            </div>
                            <span className="text-[13px] font-[500] text-[color:var(--eb-ink-500)] truncate max-w-[120px]">
                              {organizerName || 'Organizer'}
                            </span>
                          </div>

                          <span className="text-[14px] font-[700] text-[color:var(--eb-ink-900)]">
                            {price}
                          </span>
                        </div>

                        {/* Register / status, pinned to the bottom so cards line up */}
                        <div className="mt-auto pt-[14px] flex justify-end">
                          {isRegistered ? (
                            <Link to={`/e/${e.id}`} className="flex items-center gap-1 px-[14px] py-[7px] rounded-full text-[12px] font-[600] text-[#059669] dark:text-[#34D399] bg-[#10B981]/10 border border-[#10B981]/40 hover:bg-[#10B981]/15 transition-colors">
                              <CheckCircle2 className="w-[13px] h-[13px]" /> Registered
                            </Link>
                          ) : isWaitlisted ? (
                            <span className={quietPill}>Waitlisted</span>
                          ) : isPending ? (
                            <span className={quietPill}>Awaiting approval</span>
                          ) : closed ? (
                            <span className={quietPill}>Closed</span>
                          ) : isFull && !e.waitlistEnabled ? (
                            <span className={quietPill}>Full</span>
                          ) : (
                            <button
                              onClick={() => startRegister(e)}
                              className="flex items-center gap-1 px-[16px] py-[7px] rounded-full text-[12px] font-[600] text-white bg-gradient-to-b from-[#3B82F6] to-[#2563EB] border border-[#1D4ED8] shadow-[0_2px_8px_rgba(37,99,235,0.3),inset_0_1px_1px_rgba(255,255,255,0.4)] hover:brightness-110 transition-all"
                            >
                              <Ticket className="w-[13px] h-[13px]" />
                              {isFull ? 'Join waitlist' : isPaidEvent(e) ? 'Get tickets' : 'Register'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {registerFor && (
          <QuickRegisterModal key={registerFor.id} event={registerFor} onClose={() => setRegisterFor(null)} />
        )}
      </AnimatePresence>
    </section>
  );
};
