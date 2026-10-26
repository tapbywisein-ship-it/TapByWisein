import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useAppStore } from '@/store/appStore';
import type { CommunityPost } from '@/services/communities.service';

const post = (id: string, body: string, pinned = false): CommunityPost => ({
  id,
  communityId: 'c1',
  authorId: 'someone',
  body,
  imageUrl: null,
  pinned,
  isAnnouncement: pinned,
  createdAt: new Date().toISOString(),
  author: { id: 'someone', profile: null },
  commentCount: 0,
});

// The POST stays pending until the test resolves or rejects it, like a slow server.
let finishCreate: { resolve: (v: unknown) => void; reject: (e: Error) => void };
const createPost = vi.fn(
  (..._args: unknown[]) => new Promise((resolve, reject) => (finishCreate = { resolve, reject }))
);
vi.mock('@/services/communities.service', () => ({
  communitiesService: {
    createPost: (...args: unknown[]) => createPost(...args),
    listPosts: () => new Promise(() => {}), // the follow-up refetch never matters here
  },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { useCreateCommunityPost, isSendingPost } from './useCommunities';

const KEY = ['communities', 'posts', 'c1'];

const setup = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  // API order: pinned first, then newest first.
  qc.setQueryData(KEY, { data: [post('pin', 'Welcome', true), post('p2', 'Newest'), post('p1', 'Older')], pagination: {} });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useCreateCommunityPost('c1'), { wrapper });
  const feed = () => (qc.getQueryData(KEY) as { data: CommunityPost[] }).data;
  return { result, feed };
};

describe('useCreateCommunityPost', () => {
  beforeEach(() => {
    createPost.mockClear();
    useAppStore.setState({ user: { id: 'me', name: 'Mujeeb Masi' } as never });
  });

  it('shows the new post immediately, before the server replies', async () => {
    const { result, feed } = setup();
    act(() => result.current.mutate({ body: 'Hello everyone' }));

    await waitFor(() => expect(feed()).toHaveLength(4));
    const shown = feed()[1]; // right after the pinned post = newest chat message
    expect(shown.body).toBe('Hello everyone');
    expect(shown.author.profile?.firstName).toBe('Mujeeb');
    expect(isSendingPost(shown)).toBe(true);
    expect(createPost).toHaveBeenCalledTimes(1); // still waiting on the server
  });

  it('swaps in the saved post when the server replies', async () => {
    const { result, feed } = setup();
    act(() => result.current.mutate({ body: 'Hello everyone' }));
    await waitFor(() => expect(feed()).toHaveLength(4));

    await act(async () => finishCreate.resolve({ data: { ...post('real-id', 'Hello everyone'), authorId: 'me' } }));

    await waitFor(() => expect(feed()[1].id).toBe('real-id'));
    expect(feed()).toHaveLength(4);
    expect(feed().some(isSendingPost)).toBe(false);
  });

  it('removes the post again if sending fails', async () => {
    const { result, feed } = setup();
    act(() => result.current.mutate({ body: 'Hello everyone' }));
    await waitFor(() => expect(feed()).toHaveLength(4));

    await act(async () => finishCreate.reject(new Error('Network error')));

    await waitFor(() => expect(feed()).toHaveLength(3));
    expect(feed().map((p) => p.id)).toEqual(['pin', 'p2', 'p1']);
  });
});
