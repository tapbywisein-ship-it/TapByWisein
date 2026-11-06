import { useState } from 'react';
import { Link } from 'react-router-dom';
import { UserPlus, ArrowUpRight } from 'lucide-react';
import { Surface } from '@/components/Surface';
import { Button } from '@/components/ui/button';
import { useConnectionSuggestions, useSendConnectionRequest } from '@/hooks/useConnections';

/**
 * "People You May Know" box with a "See more" link to /people. Same cards as
 * the attendee Dashboard: clicking a person opens their card, and Connect
 * sends a request (flips to "Sent ✓"). Used on the organizer Dashboard.
 * Renders nothing when there are no suggestions.
 */
export const PeopleYouMayKnow = () => {
  const { data: suggestions } = useConnectionSuggestions(4);
  const sendRequest = useSendConnectionRequest();
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());

  const handleConnect = (userId: string) => {
    setSentIds((prev) => new Set(prev).add(userId));
    sendRequest.mutate(userId);
  };

  if (!suggestions || suggestions.length === 0) return null;

  return (
    <Surface>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-muted-foreground" />
          <span className="section-label">People You May Know</span>
        </div>
        <Link to="/people" className="flex items-center gap-0.5 text-[11px] text-primary font-medium hover:underline">
          See more <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {suggestions.map((s) => {
          const p = s.profile;
          const name = p ? `${p.firstName} ${p.lastName}`.trim() : 'User';
          const sent = sentIds.has(s.id);
          return (
            <div key={s.id} className="flex flex-col items-center text-center p-4 rounded-xl bg-muted/30 border border-border hover:bg-muted/50 transition-colors">
              {/* Clicking the person opens their card. */}
              <Link to={`/card/${s.id}`} className="flex flex-col items-center w-full">
                {p?.avatar ? (
                  <img src={p.avatar} alt={name} loading="lazy" className="w-12 h-12 rounded-full object-cover mb-2" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-sm font-semibold mb-2">
                    {name.charAt(0).toUpperCase()}
                  </div>
                )}
                <p className="text-sm font-semibold text-foreground leading-tight mb-0.5 truncate w-full">{name}</p>
                {(p?.position || p?.company) && (
                  <p className="text-[11px] text-muted-foreground truncate w-full mb-2">
                    {[p?.position, p?.company].filter(Boolean).join(' · ')}
                  </p>
                )}
                {p?.skills && p.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 justify-center mb-2">
                    {p.skills.slice(0, 2).map((sk) => (
                      <span key={sk} className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">{sk}</span>
                    ))}
                  </div>
                )}
              </Link>
              {/* mt-auto keeps the buttons in a line when cards have different amounts of text. */}
              <Button
                size="sm"
                variant={sent ? 'outline' : 'default'}
                className="w-full text-xs h-7 mt-auto"
                disabled={sent || sendRequest.isPending}
                onClick={() => handleConnect(s.id)}
              >
                {sent ? 'Sent ✓' : 'Connect'}
              </Button>
            </div>
          );
        })}
      </div>
    </Surface>
  );
};
