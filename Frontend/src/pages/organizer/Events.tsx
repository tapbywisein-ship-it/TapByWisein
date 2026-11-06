import { Link } from 'react-router-dom';
import { Calendar, Compass, Plus, AlertCircle } from 'lucide-react';
import { OrganizerLayout } from '@/components/OrganizerLayout';
import { OrganizerEventRow } from '@/components/OrganizerEventRow';
import { EventBrowser } from '@/components/EventBrowser';
import { Surface } from '@/components/Surface';
import { Button } from '@/components/ui/button';
import { useMyOrgEvents } from '@/hooks/useOrganizer';

/**
 * The organizer's one "Events" menu item: create an event, see the events they
 * host, and browse everyone's events below. Replaces the separate "Create
 * Event" and "Browse Events" menu items.
 */
const OrganizerEventsPage = () => {
  const { data, isLoading, isError, refetch } = useMyOrgEvents(1, 50);
  const events = data?.events ?? [];

  return (
    <OrganizerLayout>
      <div className="space-y-6 pb-8">
        {/* Responsive Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Events</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Create events, manage the ones you host, or browse others.
            </p>
          </div>
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {/* Browsing is on this page (below Hosting), so just scroll to it. */}
            <Button
              variant="outline"
              size="sm"
              className="flex-1 sm:flex-initial rounded-xl font-medium border-border/80 shadow-xs"
              onClick={() => document.getElementById('browse')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            >
              <Compass className="w-4 h-4 mr-1.5" /> Browse events
            </Button>
            <Button asChild size="sm" className="flex-1 sm:flex-initial rounded-xl font-semibold shadow-xs">
              <Link to="/organizer/events/create">
                <Plus className="w-4 h-4 mr-1.5" /> Create event
              </Link>
            </Button>
          </div>
        </div>

        {/* Hosting Surface Card */}
        <Surface className="p-4 sm:p-6 rounded-2xl border border-border/80 shadow-xs">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border/40">
            <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-foreground">Hosting</h2>
            {events.length > 0 && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                {events.length}
              </span>
            )}
          </div>

          {isError ? (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <span className="flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                Couldn't load your events. Check your connection and try again.
              </span>
              <button onClick={() => refetch()} className="shrink-0 text-xs font-medium underline underline-offset-2 hover:opacity-80">
                Retry
              </button>
            </div>
          ) : isLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-muted/30 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto">
                <Calendar className="w-6 h-6 text-muted-foreground/40" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">You're not hosting any events yet</p>
                <p className="text-xs text-muted-foreground mt-1">Create your first event to start getting registrations</p>
              </div>
              <Button asChild size="sm" className="rounded-xl">
                <Link to="/organizer/events/create">
                  <Plus className="w-3.5 h-3.5 mr-1.5" /> Create event
                </Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border/60 -mx-1">
              {events.map((e) => (
                <OrganizerEventRow key={e.id} event={e} />
              ))}
            </div>
          )}
        </Surface>

        {/* Everyone's events, with the Discover search and filters. */}
        <EventBrowser id="browse" />
      </div>
    </OrganizerLayout>
  );
};

export default OrganizerEventsPage;
