import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Surface } from '@/components/Surface';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useAppStore } from '@/store/appStore';
import {
  useCommunityPosts,
  useCreateCommunityPost,
  useUpdateCommunityPost,
  useTogglePostLike,
  useDeleteCommunityPost,
  usePostComments,
  useAddComment,
  useUpdateComment,
  useToggleCommentLike,
  useDeleteComment,
  isSendingPost,
} from '@/hooks/useCommunities';
import type { CommunityPost, CommunityPostComment, PostAuthor } from '@/services/communities.service';
import {
  MessagesSquare, Megaphone, Pin, Trash2, MessageCircle, Send, Loader2, ChevronDown,
  Heart, Edit3, Check, X,
} from 'lucide-react';

const authorName = (a: PostAuthor | null | undefined) =>
  a?.profile ? `${a.profile.firstName} ${a.profile.lastName}`.trim() : 'Member';

const timeAgo = (iso: string) => {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const Avatar = ({ author, size = 'md' }: { author: PostAuthor | null | undefined; size?: 'sm' | 'md' }) => {
  const name = authorName(author);
  const cls = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm';
  return author?.profile?.avatar ? (
    <img src={author.profile.avatar} alt="" className={`${cls} rounded-full object-cover shrink-0`} />
  ) : (
    <div className={`${cls} rounded-full bg-secondary flex items-center justify-center font-semibold shrink-0`}>
      {name[0]?.toUpperCase() ?? 'M'}
    </div>
  );
};

/** One comment: body + author + like + 1-hour edit. */
const CommentRow = ({
  comment,
  postId,
  communityId,
  canModerate,
}: {
  comment: CommunityPostComment;
  postId: string;
  communityId: string;
  canModerate: boolean;
}) => {
  const user = useAppStore((s) => s.user);
  const [isEditing, setIsEditing] = useState(false);
  const [editBody, setEditBody] = useState(comment.body);
  const updateComment = useUpdateComment(postId);
  const toggleLike = useToggleCommentLike(postId);
  const deleteComment = useDeleteComment(postId, communityId);

  const isAuthor = comment.authorId === user?.id;
  const isWithinOneHour = Date.now() - new Date(comment.createdAt).getTime() <= 60 * 60 * 1000;
  const canEdit = isAuthor && isWithinOneHour;
  const canDelete = isAuthor || canModerate;

  const handleSaveEdit = () => {
    const trimmed = editBody.trim();
    if (!trimmed) return;
    updateComment.mutate(
      { commentId: comment.id, body: trimmed },
      { onSuccess: () => setIsEditing(false) }
    );
  };

  return (
    <div className="flex items-start gap-2 group">
      <Avatar author={comment.author} size="sm" />
      <div className="min-w-0 flex-1 rounded-lg bg-muted/40 px-2.5 py-1.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-foreground truncate">{authorName(comment.author)}</span>
          <span className="text-[10px] text-muted-foreground shrink-0">{timeAgo(comment.createdAt)}</span>
        </div>

        {isEditing ? (
          <div className="mt-1 space-y-1.5">
            <Input
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveEdit();
                if (e.key === 'Escape') {
                  setEditBody(comment.body);
                  setIsEditing(false);
                }
              }}
              className="h-7 text-xs bg-background"
              maxLength={2000}
            />
            <div className="flex items-center justify-end gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setEditBody(comment.body);
                  setIsEditing(false);
                }}
                disabled={updateComment.isPending}
                className="text-[11px] text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={!editBody.trim() || updateComment.isPending}
                className="text-[11px] font-medium text-primary hover:underline px-1.5 py-0.5 rounded"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap break-words">{comment.body}</p>
        )}

        {/* Comment Actions: Like, Edit, Delete */}
        <div className="flex items-center gap-2.5 mt-1 pt-0.5">
          <button
            type="button"
            onClick={() => toggleLike.mutate(comment.id)}
            disabled={toggleLike.isPending}
            className={`flex items-center gap-1 text-[11px] transition-colors ${
              comment.isLiked
                ? 'text-rose-500 font-semibold'
                : 'text-muted-foreground hover:text-rose-500'
            }`}
            title={comment.isLiked ? 'Unlike' : 'Like'}
          >
            <Heart
              className={`w-3 h-3 transition-transform active:scale-125 ${
                comment.isLiked ? 'fill-rose-500 text-rose-500' : ''
              }`}
            />
            <span>{comment.likeCount && comment.likeCount > 0 ? comment.likeCount : 'Like'}</span>
          </button>

          {canEdit && !isEditing && (
            <button
              type="button"
              onClick={() => {
                setEditBody(comment.body);
                setIsEditing(true);
              }}
              className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              Edit
            </button>
          )}

          {canDelete && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Delete this comment?')) deleteComment.mutate(comment.id);
              }}
              disabled={deleteComment.isPending}
              className="text-[11px] text-muted-foreground hover:text-rose-500 transition-colors"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
const PostCard = ({
  post,
  communityId,
  canModerate,
}: {
  post: CommunityPost;
  communityId: string;
  canModerate: boolean;
}) => {
  const user = useAppStore((s) => s.user);
  const [isEditing, setIsEditing] = useState(false);
  const [editBody, setEditBody] = useState(post.body);
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState('');
  const { data: comments, isLoading: commentsLoading } = usePostComments(showComments ? post.id : null);
  const addComment = useAddComment(communityId);
  const deletePost = useDeleteCommunityPost(communityId);
  const updatePost = useUpdateCommunityPost(communityId);
  const toggleLike = useTogglePostLike(communityId);

  const name = authorName(post.author);
  const p = post.author?.profile;
  // Not saved yet: it has no real id, so likes, comments and edits can't work.
  const sending = isSendingPost(post);
  const isAuthor = post.authorId === user?.id;
  const isWithinOneHour = Date.now() - new Date(post.createdAt).getTime() <= 60 * 60 * 1000;
  const canEdit = (isAuthor || canModerate) && isWithinOneHour;
  const canDelete = canModerate || isAuthor;

  const handleSaveEdit = () => {
    const trimmed = editBody.trim();
    if (!trimmed) return;
    updatePost.mutate(
      { postId: post.id, body: trimmed },
      { onSuccess: () => setIsEditing(false) }
    );
  };

  const submitComment = () => {
    const body = comment.trim();
    if (!body) return;
    addComment.mutate({ postId: post.id, body }, { onSuccess: () => setComment('') });
  };

  return (
    <Surface
      className={[post.isAnnouncement && 'border-primary/30 bg-primary/5', sending && 'opacity-70']
        .filter(Boolean)
        .join(' ') || undefined}
      aria-busy={sending || undefined}
    >
      <div className="flex items-start gap-3">
        <Avatar author={post.author} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Link to={`/card/${post.authorId}`} className="text-sm font-semibold text-foreground hover:text-primary truncate">
              {name}
            </Link>
            {post.isAnnouncement && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary">
                <Megaphone className="w-2.5 h-2.5" /> Announcement
              </span>
            )}
            {post.pinned && !post.isAnnouncement && <Pin className="w-3 h-3 text-muted-foreground" />}
            <span className="text-[11px] text-muted-foreground ml-auto shrink-0 inline-flex items-center gap-1">
              {sending ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" /> Sending…
                </>
              ) : (
                timeAgo(post.createdAt)
              )}
            </span>
          </div>
          {(p?.position || p?.company) && (
            <p className="text-[11px] text-muted-foreground truncate">
              {[p?.position, p?.company].filter(Boolean).join(' · ')}
            </p>
          )}

          {isEditing ? (
            <div className="mt-2 space-y-2">
              <Textarea
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                rows={3}
                maxLength={4000}
                className="resize-none text-sm"
                placeholder="Edit your post..."
              />
              <div className="flex items-center justify-end gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setEditBody(post.body);
                    setIsEditing(false);
                  }}
                  disabled={updatePost.isPending}
                >
                  <X className="w-3.5 h-3.5 mr-1" /> Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveEdit}
                  disabled={!editBody.trim() || updatePost.isPending}
                >
                  {updatePost.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                  ) : (
                    <Check className="w-3.5 h-3.5 mr-1" />
                  )}
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-foreground leading-relaxed mt-1.5 whitespace-pre-wrap break-words">{post.body}</p>
          )}

          {post.imageUrl && (
            <img src={post.imageUrl} alt="" loading="lazy" className="mt-2 rounded-lg max-h-80 object-cover" />
          )}

          {!sending && (
          <div className="flex items-center gap-3.5 mt-2.5">
            {/* Like button */}
            <button
              type="button"
              onClick={() => toggleLike.mutate(post.id)}
              disabled={toggleLike.isPending}
              className={`flex items-center gap-1.5 text-xs transition-colors ${
                post.isLiked
                  ? 'text-rose-500 font-semibold'
                  : 'text-muted-foreground hover:text-rose-500'
              }`}
              title={post.isLiked ? 'Unlike' : 'Like'}
            >
              <Heart
                className={`w-3.5 h-3.5 transition-transform active:scale-125 ${
                  post.isLiked ? 'fill-rose-500 text-rose-500' : ''
                }`}
              />
              <span>{post.likeCount && post.likeCount > 0 ? post.likeCount : 'Like'}</span>
            </button>

            {/* Comment button */}
            <button
              type="button"
              onClick={() => setShowComments((s) => !s)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              {post.commentCount > 0 ? `${post.commentCount} comment${post.commentCount !== 1 ? 's' : ''}` : 'Comment'}
            </button>

            {/* Edit button */}
            {canEdit && !isEditing && (
              <button
                type="button"
                onClick={() => {
                  setEditBody(post.body);
                  setIsEditing(true);
                }}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit
              </button>
            )}

            {/* Delete button */}
            {canDelete && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Delete this post?')) deletePost.mutate(post.id);
                }}
                disabled={deletePost.isPending}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-rose-500 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            )}
          </div>
          )}

          {showComments && !sending && (
            <div className="mt-3 space-y-2.5 border-t border-border pt-3">
              {commentsLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              ) : (
                (comments ?? []).map((cm) => (
                  <CommentRow
                    key={cm.id}
                    comment={cm}
                    postId={post.id}
                    communityId={communityId}
                    canModerate={canModerate}
                  />
                ))
              )}
              <div className="flex items-center gap-2">
                <Input
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && submitComment()}
                  placeholder="Write a comment…"
                  className="h-8 text-sm"
                />
                <Button size="sm" className="h-8 w-8 p-0 shrink-0" onClick={submitComment} disabled={!comment.trim() || addComment.isPending}>
                  <Send className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Surface>
  );
};

/**
 * Community feed: composer (members; owners can post announcements that
 * notify every member) + posts with comments. Rendered on the community page.
 */
export const CommunityFeed = ({
  communityId,
  isMember,
  isOwner,
}: {
  communityId: string;
  isMember: boolean;
  isOwner: boolean;
}) => {
  const [body, setBody] = useState('');
  const [asAnnouncement, setAsAnnouncement] = useState(false);
  const { data: posts, isLoading } = useCommunityPosts(communityId);
  const createPost = useCreateCommunityPost(communityId);

  // Announcements (and other pinned posts) stay at the top, as before. The
  // rest read like a chat: oldest first, newest at the bottom next to the
  // composer. The API returns pinned first, then newest first, so reverse the rest.
  const pinnedPosts = (posts ?? []).filter((p) => p.pinned);
  const chatPosts = (posts ?? []).filter((p) => !p.pinned).reverse();

  const [showJumpToLatest, setShowJumpToLatest] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  // True while the user is at (or near) the latest post. When they have
  // scrolled up to read older posts, new posts don't yank them back down.
  const followLatestRef = useRef(true);

  const submit = () => {
    const trimmed = body.trim();
    if (!trimmed) return;
    // The post shows in the feed right away (see useCreateCommunityPost), so
    // clear the composer now, like a chat app.
    setBody('');
    setAsAnnouncement(false);
    // Your own post should always come into view.
    followLatestRef.current = true;
    createPost.mutate(
      { body: trimmed, announce: isOwner && asAnnouncement },
      {
        // Put the text back so it isn't lost, unless something new was typed.
        onError: () => setBody((current) => current || trimmed),
      }
    );
  };

  const scrollToLatest = () => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  };

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromLatest = el.scrollHeight - el.scrollTop - el.clientHeight;
    followLatestRef.current = distanceFromLatest < 120;
    // Show the arrow once the user is more than 120px above the latest post.
    setShowJumpToLatest(distanceFromLatest > 120);
  };

  // Each community opens at its latest post, like a chat app.
  useEffect(() => {
    followLatestRef.current = true;
  }, [communityId]);

  // Scroll down when posts load or a new one arrives, if following the latest.
  const chatPostCount = chatPosts.length;
  useEffect(() => {
    const el = scrollRef.current;
    if (el && followLatestRef.current) el.scrollTop = el.scrollHeight;
  }, [chatPostCount, communityId]);

  return (
    <div className="flex flex-col h-full min-h-0 relative">
      <div className="flex items-center justify-between pb-2 shrink-0">
        <h2 className="text-sm font-semibold text-foreground">Feed</h2>
      </div>

      {/* Scrollable feed messages */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto space-y-3 pr-1 py-1 relative"
      >
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => <Surface key={i} className="h-24 animate-pulse" />)}
          </div>
        ) : (posts ?? []).length === 0 ? (
          <Surface className="text-center py-10">
            <MessagesSquare className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {isMember || isOwner ? 'No posts yet — start the conversation below.' : 'No posts yet — follow to join the conversation.'}
            </p>
          </Surface>
        ) : (
          [...pinnedPosts, ...chatPosts].map((post) => (
            <PostCard key={post.id} post={post} communityId={communityId} canModerate={isOwner} />
          ))
        )}
      </div>

      {/* Floating "jump to latest" button, shown after scrolling up */}
      {showJumpToLatest && (
        <button
          type="button"
          onClick={scrollToLatest}
          aria-label="Jump to latest post"
          className="absolute right-6 bottom-48 md:bottom-44 z-20 w-8 h-8 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-all hover:scale-105 active:scale-95"
          title="Jump to latest"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      )}

      {/* Fixed bottom composer input like WhatsApp / Slack */}
      {(isMember || isOwner) && (
        <div className="pt-2 shrink-0 border-t border-border mt-2 bg-card">
          <Surface className="p-3 shadow-sm border border-border">
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              rows={2}
              placeholder="Share something with the community… (Enter to post, Shift+Enter for newline)"
              maxLength={4000}
              className="resize-none"
            />
            <div className="flex items-center justify-between mt-2 pt-1">
              {isOwner ? (
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={asAnnouncement}
                    onChange={(e) => setAsAnnouncement(e.target.checked)}
                    className="accent-[hsl(var(--primary))]"
                  />
                  <Megaphone className="w-3.5 h-3.5" /> Announce (notifies all members)
                </label>
              ) : <span />}
              <Button size="sm" onClick={submit} disabled={!body.trim()}>
                Post
              </Button>
            </div>
          </Surface>
        </div>
      )}
    </div>
  );
};
