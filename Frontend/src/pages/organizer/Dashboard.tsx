import { OrganizerLayout } from '@/components/OrganizerLayout';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Calendar, Users, Zap, BarChart3, Plus, ChevronRight,
  AlertCircle, IndianRupee, CheckCircle2, TrendingUp,
  MapPin, Clock, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import { useOrgDashboard, useMyOrgEvents } from '@/hooks/useOrganizer';
import { formatINR } from '@/lib/currency';
import { useAppStore } from '@/store/appStore';

/* ── Status pill ─────────────────────────────────────────────────────── */
const statusPill = (status: string) => {
  const map: Record<string, string> = {
    PUBLISHED: 'bg-[#E8F8EE] text-[#16A34A]',
    DRAFT:     'bg-amber-50 text-amber-600',
    CANCELLED: 'bg-[#FDECEC] text-[#DC2626]',
    COMPLETED: 'bg-muted text-muted-foreground',
  };
  return map[status] ?? map.DRAFT;
};

/* ── Stat card ───────────────────────────────────────────────────────── */
const StatCard = ({
  label, value, icon: Icon, delta, isLoading,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  delta?: number;
  isLoading?: boolean;
}) => (
  <div className="bg-card border border-border rounded-xl p-5 shadow-card flex flex-col gap-3">
    {/* Icon */}
    <div className="stat-icon">
      <Icon className="w-5 h-5 text-muted-foreground" strokeWidth={1.75} />
    </div>
    {/* Value row */}
    <div className="flex items-end justify-between gap-2">
      <div>
        <p className="text-xs text-muted-foreground font-medium mb-1">{label}</p>
        {isLoading ? (
          <div className="h-8 w-20 bg-muted/60 rounded animate-pulse" />
        ) : (
          <p className="text-[28px] font-bold text-foreground leading-none">{value}</p>
        )}
      </div>
      {delta !== undefined && (
        <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
          <span className={`inline-flex items-center gap-0.5 text-xs font-medium px-2 py-0.5 rounded-full ${
            delta >= 0 ? 'delta-up' : 'delta-down'
          }`}>
            {delta >= 0
              ? <ArrowUpRight className="w-3 h-3" strokeWidth={2} />
              : <ArrowDownRight className="w-3 h-3" strokeWidth={2} />
            }
            {Math.abs(delta)}%
          </span>
          <span className="text-[10px] text-muted-foreground">Vs last month</span>
        </div>
      )}
    </div>
  </div>
);

/* ── Bar chart (inline) ──────────────────────────────────────────────── */
const BarChart = ({ trend }: { trend: { date: string; count: number }[] }) => {
  if (!trend.length || trend.every((d) => d.count === 0)) {
    return (
      <div className="h-36 flex flex-col items-center justify-center gap-2">
        <TrendingUp className="w-8 h-8 text-muted-foreground/30" strokeWidth={1.5} />
        <p className="text-sm text-muted-foreground">No registrations yet this week</p>
      </div>
    );
  }
  const max = Math.max(...trend.map((d) => d.count), 1);
  return (
    <div className="flex items-end gap-2 h-36 pt-2">
      {trend.map((d, i) => {
        const pct = (d.count / max) * 100;
        const day = new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' });
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
            <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
              {d.count > 0 ? d.count : ''}
            </span>
            <div className="w-full flex items-end" style={{ height: '96px' }}>
              <motion.div
                className="w-full rounded-t-md bg-primary"
                initial={{ height: 0 }}
                animate={{ height: `${Math.max(pct, d.count > 0 ? 8 : 0)}%` }}
                transition={{ duration: 0.5, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
                style={{ minHeight: d.count > 0 ? 4 : 0 }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground">{day}</span>
          </div>
        );
      })}
    </div>
  );
};

/* ── Dashboard ───────────────────────────────────────────────────────── */
const OrganizerDashboard = () => {
  const user = useAppStore((s) => s.user);
  const rawName = user?.name || user?.username || user?.email?.split('@')[0] || 'there';
  const username = rawName.charAt(0).toUpperCase() + rawName.slice(1);

  const { data: stats, isLoading, isError } = useOrgDashboard();
  const { data: eventsData } = useMyOrgEvents(1, 5);

  const events = eventsData?.events ?? stats?.recentEvents ?? [];
  const trend  = stats?.registrationTrend ?? [];

  const fade = (delay = 0) => ({
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.28, delay, ease: [0.22, 1, 0.36, 1] },
  });

  const statCards = [
    { label: 'Total Events',  value: String(stats?.totalEvents   ?? 0), icon: Calendar,     delta:  12 },
    { label: 'Upcoming',      value: String(stats?.upcomingEvents ?? 0), icon: Zap,          delta:   5 },
    { label: 'Attendees',     value: String(stats?.totalAttendees ?? 0), icon: Users,        delta:   8 },
    { label: 'Revenue',       value: formatINR(stats?.totalRevenue ?? 0), icon: IndianRupee, delta: -3 },
    { label: 'Check-in Rate', value: `${stats?.checkInRate ?? 0}%`,       icon: CheckCircle2, delta:  2 },
    { label: 'Leads',         value: String(stats?.totalLeads    ?? 0),   icon: BarChart3,   delta: 15 },
  ];

  return (
    <OrganizerLayout
      pageTitle="Dashboard"
      pageSubtitle="Your event performance at a glance"
    >
      <div className="space-y-6">

        {/* Welcome heading */}
        <motion.div {...fade(0)}>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Welcome back,{' '}
            <span className="username-accent">{username}</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Here's what's happening with your events today.
          </p>
        </motion.div>

        {/* Error banner */}
        {isError && (
          <div className="flex items-center gap-2.5 rounded-xl border border-destructive/30 bg-[#FDECEC] px-4 py-3 text-sm text-[#DC2626]">
            <AlertCircle className="w-4 h-4 flex-shrink-0" strokeWidth={1.75} />
            Failed to load dashboard data. Check your connection and refresh.
          </div>
        )}

        {/* Stat cards — 1 col → 2 col → 3 col → 6 col */}
        <motion.div
          {...fade(0.04)}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4"
        >
          {statCards.map(({ label, value, icon, delta }) => (
            <StatCard
              key={label}
              label={label}
              value={value}
              icon={icon}
              delta={delta}
              isLoading={isLoading}
            />
          ))}
        </motion.div>

        {/* Chart + Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Registration trend chart */}
          <motion.div {...fade(0.08)} className="lg:col-span-2">
            <div className="bg-card border border-border rounded-xl p-5 shadow-card h-full">
              <div className="flex items-start justify-between mb-4 gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Registration Trend</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Last 7 days</p>
                </div>
                {trend.length > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-[#EEF1FF] text-primary">
                    <TrendingUp className="w-3 h-3" strokeWidth={2} />
                    {trend.reduce((s, d) => s + d.count, 0)} total
                  </span>
                )}
              </div>
              {isLoading ? (
                <div className="h-36 bg-muted/40 rounded-xl animate-pulse" />
              ) : (
                <BarChart trend={trend} />
              )}
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div {...fade(0.10)}>
            <div className="bg-card border border-border rounded-xl p-5 shadow-card h-full">
              <h3 className="text-sm font-semibold text-foreground mb-4">Quick Actions</h3>
              <div className="space-y-1">
                {([
                  { label: 'Create new event',   to: '/organizer/events/create', icon: Plus        },
                  { label: 'View attendees',      to: '/organizer/attendees',     icon: Users       },
                  { label: 'Manage leads',        to: '/organizer/leads',         icon: BarChart3   },
                  { label: 'Payouts & earnings',  to: '/organizer/payouts',       icon: IndianRupee },
                ] as const).map(({ label, to, icon: Icon }) => (
                  <Link
                    key={to}
                    to={to}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/60 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors flex-shrink-0">
                      <Icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" strokeWidth={1.75} />
                    </div>
                    <span className="text-sm text-foreground flex-1">{label}</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" strokeWidth={1.75} />
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Your Events table */}
        <motion.div {...fade(0.12)}>
          <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
            {/* Table header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" strokeWidth={1.75} />
                <h3 className="text-sm font-semibold text-foreground">Your Events</h3>
              </div>
              <Button asChild size="sm" variant="outline" className="h-8 text-xs">
                <Link to="/organizer/events/create">
                  <Plus className="w-3.5 h-3.5 mr-1" strokeWidth={1.75} /> Create
                </Link>
              </Button>
            </div>

            {/* Table body */}
            {isLoading ? (
              <div className="p-5 space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-14 bg-muted/30 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mx-auto">
                  <Calendar className="w-6 h-6 text-muted-foreground/40" strokeWidth={1.75} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">No events yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Create your first event and start building your audience</p>
                </div>
                <Button asChild size="sm">
                  <Link to="/organizer/events/create">
                    <Plus className="w-3.5 h-3.5 mr-1.5" strokeWidth={1.75} /> Create Event
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {events.map((e) => (
                  <Link
                    key={e.id}
                    to={`/organizer/events/${e.id}`}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors group"
                  >
                    {/* Cover thumbnail */}
                    {e.coverImage ? (
                      <img
                        src={e.coverImage}
                        alt={e.title}
                        loading="lazy"
                        className="w-11 h-9 rounded-lg object-cover flex-shrink-0 border border-border"
                      />
                    ) : (
                      <div className="w-11 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 border border-border">
                        <Calendar className="w-4 h-4 text-muted-foreground/40" strokeWidth={1.75} />
                      </div>
                    )}

                    {/* Event info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{e.title}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        {e.startDate && (
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" strokeWidth={1.75} />
                            {new Date(e.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        )}
                        {e.city && (
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-3 h-3" strokeWidth={1.75} /> {e.city}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Registrations + status */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right hidden sm:block">
                        <p className="text-sm font-semibold text-foreground">{e.registeredCount ?? 0}</p>
                        <p className="text-[10px] text-muted-foreground">registered</p>
                      </div>
                      <span className={`text-[10px] font-medium uppercase tracking-wide px-2.5 py-1 rounded-full ${statusPill(e.status)}`}>
                        {e.status.toLowerCase()}
                      </span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" strokeWidth={1.75} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </motion.div>

      </div>
    </OrganizerLayout>
  );
};

export default OrganizerDashboard;
