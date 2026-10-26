import type { LeaderboardEntry } from '@/services/gamification.service';

/** Display name for a leaderboard entry: profile name, then username. */
function leaderboardName(entry: LeaderboardEntry): string {
  const profile = entry.user?.profile;
  const fullName = profile ? `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim() : '';
  return fullName || entry.user?.username || 'User';
}

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  isMe: boolean;
}

/** One person on the leaderboard. Shared by the FK Score page and /leaderboard. */
export function LeaderboardRow({ entry, isMe }: LeaderboardRowProps) {
  const name = leaderboardName(entry);
  const avatar = entry.user?.profile?.avatar;
  const company = entry.user?.profile?.company;

  return (
    <div
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
        isMe ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted/40'
      }`}
    >
      <span
        className={`w-8 text-center text-sm font-bold tabular-nums ${
          entry.rank <= 3 ? 'text-primary' : 'text-muted-foreground'
        }`}
      >
        {entry.rank}
      </span>
      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-semibold text-foreground flex-shrink-0 overflow-hidden uppercase">
        {avatar ? <img src={avatar} alt={name} className="w-full h-full object-cover" /> : name[0]}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {name} {isMe && '(you)'}
        </p>
        {company && <p className="text-[11px] text-muted-foreground truncate">{company}</p>}
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold text-foreground">{entry.fkScore}</p>
        <p className="text-[10px] text-muted-foreground">Lv.{entry.level}</p>
      </div>
    </div>
  );
}
