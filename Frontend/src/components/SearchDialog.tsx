import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, X, Loader2, Calendar } from 'lucide-react';
import { apiFetch } from '@/services/api';

interface SearchResult {
  users: Array<{ id: string; username?: string | null; role: string; profile?: { firstName: string; lastName: string; avatar?: string | null; company?: string | null } | null }>;
  events: Array<{ id: string; title: string; slug?: string | null; startDate: string; coverImage?: string | null; city?: string | null; address?: string | null }>;
}

/**
 * Global search for people and events. Moved out of AppLayout unchanged so the
 * attendee and organizer layouts can share it; each layout owns the button
 * that opens it.
 */
export const SearchDialog = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Debounce search input
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQ(searchInput.trim()), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchInput]);

  // Focus input when drawer opens
  useEffect(() => {
    if (open) setTimeout(() => searchInputRef.current?.focus(), 50);
    else { setSearchInput(''); setDebouncedQ(''); }
  }, [open]);

  const { data: searchResults, isLoading: searchLoading, isError: searchError, refetch: refetchSearch } = useQuery<SearchResult>({
    queryKey: ['search', debouncedQ],
    queryFn: () =>
      apiFetch<{ data: SearchResult }>(`/search?q=${encodeURIComponent(debouncedQ)}`).then((r) => r.data),
    enabled: debouncedQ.length >= 2,
    staleTime: 30_000,
  });

  const handleSearchSelect = (path: string) => {
    onClose();
    navigate(path);
  };

  const hasResults = (searchResults?.users?.length ?? 0) > 0 || (searchResults?.events?.length ?? 0) > 0;

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-start justify-center pt-20"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-xl shadow-card w-full max-w-xl mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <input
            ref={searchInputRef}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search events and people…"
            className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground text-base sm:text-sm"
            onKeyDown={(e) => e.key === 'Escape' && onClose()}
          />
          {searchInput && (
            <button onClick={() => setSearchInput('')} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {debouncedQ.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            Type at least 2 characters to search
          </div>
        )}

        {debouncedQ.length === 1 && (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            Type at least 2 characters to search
          </div>
        )}

        {debouncedQ.length >= 2 && searchLoading && (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Searching...
          </div>
        )}

        {debouncedQ.length >= 2 && searchError && (
          <div className="px-4 py-8 text-center">
            <p className="text-sm text-muted-foreground mb-3">Something went wrong. Try again.</p>
            <button
              onClick={() => refetchSearch()}
              className="text-sm text-primary hover:underline"
            >
              Retry
            </button>
          </div>
        )}

        {debouncedQ.length >= 2 && !searchLoading && !searchError && !hasResults && (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            No results for "{debouncedQ}"
          </div>
        )}

        {hasResults && (
          <div className="max-h-96 overflow-y-auto divide-y divide-border/50">
            {(searchResults?.users?.length ?? 0) > 0 && (
              <div className="px-2 py-2">
                <p className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">People</p>
                {searchResults!.users.map((u) => {
                  const name = u.profile
                    ? `${u.profile.firstName} ${u.profile.lastName}`.trim()
                    : u.username ?? 'Unknown';
                  return (
                    <button
                      key={u.id}
                      onClick={() => handleSearchSelect(`/card/${u.id}`)}
                      className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-muted/60 transition-colors text-left"
                    >
                      {u.profile?.avatar ? (
                        <img src={u.profile.avatar} alt={name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary flex-shrink-0">
                          {name[0]?.toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{name}</p>
                        {u.profile?.company && (
                          <p className="text-xs text-muted-foreground truncate">{u.profile.company}</p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {(searchResults?.events?.length ?? 0) > 0 && (
              <div className="px-2 py-2">
                <p className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Events</p>
                {searchResults!.events.map((ev) => (
                  <button
                    key={ev.id}
                    onClick={() => handleSearchSelect(`/e/${ev.slug ?? ev.id}`)}
                    className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-muted/60 transition-colors text-left"
                  >
                    {ev.coverImage ? (
                      <img src={ev.coverImage} alt={ev.title} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{ev.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(ev.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        {ev.city ? ` · ${ev.city}` : ''}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {!debouncedQ && (
          <div className="px-4 py-3 text-xs text-muted-foreground">
            Type at least 2 characters to search · <kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">Esc</kbd> to close
          </div>
        )}
      </div>
    </div>
  );
};
