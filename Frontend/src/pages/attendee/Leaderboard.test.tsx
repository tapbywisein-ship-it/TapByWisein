import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useAppStore } from '@/store/appStore';

// Same shape GET /gamification/leaderboard sends: `data` is the list itself,
// and each person's name sits under `user.profile`.
const entry = (rank: number, id: string, firstName: string, fkScore: number, username?: string) => ({
  rank,
  userId: id,
  fkScore,
  level: 1,
  user: { id, username: username ?? null, profile: firstName ? { firstName, lastName: 'Test', avatar: null, company: null } : null },
});
const page = (entries: ReturnType<typeof entry>[], pageNo: number, totalPages: number, total: number) => ({
  success: true,
  data: entries,
  pagination: { page: pageNo, limit: 2, total, totalPages, hasNext: pageNo < totalPages, hasPrev: pageNo > 1 },
});

const getLeaderboard = vi.fn();
vi.mock('@/services/gamification.service', () => ({
  gamificationService: {
    getLeaderboard: (...args: unknown[]) => getLeaderboard(...args),
    getMyScore: () => Promise.resolve({ data: { fkScore: 40, level: 1 } }),
  },
}));
vi.mock('@/components/PortalLayout', () => ({ PortalLayout: ({ children }: { children: ReactNode }) => <>{children}</> }));

import LeaderboardPage from './Leaderboard';

const renderPage = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter>
        <LeaderboardPage />
      </MemoryRouter>
    </QueryClientProvider>
  );

describe('Leaderboard page', () => {
  beforeEach(() => {
    getLeaderboard.mockReset();
    useAppStore.setState({ user: { id: 'me', name: 'Me Test' } as never });
  });

  it('lists other users in rank order, not just the signed-in user', async () => {
    getLeaderboard.mockResolvedValueOnce(
      page([entry(1, 'u1', 'Asha', 300), entry(2, 'me', 'Me', 40)], 1, 1, 2)
    );
    renderPage();

    expect(await screen.findByText('Asha Test')).toBeInTheDocument();
    expect(screen.getByText(/Me Test/)).toBeInTheDocument();
    expect(screen.getByText('#2')).toBeInTheDocument(); // "Your rank" banner
    expect(screen.queryByText(/Start networking/)).not.toBeInTheDocument();
  });

  it('falls back to the username when a user has no profile name', async () => {
    getLeaderboard.mockResolvedValueOnce(page([entry(1, 'u1', '', 10, 'asha99')], 1, 1, 1));
    renderPage();

    expect(await screen.findByText('asha99')).toBeInTheDocument();
  });

  it('loads the next page with Show more until everyone is listed', async () => {
    getLeaderboard
      .mockResolvedValueOnce(page([entry(1, 'u1', 'Asha', 300), entry(2, 'u2', 'Ravi', 200)], 1, 2, 3))
      .mockResolvedValueOnce(page([entry(3, 'u3', 'Kiran', 100)], 2, 2, 3));
    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: /Show more \(2 of 3\)/ }));

    expect(await screen.findByText('Kiran Test')).toBeInTheDocument();
    expect(getLeaderboard).toHaveBeenLastCalledWith(2, 50);
    expect(screen.queryByRole('button', { name: /Show more/ })).not.toBeInTheDocument();
  });
});
