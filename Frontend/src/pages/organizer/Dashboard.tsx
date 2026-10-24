import { OrganizerLayout } from '@/components/OrganizerLayout';
import { PeopleYouMayKnow } from '@/components/PeopleYouMayKnow';
import { OrganizerEventRow } from '@/components/OrganizerEventRow';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { Surface } from '@/components/Surface';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Calendar, Users, Zap, BarChart3, Plus, ChevronRight,
  AlertCircle, IndianRupee, CheckCircle2, Circle, TrendingUp, Loader2,
  ArrowRight,
} from 'lucide-react';
import { useOrgDashboard, useMyOrgEvents } from '@/hooks/useOrganizer';
import { useMyProfile } from '@/hooks/useProfile';
import { profileSetupChecklist } from '@/lib/profileCompletion';
import { useAppStore } from '@/store/appStore';
import { formatAmount } from '@/lib/currency';

/* ── dashboard ───────────────────────────────────────────────────────── */
const OrganizerDashboard = () => {
  const user = useAppStore((s) => s.user);
  const displayName = user?.name || user?.username || user?.email?.split('@')[0] || 'Organizer';
  const { data: stats, isLoading, isError } = useOrgDashboard();
  const { data: eventsData } = useMyOrgEvents(1, 5);
  const { data: profileData } = useMyProfile();

  const events = eventsData?.events ?? stats?.recentEvents ?? [];
  const trend  = stats?.registrationTrend ?? [];
  const profile = profileData?.profile;

  // Same 4 Profile Setup tasks and rules as the attendee Dashboard.
  const checklistItems = profileSetupChecklist(profile);

  const completedCount = checklistItems.filter((i) => i.done).length;
  const totalCount = checklistItems.length;
  const allDone = completedCount === totalCount;
  // The card always shows. Until the profile loads, steps show a spinner
  // (not "undone"), then the finished ones get ticked off.
  const profileLoaded = !!profile;

  const fade = (delay = 0) => ({
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3, delay },
  });

  return (
    <OrganizerLayout>
      <div className="space-y-6 pb-8">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-semibold text-foreground tracking-tight">
              Welcome back, <span className="font-bold text-[#1981FE]">{displayName}</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">Your event performance at a glance</p>
          </div>
          <Button asChild>
            <Link to="/organizer/events/create">
              <Plus className="w-4 h-4 mr-1.5" /> New Event
            </Link>
          </Button>
        </div>

        {isError && (
          <div className="flex items-center gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            Failed to load dashboard data. Check your connection and refresh.
          </div>
        )}

        {/* Stats grid */}
        <motion.div {...fade(0)} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {([
            { label: 'Total Events',   value: stats?.totalEvents   ?? 0, icon: Calendar,     fmt: (v: number) => String(v) },
            { label: 'Upcoming',       value: stats?.upcomingEvents ?? 0, icon: Zap,          fmt: (v: number) => String(v) },
            { label: 'Attendees',      value: stats?.totalAttendees ?? 0, icon: Users,        fmt: (v: number) => String(v) },
            { label: 'Revenue',        value: stats?.totalRevenue   ?? 0, icon: IndianRupee,  fmt: (v: number) => formatAmount(v) },
            { label: 'Check-in Rate',  value: stats?.checkInRate    ?? 0, icon: CheckCircle2, fmt: (v: number) => `${v}%` },
            { label: 'Leads',          value: stats?.totalLeads     ?? 0, icon: BarChart3,    fmt: (v: number) => String(v) },
          ] as const).map(({ label, value, icon: Icon, fmt }) => (
            <Surface key={label} padding="md" className="text-center">
              <Icon className="w-4 h-4 text-muted-foreground mx-auto mb-2" />
              {/* Rolls digits while loading, then counts up to the real number. */}
              <p className="text-2xl font-bold text-foreground mb-0.5">
                <AnimatedCounter value={isLoading ? undefined : value} format={fmt} />
              </p>
              <p className="text-[11px] text-muted-foreground">{label}</p>
            </Surface>
          ))}
        </motion.div>

        {/* Top Row: Profile Setup & Quick Actions Side-by-Side */}
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-4`}>
          <motion.div {...fade(0.02)} className="h-full">
            <Surface className="p-5 border border-border shadow-sm rounded-2xl space-y-4 bg-card h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Profile Setup
                    </span>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    {profileLoaded ? `${completedCount}/${totalCount} Completed` : 'Checking…'}
                  </span>
                </div>
                <div className="h-px bg-border/60 mb-3" />

                {/* All 4 tasks, done ones ticked, like the attendee Dashboard */}
                <div className="max-h-40 overflow-y-auto pr-1 space-y-3">
                  {checklistItems.map((item) => (
                    <div key={item.label} className="flex items-center justify-between gap-3 text-sm">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {!profileLoaded ? (
                          <Loader2 className="w-4 h-4 text-muted-foreground/40 flex-shrink-0 animate-spin" />
                        ) : item.done ? (
                          // Pops in when the profile arrives, so steps visibly tick off.
                          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 18 }} className="flex-shrink-0">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          </motion.span>
                        ) : (
                          <Circle className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
                        )}
                        <span className={`truncate text-sm font-medium ${profileLoaded && item.done ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                          {item.label}
                        </span>
                      </div>
                      {profileLoaded && !item.done && (
                        <Link
                          to={item.to}
                          className="text-xs font-semibold text-primary hover:underline flex-shrink-0"
                        >
                          {item.action}
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-full py-2.5 shadow-sm mt-3">
                <Link to="/profile" className="flex items-center justify-center gap-2">
                  {profileLoaded && allDone ? 'View profile' : 'Complete profile'} <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </Surface>
          </motion.div>

          <motion.div {...fade(0.04)} className="h-full">
            <Surface className="p-5 border border-border shadow-sm rounded-2xl space-y-4 bg-card h-full flex flex-col justify-between">
              <div>
                <span className="section-label block mb-3 font-semibold text-sm text-foreground">Quick Actions</span>
                <div className="space-y-2">
                  {([
                    { label: 'Create new event',   to: '/organizer/events/create', icon: Plus,        desc: 'Publish a new meetup or conference' },
                    { label: 'View attendees',      to: '/organizer/attendees',     icon: Users,       desc: 'Manage registrations & check-ins' },
                    { label: 'Manage leads',        to: '/organizer/leads',         icon: BarChart3,   desc: 'Review networking connections' },
                    { label: 'Payouts & earnings',  to: '/organizer/payouts',       icon: IndianRupee, desc: 'Track ticket sales & payments' },
                  ] as const).map(({ label, to, icon: Icon, desc }) => (
                    <Link
                      key={to}
                      to={to}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/60 transition-all border border-transparent hover:border-border/60 group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors flex-shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground leading-tight group-hover:text-primary transition-colors">{label}</p>
                        <p className="text-[11px] text-muted-foreground truncate mt-0.5">{desc}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                    </Link>
                  ))}
                </div>
              </div>
            </Surface>
          </motion.div>
        </div>

        {/* Second Row: Registration Analytics Graph (Professional Height & Layout) */}
        <motion.div {...fade(0.06)}>
          <Surface className="p-6 border border-border shadow-sm rounded-2xl bg-card">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <TrendingUp className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">Registration Analytics</h3>
                  <p className="text-xs text-muted-foreground">Attendee signups over the last 7 days</p>
                </div>
              </div>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                {trend.reduce((s, d) => s + d.count, 0)} Total Registrations
              </span>
            </div>

            {isLoading ? (
              <div className="h-44 bg-muted/30 rounded-xl animate-pulse" />
            ) : trend.length === 0 || trend.every((d) => d.count === 0) ? (
              <div className="h-44 flex flex-col items-center justify-center text-center gap-2 border border-dashed border-border/70 rounded-xl bg-muted/20">
                <TrendingUp className="w-8 h-8 text-muted-foreground/40" />
                <p className="text-sm font-medium text-foreground">No registrations recorded in the last 7 days</p>
                <p className="text-xs text-muted-foreground max-w-sm">Share your event links to start acquiring attendee registrations</p>
              </div>
            ) : (
              <div className="h-44 flex items-end gap-3 pt-6 pb-2 px-4 border-b border-border/40">
                {trend.map((d, i) => {
                  const max = Math.max(...trend.map((t) => t.count), 1);
                  const heightPct = (d.count / max) * 100;
                  const day = new Date(d.date).toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center h-full justify-end gap-2 group cursor-pointer">
                      <span className="text-xs font-bold text-foreground opacity-90 group-hover:scale-110 transition-transform">
                        {d.count > 0 ? d.count : 0}
                      </span>
                      <motion.div
                        className="w-full max-w-[48px] rounded-t-lg bg-gradient-to-t from-primary/90 to-primary/60 group-hover:from-primary group-hover:to-primary/80 shadow-sm transition-all"
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max(heightPct, d.count > 0 ? 15 : 6)}%` }}
                        transition={{ duration: 0.6, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                      />
                      <span className="text-[11px] text-muted-foreground font-medium group-hover:text-foreground transition-colors truncate">
                        {day}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </Surface>
        </motion.div>

        {/* Events list */}
        <motion.div {...fade(0.1)}>
          <Surface>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <h2 className="text-base font-semibold text-foreground">Your Events</h2>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/organizer/events">
                  View all <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Link>
              </Button>
            </div>

            {isLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-14 bg-muted/30 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto">
                  <Calendar className="w-6 h-6 text-muted-foreground/40" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">No events yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Create your first event to start getting registrations</p>
                </div>
                <Button asChild size="sm">
                  <Link to="/organizer/events/create">
                    <Plus className="w-3.5 h-3.5 mr-1.5" /> Create event
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {events.map((e) => (
                  <OrganizerEventRow key={e.id} event={e} />
                ))}
              </div>
            )}
          </Surface>
        </motion.div>

        {/* Organizers network too: same suggestions as the attendee Dashboard. */}
        <motion.div {...fade(0.12)}>
          <PeopleYouMayKnow />
        </motion.div>

      </div>
    </OrganizerLayout>
  );
};

export default OrganizerDashboard;

