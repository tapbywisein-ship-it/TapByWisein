import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  ExternalLink,
  Plus,
  CalendarCheck,
  CalendarPlus,
  Search,
  Compass,
  Building2,
  User,
  Layers,
} from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  parseISO,
} from 'date-fns';
import { PortalLayout } from '@/components/PortalLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMyRegistrations } from '@/hooks/useEvents';
import { useMyOrgEvents } from '@/hooks/useOrganizer';
import { useMyCommunities, useFollowedCommunities } from '@/hooks/useCommunities';
import { useAppStore } from '@/store/appStore';
import { googleCalUrl, downloadIcs, type CalEvent } from '@/lib/calendar';

type FilterTab = 'all' | 'attending' | 'hosting';

interface UnifiedCalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  locationType: 'IN_PERSON' | 'VIRTUAL' | 'HYBRID';
  city?: string | null;
  address?: string | null;
  coverImage?: string | null;
  meetingUrl?: string;
  category?: string | null;
  type: 'attending' | 'hosting';
  status?: string;
  ticketTierName?: string | null;
  isHost?: boolean;
  communityId?: string | null;
  community?: { id: string; name: string; slug: string; avatar?: string | null } | null;
}

interface CalendarOption {
  id: string;
  name: string;
  isCommunity: boolean;
  avatar?: string | null;
  count: number;
}

const MyCalendarPage = () => {
  const user = useAppStore((s) => s.user);
  const isOrganizer = user?.role === 'organizer' || user?.role === 'admin';

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCalendarId, setSelectedCalendarId] = useState<string>('all');

  // Fetch registrations (events attending)
  const { data: regsData } = useMyRegistrations(1, 100);
  // Fetch hosted events (if organizer/admin)
  const { data: orgEventsData } = useMyOrgEvents(1, 100, isOrganizer);

  // Fetch user's communities (owned + joined)
  const { data: myCommunities = [] } = useMyCommunities();
  const { data: followedCommunities = [] } = useFollowedCommunities();

  // Unified unique list of user's communities
  const availableCommunities = useMemo(() => {
    const map = new Map<string, { id: string; name: string; avatar?: string | null }>();
    myCommunities.forEach((c) => {
      if (c && c.id) map.set(c.id, { id: c.id, name: c.name, avatar: c.avatar });
    });
    followedCommunities.forEach((c) => {
      if (c && c.id && !map.has(c.id)) map.set(c.id, { id: c.id, name: c.name, avatar: c.avatar });
    });
    return Array.from(map.values());
  }, [myCommunities, followedCommunities]);

  // Combine and normalize events
  const allEvents: UnifiedCalendarEvent[] = useMemo(() => {
    const list: UnifiedCalendarEvent[] = [];
    const seenIds = new Set<string>();

    // 1. Attending events
    if (regsData?.registrations) {
      for (const reg of regsData.registrations) {
        if (!reg.event || reg.status === 'CANCELLED') continue;
        seenIds.add(reg.event.id);
        list.push({
          id: reg.event.id,
          title: reg.event.title,
          description: reg.event.description,
          startDate: reg.event.startDate,
          endDate: reg.event.endDate,
          locationType: reg.event.locationType,
          city: reg.event.city,
          address: reg.event.address,
          coverImage: reg.event.coverImage,
          meetingUrl: reg.event.meetingUrl,
          category: reg.event.category,
          type: 'attending',
          status: reg.status,
          ticketTierName: reg.ticketTierName,
          communityId: reg.event.communityId ?? null,
          community: reg.event.community ?? null,
        });
      }
    }

    // 2. Hosting events
    if (orgEventsData?.events) {
      for (const ev of orgEventsData.events) {
        if (ev.status === 'CANCELLED') continue;
        if (seenIds.has(ev.id)) {
          const idx = list.findIndex((x) => x.id === ev.id);
          if (idx !== -1) {
            list[idx].type = 'hosting';
            list[idx].isHost = true;
            if (!list[idx].community && ev.community) {
              list[idx].community = ev.community;
              list[idx].communityId = ev.communityId;
            }
          }
        } else {
          seenIds.add(ev.id);
          list.push({
            id: ev.id,
            title: ev.title,
            description: ev.description,
            startDate: ev.startDate,
            endDate: ev.endDate,
            locationType: ev.locationType,
            city: ev.city,
            address: ev.address,
            coverImage: ev.coverImage,
            meetingUrl: ev.meetingUrl,
            category: ev.category,
            type: 'hosting',
            status: ev.status,
            isHost: true,
            communityId: ev.communityId ?? null,
            community: ev.community ?? null,
          });
        }
      }
    }

    return list.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }, [regsData, orgEventsData]);

  // Calendar Options with event counts
  const calendarOptions: CalendarOption[] = useMemo(() => {
    const personalCount = allEvents.filter((e) => !e.communityId).length;
    const commCounts = new Map<string, number>();
    allEvents.forEach((e) => {
      if (e.communityId) {
        commCounts.set(e.communityId, (commCounts.get(e.communityId) || 0) + 1);
      }
    });

    const options: CalendarOption[] = [
      {
        id: 'all',
        name: 'All Calendars',
        isCommunity: false,
        count: allEvents.length,
      },
      {
        id: 'personal',
        name: 'Personal Calendar',
        isCommunity: false,
        count: personalCount,
      },
    ];

    const addedIds = new Set<string>();
    availableCommunities.forEach((c) => {
      addedIds.add(c.id);
      options.push({
        id: c.id,
        name: c.name,
        isCommunity: true,
        avatar: c.avatar,
        count: commCounts.get(c.id) || 0,
      });
    });

    allEvents.forEach((e) => {
      if (e.communityId && e.community && !addedIds.has(e.communityId)) {
        addedIds.add(e.communityId);
        options.push({
          id: e.communityId,
          name: e.community.name,
          isCommunity: true,
          avatar: e.community.avatar,
          count: commCounts.get(e.communityId) || 0,
        });
      }
    });

    return options;
  }, [allEvents, availableCommunities]);

  const activeCalendar = calendarOptions.find((c) => c.id === selectedCalendarId) || calendarOptions[0];

  // Filter based on active calendar, type tab, and search
  const filteredEvents = useMemo(() => {
    return allEvents.filter((ev) => {
      // 1. Calendar filter
      if (selectedCalendarId === 'personal') {
        if (ev.communityId) return false;
      } else if (selectedCalendarId !== 'all') {
        if (ev.communityId !== selectedCalendarId) return false;
      }

      // 2. Type tab filter
      if (filterTab === 'attending' && ev.type !== 'attending') return false;
      if (filterTab === 'hosting' && ev.type !== 'hosting') return false;

      // 3. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = ev.title.toLowerCase().includes(q);
        const matchesCity = ev.city?.toLowerCase().includes(q);
        const matchesCategory = ev.category?.toLowerCase().includes(q);
        const matchesCommunity = ev.community?.name.toLowerCase().includes(q);
        if (!matchesTitle && !matchesCity && !matchesCategory && !matchesCommunity) return false;
      }
      return true;
    });
  }, [allEvents, selectedCalendarId, filterTab, searchQuery]);

  // Calendar dates generation
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Map of events by day key "yyyy-MM-dd"
  const eventsByDay = useMemo(() => {
    const map = new Map<string, UnifiedCalendarEvent[]>();
    for (const ev of filteredEvents) {
      if (!ev.startDate) continue;
      try {
        const d = parseISO(ev.startDate);
        const key = format(d, 'yyyy-MM-dd');
        const existing = map.get(key) ?? [];
        existing.push(ev);
        map.set(key, existing);
      } catch {
        // skip invalid date
      }
    }
    return map;
  }, [filteredEvents]);

  // Events on the currently selected day
  const selectedDayKey = format(selectedDay, 'yyyy-MM-dd');
  const selectedDayEvents = eventsByDay.get(selectedDayKey) ?? [];

  // Upcoming events from now onwards
  const now = new Date();
  const upcomingEvents = useMemo(() => {
    return filteredEvents.filter((ev) => {
      try {
        return new Date(ev.endDate || ev.startDate) >= now;
      } catch {
        return false;
      }
    });
  }, [filteredEvents, now]);

  const handleExportCal = (ev: UnifiedCalendarEvent) => {
    const calEvent: CalEvent = {
      title: ev.title,
      description: ev.description,
      start: ev.startDate,
      end: ev.endDate || ev.startDate,
      location:
        ev.locationType === 'IN_PERSON'
          ? [ev.address, ev.city].filter(Boolean).join(', ')
          : (ev.meetingUrl ?? 'Virtual Event'),
      url: window.location.origin + `/e/${ev.id}`,
    };
    downloadIcs(calEvent, `${ev.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.ics`);
  };

  return (
    <PortalLayout>
      <div className="max-w-6xl mx-auto px-4 py-6 md:py-8 space-y-6 animate-fade-in">
        {/* ── Page Header ────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">My Calendars</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Track all your registered and hosted events across your personal and community calendars.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/discover">
              <Button variant="outline" size="sm" className="gap-1.5 rounded-xl">
                <Compass className="w-4 h-4" />
                <span>Explore Events</span>
              </Button>
            </Link>
            <Link to="/organizer/events/create">
              <Button
                size="sm"
                className="gap-1.5 rounded-xl bg-[#1981FE] hover:bg-[#1673e6] text-white shadow-sm shadow-[#1981FE]/20"
              >
                <Plus className="w-4 h-4" />
                <span>Create Event</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* ── Calendar Selector Strip (Personal vs Community Calendars) ─── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Select Calendar
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              Showing: <strong className="text-foreground font-medium">{activeCalendar.name}</strong> ({filteredEvents.length})
            </span>
          </div>

          {/* Quick horizontal pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
            {calendarOptions.map((cal) => {
              const isSelected = selectedCalendarId === cal.id;
              return (
                <button
                  key={cal.id}
                  type="button"
                  onClick={() => setSelectedCalendarId(cal.id)}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all border ${
                    isSelected
                      ? 'bg-primary text-white border-primary shadow-sm shadow-primary/20'
                      : 'bg-card text-foreground border-border/80 hover:bg-muted/50 hover:border-border'
                  }`}
                >
                  {cal.id === 'all' ? (
                    <Layers className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-primary'}`} />
                  ) : cal.id === 'personal' ? (
                    <User className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-blue-500'}`} />
                  ) : cal.avatar ? (
                    <img src={cal.avatar} alt={cal.name} className="w-3.5 h-3.5 rounded-full object-cover" />
                  ) : (
                    <Building2 className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-emerald-500'}`} />
                  )}
                  <span>{cal.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {cal.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Filter Bar & Search ─────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-1.5 p-1 bg-muted/60 dark:bg-muted/40 rounded-xl border border-border/60 self-start">
            <button
              type="button"
              onClick={() => setFilterTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filterTab === 'all'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All Types
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('attending')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filterTab === 'attending'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Attending
            </button>
            {isOrganizer && (
              <button
                type="button"
                onClick={() => setFilterTab('hosting')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filterTab === 'hosting'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Hosting
              </button>
            )}
          </div>

          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title, location, community..."
              className="w-full h-9 pl-9 pr-3 text-xs rounded-xl bg-card border border-border focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* ── Main Grid: Calendar & Day Agenda ───────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,360px] gap-6 items-start">
          {/* ── LEFT: Interactive Calendar Grid ──────────────────────── */}
          <div className="bg-card border border-border rounded-2xl p-5 md:p-6 shadow-sm">
            {/* Month navigation */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  {format(currentDate, 'MMMM yyyy')}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Click any date to see events scheduled for that day
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const today = new Date();
                    setCurrentDate(today);
                    setSelectedDay(today);
                  }}
                  className="h-8 text-xs px-2.5 rounded-lg"
                >
                  Today
                </Button>
                <div className="flex items-center gap-0.5 bg-muted/40 rounded-lg p-0.5 border border-border/60">
                  <button
                    type="button"
                    onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                    className="p-1.5 rounded-md hover:bg-background text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Previous month"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                    className="p-1.5 rounded-md hover:bg-background text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Next month"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Days of week header */}
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                <div key={d} className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1.5">
              {calendarDays.map((day) => {
                const dayKey = format(day, 'yyyy-MM-dd');
                const dayEvents = eventsByDay.get(dayKey) ?? [];
                const inCurrentMonth = isSameMonth(day, currentDate);
                const isSelected = isSameDay(day, selectedDay);
                const isCurrentToday = isToday(day);
                const hasEvents = dayEvents.length > 0;

                return (
                  <button
                    key={dayKey}
                    type="button"
                    onClick={() => setSelectedDay(day)}
                    className={`relative min-h-[72px] md:min-h-[88px] p-2 rounded-xl text-left border transition-all flex flex-col justify-between group ${
                      isSelected
                        ? 'border-primary ring-2 ring-primary/20 bg-primary/5 shadow-sm'
                        : inCurrentMonth
                        ? 'border-border/60 hover:border-border hover:bg-muted/40 bg-card'
                        : 'border-transparent text-muted-foreground/35 bg-muted/10 hover:bg-muted/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-semibold rounded-full w-6 h-6 flex items-center justify-center transition-colors ${
                          isCurrentToday
                            ? 'bg-primary text-white'
                            : isSelected
                            ? 'text-primary font-bold'
                            : inCurrentMonth
                            ? 'text-foreground'
                            : 'text-muted-foreground/40'
                        }`}
                      >
                        {format(day, 'd')}
                      </span>

                      {hasEvents && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                          {dayEvents.length}
                        </span>
                      )}
                    </div>

                    {/* Event indicators in tile */}
                    <div className="space-y-1 mt-1 overflow-hidden">
                      {dayEvents.slice(0, 2).map((ev) => (
                        <div
                          key={ev.id}
                          className={`text-[10px] font-medium truncate px-1.5 py-0.5 rounded leading-tight flex items-center gap-1 ${
                            ev.community
                              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                              : ev.type === 'hosting'
                              ? 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20'
                              : 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20'
                          }`}
                        >
                          {ev.community && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />}
                          <span className="truncate">{ev.title}</span>
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-[9px] text-muted-foreground font-medium pl-1">
                          +{dayEvents.length - 2} more
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 mt-6 pt-4 border-t border-border/60 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span>Personal Calendar</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Community Calendar</span>
              </div>
              {isOrganizer && (
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                  <span>Hosted by You</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 ml-auto">
                <span className="w-2 h-2 rounded-full bg-primary" />
                <span>Selected Date</span>
              </div>
            </div>
          </div>

          {/* ── RIGHT: Selected Day Agenda ────────────────────────────── */}
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-border/80">
                <div>
                  <h3 className="font-semibold text-foreground text-sm">
                    {isToday(selectedDay)
                      ? 'Today’s Schedule'
                      : format(selectedDay, 'EEEE, MMM d, yyyy')}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {selectedDayEvents.length === 0
                      ? 'No events on this day'
                      : `${selectedDayEvents.length} event${selectedDayEvents.length > 1 ? 's' : ''} scheduled`}
                  </p>
                </div>
                {isToday(selectedDay) && (
                  <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                    Today
                  </Badge>
                )}
              </div>

              {/* Day Event List */}
              <div className="mt-4 space-y-3">
                {selectedDayEvents.length === 0 ? (
                  <div className="py-8 text-center space-y-2">
                    <CalendarCheck className="w-8 h-8 text-muted-foreground/30 mx-auto" />
                    <p className="text-xs text-muted-foreground">Your schedule is free on this date.</p>
                    <Link to="/discover">
                      <Button variant="ghost" size="sm" className="text-xs text-primary h-7">
                        Find events to attend
                      </Button>
                    </Link>
                  </div>
                ) : (
                  selectedDayEvents.map((ev) => (
                    <div
                      key={ev.id}
                      className="p-3.5 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors space-y-2.5 group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {ev.community ? (
                            <Badge
                              variant="outline"
                              className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 gap-1 inline-flex items-center"
                            >
                              <Building2 className="w-3 h-3" />
                              <span>{ev.community.name}</span>
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20 gap-1 inline-flex items-center"
                            >
                              <User className="w-3 h-3" />
                              <span>Personal</span>
                            </Badge>
                          )}
                          <Badge
                            variant="secondary"
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                              ev.type === 'hosting'
                                ? 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {ev.type === 'hosting' ? 'Host' : 'Attending'}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                          <button
                            type="button"
                            onClick={() => handleExportCal(ev)}
                            title="Export to .ics"
                            className="p-1 rounded hover:bg-background text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <CalendarPlus className="w-3.5 h-3.5" />
                          </button>
                          <a
                            href={googleCalUrl({
                              title: ev.title,
                              description: ev.description,
                              start: ev.startDate,
                              end: ev.endDate || ev.startDate,
                              location: ev.city ?? ev.address ?? '',
                              url: `${window.location.origin}/e/${ev.id}`,
                            })}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Add to Google Calendar"
                            className="p-1 rounded hover:bg-background text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>

                      <div>
                        <Link
                          to={ev.type === 'hosting' ? `/organizer/events/${ev.id}` : `/e/${ev.id}`}
                          className="font-medium text-xs text-foreground hover:text-primary transition-colors line-clamp-2"
                        >
                          {ev.title}
                        </Link>
                      </div>

                      <div className="space-y-1 text-[11px] text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 shrink-0 text-primary" />
                          <span>
                            {format(new Date(ev.startDate), 'h:mm a')}
                            {ev.endDate ? ` – ${format(new Date(ev.endDate), 'h:mm a')}` : ''}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 truncate">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            {ev.locationType === 'IN_PERSON'
                              ? [ev.city, ev.address].filter(Boolean).join(', ') || 'In-Person Venue'
                              : 'Virtual / Online'}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[11px]">
                        <Link
                          to={ev.type === 'hosting' ? `/organizer/events/${ev.id}` : `/e/${ev.id}`}
                          className="text-primary hover:underline font-medium inline-flex items-center gap-1"
                        >
                          View Details &rarr;
                        </Link>
                        {ev.type === 'attending' && (
                          <Link to="/my-tickets" className="text-muted-foreground hover:text-foreground">
                            View Ticket
                          </Link>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* ── Upcoming Quick List ──────────────────────────────────── */}
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground text-sm">Next Upcoming</h3>
                <span className="text-[11px] text-muted-foreground font-medium">
                  {upcomingEvents.length} total
                </span>
              </div>

              {upcomingEvents.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2">No upcoming events ahead.</p>
              ) : (
                <div className="space-y-2">
                  {upcomingEvents.slice(0, 3).map((ev) => (
                    <div
                      key={ev.id}
                      onClick={() => {
                        try {
                          const d = parseISO(ev.startDate);
                          setCurrentDate(d);
                          setSelectedDay(d);
                        } catch {}
                      }}
                      className="p-2.5 rounded-xl border border-border/70 hover:border-primary/50 hover:bg-muted/30 transition-all cursor-pointer flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">{ev.title}</p>
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
                          <span>{format(new Date(ev.startDate), 'MMM d, h:mm a')}</span>
                          {ev.community && (
                            <>
                              <span>•</span>
                              <span className="text-emerald-600 dark:text-emerald-400 font-medium truncate">
                                {ev.community.name}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <Badge
                        variant="secondary"
                        className={`text-[9px] shrink-0 font-medium ${
                          ev.type === 'hosting' ? 'text-purple-600 bg-purple-500/10' : 'text-blue-600 bg-blue-500/10'
                        }`}
                      >
                        {ev.type === 'hosting' ? 'Host' : 'Attending'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
};

export default MyCalendarPage;
