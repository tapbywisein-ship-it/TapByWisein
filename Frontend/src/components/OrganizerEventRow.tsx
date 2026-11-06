import { Link } from 'react-router-dom';
import { Calendar, Clock, MapPin, Lock, Globe, ChevronRight } from 'lucide-react';
import type { Event } from '@/services/events.service';

/* ── status pill ─────────────────────────────────────────────────────── */
const statusPill = (status: string) => {
  const map: Record<string, string> = {
    PUBLISHED: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    DRAFT:     'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    CANCELLED: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    COMPLETED: 'bg-muted text-muted-foreground border-border',
  };
  return map[status] ?? map.DRAFT;
};

/**
 * One event the organizer hosts, linking to its management page. Shared by the
 * organizer Dashboard ("Your Events") and the organizer Events page (Hosting),
 * so both lists look clear, responsive, and perfectly aligned on both mobile and desktop.
 */
export const OrganizerEventRow = ({ event: e }: { event: Event & { registeredCount?: number } }) => (
  <Link
    to={`/organizer/events/${e.id}`}
    className="block py-3.5 px-2 sm:px-3 hover:bg-muted/40 rounded-xl transition-all group"
  >
    <div className="flex items-start gap-3.5">
      {/* Left: Thumbnail */}
      {e.coverImage ? (
        <img
          src={e.coverImage}
          alt={e.title}
          loading="lazy"
          className="w-12 h-12 rounded-xl object-cover shrink-0 border border-border/40 shadow-xs mt-0.5"
        />
      ) : (
        <div className="w-12 h-12 rounded-xl bg-muted/60 border border-border/50 flex items-center justify-center shrink-0 text-muted-foreground/60 mt-0.5">
          <Calendar className="w-5 h-5" />
        </div>
      )}

      {/* Middle & Right: Content */}
      <div className="flex-1 min-w-0">
        {/* Row 1: Title + Chevron */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-bold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {e.title}
          </h3>
          <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
        </div>

        {/* Row 2: Date strictly on its own line */}
        {e.startDate && (
          <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground font-medium whitespace-nowrap">
            <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span className="text-foreground/80 font-medium">
              {new Date(e.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        )}

        {/* Row 3: Location strictly on its own line below date */}
        {(e.city || e.address || e.locationType === 'VIRTUAL') && (
          <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
            <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span className="truncate">{e.city || e.address || (e.locationType === 'VIRTUAL' ? 'Online Event' : 'Location TBA')}</span>
          </div>
        )}

        {/* Row 4: Public & Completed badges strictly on their own line below location */}
        <div className="flex items-center gap-2 mt-2.5 flex-wrap">
          {/* Visibility Badge */}
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-medium tracking-wide rounded-full border shrink-0 ${
              e.visibility === 'PRIVATE'
                ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
                : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
            }`}
          >
            {e.visibility === 'PRIVATE' ? <Lock className="w-2.5 h-2.5" /> : <Globe className="w-2.5 h-2.5" />}
            <span>{e.visibility === 'PRIVATE' ? 'Private' : 'Public'}</span>
          </span>

          {/* Status Pill */}
          <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border shrink-0 ${statusPill(e.status)}`}>
            {e.status.toLowerCase()}
          </span>

          {/* Registered count */}
          {e.registeredCount != null && (
            <span className="text-[11px] font-medium text-muted-foreground ml-auto shrink-0">
              <span className="font-bold text-foreground">{e.registeredCount}</span> registered
            </span>
          )}
        </div>
      </div>
    </div>
  </Link>
);
