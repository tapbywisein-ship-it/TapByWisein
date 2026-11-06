
import { PortalLayout } from '@/components/PortalLayout';
import { Surface } from '@/components/Surface';
import { Button } from '@/components/ui/button';
import { LeaderboardRow } from '@/components/LeaderboardRow';
import { useFullLeaderboard, useMyScore } from '@/hooks/useGamification';
import type { LeaderboardEntry } from '@/services/gamification.service';
import { useAppStore } from '@/store/appStore';
import { Trophy, Medal, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const LeaderboardPage = () => {
  const user = useAppStore((s) => s.user);
  const {
    data: leaderboardData,
    isLoading,
    isError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useFullLeaderboard(50);
  const { data: myScoreData } = useMyScore();

  const leaderboard = leaderboardData?.leaderboard ?? [];
  const total = leaderboardData?.total ?? 0;
  const myEntry = leaderboard.find((e) => e.userId === user?.id);

  // When the leaderboard is empty, show the current user as the default entry
  const displayList: LeaderboardEntry[] =
    leaderboard.length > 0
      ? leaderboard
      : user
      ? [
          {
            rank: 1,
            userId: user.id,
            fkScore: myScoreData?.fkScore ?? 0,
            level: myScoreData?.level ?? 1,
            user: {
              id: user.id,
              profile: {
                firstName: user.name?.split(' ')[0] ?? 'You',
                lastName: user.name?.split(' ').slice(1).join(' ') ?? '',
                avatar: user.avatar,
                company: user.company,
              },
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
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Everyone on TapByWisein, ranked by FK Score{total > 0 && ` · ${total} people`}
            </p>
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
              {myEntry && (
                <div className="flex items-center justify-between bg-primary/10 border border-primary/20 rounded-xl px-4 py-2.5 mb-4">
                  <div className="flex items-center gap-2">
                    <Medal className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">Your rank</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">{myEntry.fkScore} pts</span>
                    <span className="text-lg font-bold text-primary">#{myEntry.rank}</span>
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
                {displayList.map((entry) => (
                  <LeaderboardRow key={entry.userId} entry={entry} isMe={entry.userId === user?.id} />
                ))}
              </div>

              {hasNextPage && (
                <div className="flex justify-center pt-4">
                  <Button variant="outline" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
                    {isFetchingNextPage && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Show more ({leaderboard.length} of {total})
                  </Button>
                </div>
              )}
            </>
          )}
        </Surface>
      </div>
    </PortalLayout>
  );
};

export default LeaderboardPage;
