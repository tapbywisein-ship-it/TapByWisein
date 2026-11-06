import { createContext, useContext } from 'react';
import { Outlet, NavLink, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Share2, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { OrganizerLayout } from '@/components/OrganizerLayout';
import { Button } from '@/components/ui/button';
import { useEvent } from '@/hooks/useEvents';
import { useAppStore } from '@/store/appStore';
import type { Event } from '@/services/events.service';

interface EventContextValue {
  event: Event | undefined;
  eventId: string | undefined;
  isLoading: boolean;
}

const EventContext = createContext<EventContextValue | null>(null);

/**
 * Hook for tab pages to access the parent event without re-fetching.
 * Throws if used outside `<OrganizerEventLayout>` so misuse is loud.
 */
export const useEventContext = (): EventContextValue => {
  const ctx = useContext(EventContext);
  if (!ctx) {
    throw new Error('useEventContext must be used inside <OrganizerEventLayout>');
  }
  return ctx;
};

const TABS = [
  { label: 'Overview',     to: '',         end: true  },
  { label: 'Guests',       to: 'guests',   end: false },
  { label: 'Visitors',     to: 'visitors', end: false },
  { label: 'Blasts',       to: 'blasts',   end: false },
  { label: 'Coupons',      to: 'coupons',  end: false },
  { label: 'Insights',     to: 'analytics',end: false },
  { label: 'Matchmaking',  to: 'matchmaking', end: false },
  { label: 'Check-in',     to: 'checkin',  end: false },
  { label: 'More',         to: 'more',     end: false },
] as const;

/**
 * Tabbed shell for `/organizer/events/:id/*` — Luma's host dashboard pattern.
 *
 * Renders:
 *   • OrganizerLayout (slim sidebar)
 *   • Header row: back link + Share + Edit
 *   • Title block (event title + calendar label)
 *   • NavLink tab strip with bottom-border indicator
 *   • <Outlet /> for the active tab's content
 *
 * Provides EventContext so child tabs don't have to re-call useEvent(id).
 *
 * Phase 2 step 6 ships only the four legacy tab routes (Overview, Registration,
 * Insights, Check-in). Step 7e adds Guests, Blasts, More once those tab modules
 * exist.
 */
export const OrganizerEventLayout = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: event, isLoading } = useEvent(id || '');
  const user = useAppStore((s) => s.user);

  const handleShare = () => {
    if (!id) return;
    const link = `${window.location.origin}/e/${id}`;
    void navigator.clipboard
      .writeText(link)
      .then(() => toast.success('Event link copied'))
      .catch(() => toast.error('Could not copy link'));
  };

  // Another organizer's event: the backend refuses its guests, stats and
  // actions, so say so instead of showing a management page full of errors.
  const isOtherOrganizersEvent =
    !!event && !!user && user.role !== 'admin' && event.organizerId !== user.id;
  if (isOtherOrganizersEvent) {
    return (
      <OrganizerLayout>
        <div className="max-w-md mx-auto text-center py-16 space-y-4">
          <h1 className="text-xl font-semibold text-foreground">This isn't one of your events</h1>
          <p className="text-sm text-muted-foreground">
            Only the organizer who created “{event.title}” can manage it.
          </p>
          <div className="flex flex-wrap justify-center gap-2.5">
            <Button variant="outline" onClick={() => navigate(`/e/${event.id}`)} className="rounded-xl">
              View event page
            </Button>
            <Button onClick={() => navigate('/organizer/events')} className="rounded-xl">
              Your events
            </Button>
          </div>
        </div>
      </OrganizerLayout>
    );
  }

  return (
    <OrganizerLayout>
      <EventContext.Provider value={{ event, eventId: id, isLoading }}>
        <div className="space-y-6">
          {/* Header row */}
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => navigate('/organizer/dashboard')}
              className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> All events
            </button>
            <div className="flex items-center gap-2.5">
              <Button variant="outline" size="sm" onClick={handleShare} className="rounded-xl font-semibold border-border">
                <Share2 className="w-4 h-4 mr-1.5" /> Share
              </Button>
              {/* Only drafts can be edited: the edit page sends any other event back here. */}
              {event?.status === 'DRAFT' && (
                <Button
                  size="sm"
                  onClick={() => navigate(`/organizer/events/${id}/edit`)}
                  className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-sm"
                >
                  <Pencil className="w-4 h-4 mr-1.5" /> Edit Event
                </Button>
              )}
            </div>
          </div>

          {/* Title block */}
          <div>
            <p className="text-xs text-muted-foreground mb-1">Personal calendar</p>
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">
              {isLoading ? (
                <span className="inline-block bg-muted rounded h-8 w-48 animate-pulse" />
              ) : (
                event?.title || 'Event'
              )}
            </h1>
          </div>

          {/* Tab strip */}
          <nav aria-label="Event tabs" className="border-b border-border">
            {/* 9 tabs can't fit on a phone, so they scroll. The fade at the right
                edge shows there are more; from md up they fit and it's off. */}
            <div className="flex gap-1 -mb-px overflow-x-auto [mask-image:linear-gradient(to_right,black_85%,transparent)] md:[mask-image:none]">
              {TABS.map((tab) => (
                <NavLink
                  key={tab.to || 'index'}
                  to={tab.to}
                  end={tab.end}
                  className={({ isActive }) =>
                    `px-3 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                      isActive
                        ? 'border-primary text-foreground'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`
                  }
                >
                  {tab.label}
                </NavLink>
              ))}
            </div>
          </nav>

          {/* Tab content */}
          <Outlet />
        </div>
      </EventContext.Provider>
    </OrganizerLayout>
  );
};
