import { Link } from 'react-router-dom';
import { Calendar, Clock, MapPin, Lock, Globe, ChevronRight } from 'lucide-react';
import type { Event } from '@/services/events.service';

/* ── status pill ─────────────────────────────────────────────────────── */
const statusPill = (status: string) => {
  const map: Record<string, string> = {
    PUBLISHED: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    DRAFT:     'bg-amber-500/10 text-amber-600 border-amber-500/20',
    CANCELLED: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
    COMPLETED: 'bg-muted text-muted-foreground border-border',
  };
  return map[status] ?? map.DRAFT;
};

/**
 * One event the organizer hosts, linking to its management page. Shared by the
 * organizer Dashboard ("Your Events") and the organizer Events page (Hosting),
 * so both lists look and behave the same.
 */
export const OrganizerEventRow = ({ event: e }: { event: Event & { registeredCount?: number } }) => (
  <Link
    to={`/organizer/events/${e.id}`}
    className="flex items-center gap-4 py-3 hover:bg-muted/30 -mx-1 px-1 rounded-xl transition-colors group"
  >
    {e.coverImage ? (
      <img src={e.coverImage} alt={e.title} loading="lazy" className="w-12 h-10 rounded-lg object-cover flex-shrink-0" />
    ) : (
      <div className="w-12 h-10 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0">
        <Calendar className="w-4 h-4 text-muted-foreground/40" />
      </div>
    )}
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-foreground truncate">{e.title}</p>
      <div className="flex items-center gap-3 mt-0.5">
        {e.startDate && (
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {new Date(e.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        )}
        {e.city && (
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <MapPin className="w-3 h-3" /> {e.city}
          </span>
        )}
      </div>
    </div>
    <div className="flex items-center gap-3 flex-shrink-0">
      <div className="text-right hidden sm:block w-16">
        <p className="text-sm font-semibold text-foreground">{e.registeredCount ?? 0}</p>
        <p className="text-[10px] text-muted-foreground">registered</p>
      </div>
      <span className={`w-[72px] justify-center text-[10px] font-medium tracking-wide py-0.5 rounded-full border flex items-center gap-1 shrink-0 ${
        e.visibility === 'PRIVATE'
          ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
          : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
      }`}>
        {e.visibility === 'PRIVATE' ? (
          <>
            <Lock className="w-2.5 h-2.5" />
            <span>Private</span>
          </>
        ) : (
          <>
            <Globe className="w-2.5 h-2.5" />
            <span>Public</span>
          </>
        )}
      </span>
      <span className={`w-24 text-center text-[10px] uppercase tracking-wider py-0.5 rounded-full border shrink-0 ${statusPill(e.status)}`}>
        {e.status.toLowerCase()}
      </span>
      <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors shrink-0" />
    </div>
  </Link>
);
