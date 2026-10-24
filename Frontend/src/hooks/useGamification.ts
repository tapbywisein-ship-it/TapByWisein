import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { gamificationService } from '@/services/gamification.service';

export const gamKeys = {
  myScore: () => ['gamification', 'my-score'] as const,
  // `limit` is part of the key: the FK Score page asks for 10 and the
  // Leaderboard page for more, and they must not share one cached page.
  leaderboard: (page: number, limit: number) => ['gamification', 'leaderboard', page, limit] as const,
  leaderboardAll: (limit: number) => ['gamification', 'leaderboard', 'all', limit] as const,
  myBadges: () => ['gamification', 'my-badges'] as const,
  allBadges: () => ['gamification', 'all-badges'] as const,
  history: (page: number) => ['gamification', 'history', page] as const,
  scoreRules: () => ['gamification', 'score-rules'] as const,
};

export function useMyScore() {
  return useQuery({
    queryKey: gamKeys.myScore(),
    queryFn: () => gamificationService.getMyScore(),
    select: (res) => res.data,
  });
}

export function useLeaderboard(page = 1, limit = 20) {
  return useQuery({
    queryKey: gamKeys.leaderboard(page, limit),
    queryFn: () => gamificationService.getLeaderboard(page, limit),
    // The list arrives as `res.data`; the pages read it as `.leaderboard`.
    select: (res) => ({ leaderboard: res.data, pagination: res.pagination }),
  });
}

/** Every ranked user, loaded `limit` at a time ("Show more" calls fetchNextPage). */
export function useFullLeaderboard(limit = 50) {
  return useInfiniteQuery({
    queryKey: gamKeys.leaderboardAll(limit),
    queryFn: ({ pageParam }) => gamificationService.getLeaderboard(pageParam, limit),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.pagination?.hasNext ? last.pagination.page + 1 : undefined),
    select: (data) => ({
      leaderboard: data.pages.flatMap((p) => p.data),
      total: data.pages[0]?.pagination?.total ?? 0,
    }),
  });
}

export function useMyBadges() {
  return useQuery({
    queryKey: gamKeys.myBadges(),
    queryFn: () => gamificationService.getMyBadges(),
    select: (res) => res.data,
  });
}

export function useAllBadges() {
  return useQuery({
    queryKey: gamKeys.allBadges(),
    queryFn: () => gamificationService.getAllBadges(),
    select: (res) => res.data,
  });
}

export function useScoreHistory(page = 1, limit = 20) {
  return useQuery({
    queryKey: gamKeys.history(page),
    queryFn: () => gamificationService.getScoreHistory(page, limit),
    select: (res) => res.data,
  });
}

export function useScoreRules() {
  return useQuery({
    queryKey: gamKeys.scoreRules(),
    queryFn: () => gamificationService.getScoreRules(),
    staleTime: Infinity, // Score rules rarely change
  });
}
