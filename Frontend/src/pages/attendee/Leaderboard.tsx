import { PortalLayout } from '@/components/PortalLayout';
import { Surface } from '@/components/Surface';
import { useLeaderboard, useMyScore } from '@/hooks/useGamification';
import { useAppStore } from '@/store/appStore';
import { Trophy, Medal, AlertCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const LeaderboardPage = () => {
  const user = useAppStore((s) => s.user);
  const { data: leaderboardData, isLoading, isError } = useLeaderboard(1, 50);
  const { data: myScoreData } = useMyScore();

  const leaderboard = leaderboardData?.leaderboard ?? [];
  const myRank = leaderboard.findIndex((e) => e.userId === user?.id);
  const myRankDisplay = myRank >= 0 ? myRank + 1 : null;

  // When the leaderboard is empty, show the current user as the default entry
  const displayList =
    leaderboard.length > 0
      ? leaderboard
      : user
      ? [
          {
            rank: 1,
            userId: user.id,
            fkScore: myScoreData?.fkScore ?? 0,
            level: myScoreData?.level ?? 1,
            profile: {
              firstName: user.name?.split(' ')[0] ?? 'You',
              lastName: user.name?.split(' ').slice(1).join(' ') ?? '',
              avatar: user.avatar,
              company: user.company,
            },
          },
        ]
      : [];

  return (
    <PortalLayout>
      <div className="space-y-4 pb-24 md:pb-8">
        <div className="flex items-center gap-3">
          <Link
            to="/profile"
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">Leaderboard</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Top performers ranked by FK Score</p>
          </div>
        </div>

        <Surface>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl animate-pulse">
                  <div className="w-6 h-4 bg-muted/50 rounded" />
                  <div className="w-8 h-8 rounded-full bg-muted/50 flex-shrink-0" />
                  <div className="flex-1 space-y-1">
                    <div className="h-3 bg-muted/50 rounded w-32" />
                    <div className="h-2.5 bg-muted/40 rounded w-20" />
                  </div>
                  <div className="w-10 h-4 bg-muted/50 rounded" />
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="flex items-center gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              Failed to load leaderboard. Please try again later.
            </div>
          ) : (
            <>
              {/* Your rank banner */}
              {myRankDisplay !== null && (
                <div className="flex items-center justify-between bg-primary/10 border border-primary/20 rounded-xl px-4 py-2.5 mb-4">
                  <div className="flex items-center gap-2">
                    <Medal className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">Your rank</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      {leaderboard[myRank]?.fkScore ?? 0} pts
                    </span>
                    <span className="text-lg font-bold text-primary">#{myRankDisplay}</span>
                  </div>
                </div>
              )}

              {/* Hint when showing only self */}
              {leaderboard.length === 0 && (
                <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg bg-muted/30 border border-border/50">
                  <Trophy className="w-3.5 h-3.5 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">
                    Start networking and attending events to see more people on the leaderboard.
                  </p>
                </div>
              )}

              <div className="space-y-1.5">
                {displayList.map((entry, i) => {
                  const isMe = entry.userId === user?.id;
                  const name = entry.profile
                    ? `${entry.profile.firstName} ${entry.profile.lastName}`.trim()
                    : 'User';
                  return (
                    <div
                      key={entry.userId}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                        isMe
                          ? 'bg-primary/10 border border-primary/20'
                          : 'hover:bg-muted/40'
                      }`}
                    >
                      <span
                        className={`w-6 text-center text-sm font-bold ${
                          i < 3 ? 'text-primary' : 'text-muted-foreground'
                        }`}
                      >
                        {i + 1}
                      </span>
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-semibold text-foreground flex-shrink-0 overflow-hidden">
                        {entry.profile?.avatar ? (
                          <img src={entry.profile.avatar} alt={name} className="w-full h-full object-cover" />
                        ) : (
                          name[0]
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {name} {isMe && '(you)'}
                        </p>
                        {entry.profile?.company && (
                          <p className="text-[11px] text-muted-foreground truncate">
                            {entry.profile.company}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-foreground">{entry.fkScore}</p>
                        <p className="text-[10px] text-muted-foreground">Lv.{entry.level}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </Surface>
      </div>
    </PortalLayout>
  );
};

export default LeaderboardPage;
