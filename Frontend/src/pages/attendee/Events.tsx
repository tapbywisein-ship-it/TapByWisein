import { type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PortalLayout } from '@/components/PortalLayout';
import { PublicNav } from '@/components/PublicNav';
import { Surface } from '@/components/Surface';
import { EventBrowser } from '@/components/EventBrowser';
import { useAppStore } from '@/store/appStore';

/**
 * The attendee Events page. It uses the same event browser as the organizer
 * Events page (search, filters, cards, quick register), so both look the same.
 * Logged-out visitors can browse too, with the public nav instead of the sidebar.
 */
const EventsPage = () => {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const [searchParams, setSearchParams] = useSearchParams();
  // ?withUser=<id> comes from a profile's "events in common" link.
  const withUser = searchParams.get('withUser') ?? undefined;

  const wrap = (children: ReactNode) =>
    isAuthenticated ? (
      <PortalLayout>{children}</PortalLayout>
    ) : (
      <div className="min-h-screen bg-background">
        <PublicNav />
        <main className="max-w-content mx-auto px-4 py-6 md:py-10">{children}</main>
      </div>
    );

  return wrap(
    <div className="space-y-6 pb-24 md:pb-8">
      {withUser && (
        <Surface className="flex items-center gap-2 border-primary/30 bg-primary/5 py-2.5">
          <span className="text-xs text-foreground">
            Showing events you and this person are{' '}
            <span className="font-semibold">both registered for</span>.
          </span>
          <button
            onClick={() => {
              const next = new URLSearchParams(searchParams);
              next.delete('withUser');
              setSearchParams(next, { replace: true });
            }}
            className="ml-auto text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            Clear filter
          </button>
        </Surface>
      )}

      {/* ?category=tech still works for links that used to point at /discover. */}
      <EventBrowser isPageTitle initialCategory={searchParams.get('category')} withUser={withUser} />
    </div>
  );
};

export default EventsPage;
