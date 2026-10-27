import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  communitiesService,
  type CommunityPost,
  type CommunityPostComment,
  type CreateCommunityPayload,
} from '@/services/communities.service';
import { useAppStore } from '@/store/appStore';

const keys = {
  mine: () => ['communities', 'mine'] as const,
  following: () => ['communities', 'following'] as const,
  bySlug: (slug: string) => ['communities', 'slug', slug] as const,
  public: (q: string, category: string) => ['communities', 'public', q, category] as const,
};

/** Browse public communities (attendee discover page). */
export function usePublicCommunities(q = '', category = '') {
  return useQuery({
    queryKey: keys.public(q, category),
    queryFn: () => communitiesService.listPublic({ q: q || undefined, category: category || undefined }),
    select: (res) => res.data,
    staleTime: 30_000,
  });
}

/** Join/leave from the browse list — refreshes every communities query. */
export function useJoinLeaveCommunity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, join }: { id: string; join: boolean }) =>
      join ? communitiesService.join(id) : communitiesService.leave(id),
    onSuccess: (_data, { join }) => {
      qc.invalidateQueries({ queryKey: ['communities'] });
      toast.success(join ? 'Joined community' : 'Left community');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useMyCommunities() {
  return useQuery({
    queryKey: keys.mine(),
    queryFn: () => communitiesService.listMine(),
    select: (res) => res.data,
  });
}

export function useFollowedCommunities() {
  return useQuery({
    queryKey: keys.following(),
    queryFn: () => communitiesService.listFollowing(),
    select: (res) => res.data,
  });
}

export function useCommunity(slug: string) {
  return useQuery({
    queryKey: keys.bySlug(slug),
    queryFn: () => communitiesService.getBySlug(slug),
    select: (res) => res.data,
    enabled: !!slug,
  });
}

export function useCreateCommunity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCommunityPayload) => communitiesService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.mine() });
      toast.success('Community created');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useToggleCommunityMembership(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, join }: { id: string; join: boolean }) =>
      join ? communitiesService.join(id) : communitiesService.leave(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.bySlug(slug) });
      qc.invalidateQueries({ queryKey: keys.following() });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

// ── Feed: posts, comments, announcements ──────────────────────────────────────

const feedKeys = {
  posts: (communityId: string) => ['communities', 'posts', communityId] as const,
  comments: (postId: string) => ['communities', 'comments', postId] as const,
};

export function useCommunityPosts(communityId: string | undefined) {
  return useQuery({
    queryKey: feedKeys.posts(communityId ?? ''),
    queryFn: () => communitiesService.listPosts(communityId as string),
    select: (res) => res.data,
    enabled: !!communityId,
  });
}

type PostsResponse = { data: CommunityPost[]; pagination: unknown };

type CommentsResponse = { data: CommunityPostComment[] };

/** Flip isLiked on one post or comment and move its like count to match. */
const toggleLiked = <T extends { id: string; isLiked?: boolean; likeCount?: number }>(items: T[], id: string): T[] =>
  items.map((item) => {
    if (item.id !== id) return item;
    const willBeLiked = !item.isLiked;
    const currentCount = item.likeCount ?? 0;
    return {
      ...item,
      isLiked: willBeLiked,
      likeCount: willBeLiked ? currentCount + 1 : Math.max(0, currentCount - 1),
    };
  });

const TEMP_POST_PREFIX = 'temp-';

/** True for a post that is shown in the feed but not saved by the server yet. */
export const isSendingPost = (post: CommunityPost) => post.id.startsWith(TEMP_POST_PREFIX);

/**
 * Create a post or an announcement (announcement also notifies all members).
 *
 * The post appears in the feed straight away, marked as sending, and is
 * swapped for the saved one when the server replies. Waiting for the POST and
 * then a full refetch made every message take a few seconds to show up.
 */
export function useCreateCommunityPost(communityId: string) {
  const qc = useQueryClient();
  const postsKey = feedKeys.posts(communityId);
  const mutationKey = ['communities', 'create-post', communityId];

  const removePost = (postId: string) =>
    qc.setQueryData<PostsResponse>(postsKey, (old) =>
      old ? { ...old, data: old.data.filter((p) => p.id !== postId) } : old
    );

  return useMutation({
    mutationKey,
    mutationFn: ({ body, announce }: { body: string; announce?: boolean }) =>
      announce
        ? communitiesService.announce(communityId, body)
        : communitiesService.createPost(communityId, { body }),
    onMutate: async ({ body, announce }) => {
      await qc.cancelQueries({ queryKey: postsKey });
      const user = useAppStore.getState().user;
      const [firstName = 'You', ...rest] = (user?.name ?? '').trim().split(/\s+/).filter(Boolean);
      const tempPost: CommunityPost = {
        id: `${TEMP_POST_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        communityId,
        authorId: user?.id ?? '',
        body,
        imageUrl: null,
        pinned: !!announce,
        isAnnouncement: !!announce,
        createdAt: new Date().toISOString(),
        author: {
          id: user?.id ?? '',
          profile: {
            firstName,
            lastName: rest.join(' '),
            avatar: user?.avatar ?? null,
            company: user?.company ?? null,
            position: user?.designation ?? null,
          },
        },
        commentCount: 0,
        likeCount: 0,
        isLiked: false,
      };
      // The API lists pinned posts first, then newest first: a new post goes
      // right after the pinned ones (an announcement goes to the very top).
      qc.setQueryData<PostsResponse>(postsKey, (old) => {
        if (!old) return old;
        const at = announce ? 0 : old.data.filter((p) => p.pinned).length;
        return { ...old, data: [...old.data.slice(0, at), tempPost, ...old.data.slice(at)] };
      });
      return { tempId: tempPost.id };
    },
    onSuccess: (res, { announce }, context) => {
      qc.setQueryData<PostsResponse>(postsKey, (old) =>
        old
          ? {
              ...old,
              data: old.data.map((p) =>
                p.id === context?.tempId ? { ...p, ...res.data, commentCount: res.data.commentCount ?? 0 } : p
              ),
            }
          : old
      );
      if (announce) toast.success('Announcement posted — members notified');
    },
    onError: (err: Error, _vars, context) => {
      if (context?.tempId) removePost(context.tempId);
      toast.error(err.message || 'Could not send your post');
    },
    onSettled: () => {
      // Sync with the server once the last send finishes. Refetching while
      // another post is still sending would drop it from the feed until it lands.
      if (qc.isMutating({ mutationKey }) === 1) qc.invalidateQueries({ queryKey: postsKey });
    },
  });
}

export function useUpdateCommunityPost(communityId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, body }: { postId: string; body: string }) =>
      communitiesService.updatePost(communityId, postId, { body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: feedKeys.posts(communityId) });
      toast.success('Post updated');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useTogglePostLike(communityId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => communitiesService.toggleLike(communityId, postId),
    onMutate: async (postId: string) => {
      await qc.cancelQueries({ queryKey: feedKeys.posts(communityId) });
      const previousData = qc.getQueryData(feedKeys.posts(communityId));
      qc.setQueryData<PostsResponse>(feedKeys.posts(communityId), (old) =>
        old?.data ? { ...old, data: toggleLiked(old.data, postId) } : old
      );
      return { previousData };
    },
    onError: (err: Error, _postId, context) => {
      if (context?.previousData) {
        qc.setQueryData(feedKeys.posts(communityId), context.previousData);
      }
      toast.error(err?.message || 'Failed to update like');
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: feedKeys.posts(communityId) });
    },
  });
}

export function useDeleteCommunityPost(communityId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => communitiesService.deletePost(communityId, postId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: feedKeys.posts(communityId) });
      toast.success('Post deleted');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function usePostComments(postId: string | null) {
  return useQuery({
    queryKey: feedKeys.comments(postId ?? ''),
    queryFn: () => communitiesService.listComments(postId as string),
    select: (res) => res.data,
    enabled: !!postId,
  });
}

export function useAddComment(communityId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, body }: { postId: string; body: string }) =>
      communitiesService.addComment(postId, body),
    onSuccess: (_res, { postId }) => {
      qc.invalidateQueries({ queryKey: feedKeys.comments(postId) });
      // Refresh the feed too — the post's comment count changed.
      qc.invalidateQueries({ queryKey: feedKeys.posts(communityId) });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateComment(postId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ commentId, body }: { commentId: string; body: string }) =>
      communitiesService.updateComment(commentId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: feedKeys.comments(postId) });
      toast.success('Comment updated');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useToggleCommentLike(postId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) => communitiesService.toggleCommentLike(commentId),
    onMutate: async (commentId: string) => {
      await qc.cancelQueries({ queryKey: feedKeys.comments(postId) });
      const previousData = qc.getQueryData(feedKeys.comments(postId));
      qc.setQueryData<CommentsResponse>(feedKeys.comments(postId), (old) =>
        old?.data ? { ...old, data: toggleLiked(old.data, commentId) } : old
      );
      return { previousData };
    },
    onError: (err: Error, _commentId, context) => {
      if (context?.previousData) {
        qc.setQueryData(feedKeys.comments(postId), context.previousData);
      }
      toast.error(err?.message || 'Failed to update like');
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: feedKeys.comments(postId) });
    },
  });
}

export function useDeleteComment(postId: string, communityId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) => communitiesService.deleteComment(commentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: feedKeys.comments(postId) });
      qc.invalidateQueries({ queryKey: feedKeys.posts(communityId) });
      toast.success('Comment deleted');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
