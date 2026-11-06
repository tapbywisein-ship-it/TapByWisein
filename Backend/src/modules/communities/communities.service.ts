import { Prisma } from '@prisma/client';
import prisma from '@config/database';
import { NotFoundError, BadRequestError, ForbiddenError } from '@utils/errors';
import { parsePaginationQuery, buildPaginationMeta } from '@utils/pagination';
import notificationsService from '@modules/notifications/notifications.service';
import type { CreateCommunityDto, UpdateCommunityDto } from './communities.validation';

const PUBLIC_ORGANIZER_SELECT = {
  id: true,
  username: true,
  profile: { select: { firstName: true, lastName: true, avatar: true, company: true } },
} as const;

const COUNTS = { _count: { select: { members: true, events: true } } } as const;

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'community'
  );
}

type WithCounts = { _count: { members: number; events: number } };
const withCounts = <T extends WithCounts>({ _count, ...rest }: T) => ({
  ...rest,
  memberCount: _count.members,
  eventCount: _count.events,
});

class CommunitiesService {
  async create(organizerId: string, dto: CreateCommunityDto) {
    const trimmedName = dto.name.trim();

    // Enforce unique community name (case-insensitive) across active communities
    const existing = await prisma.community.findFirst({
      where: {
        name: { equals: trimmedName, mode: 'insensitive' },
        deletedAt: null,
      },
      select: { id: true },
    });
    if (existing) {
      throw new BadRequestError('A community with this name already exists. Please choose a different name.');
    }

    let slug = slugify(trimmedName);
    for (let i = 0; i < 5; i++) {
      const exists = await prisma.community.findUnique({ where: { slug }, select: { id: true } });
      if (!exists) break;
      slug = `${slugify(trimmedName)}-${Math.random().toString(36).slice(2, 6)}`;
    }

    const community = await prisma.community.create({
      data: {
        organizerId,
        name: trimmedName,
        slug,
        description: dto.description || null,
        avatar: dto.avatar || null,
        coverImage: dto.coverImage || null,
        category: dto.category || null,
        isPublic: dto.isPublic ?? true,
      },
    });

    // The organizer is the first member (moderator) of their own community.
    await prisma.communityMember
      .create({ data: { communityId: community.id, userId: organizerId, role: 'MODERATOR' } })
      .catch(() => {});

    return community;
  }

  async update(id: string, organizerId: string, dto: UpdateCommunityDto) {
    const community = await prisma.community.findFirst({
      where: { id, organizerId, deletedAt: null },
      select: { id: true },
    });
    if (!community) throw new NotFoundError('Community');

    if (dto.name) {
      const trimmedName = dto.name.trim();
      const existing = await prisma.community.findFirst({
        where: {
          name: { equals: trimmedName, mode: 'insensitive' },
          deletedAt: null,
          id: { not: id },
        },
        select: { id: true },
      });
      if (existing) {
        throw new BadRequestError('A community with this name already exists. Please choose a different name.');
      }
    }

    return prisma.community.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.description !== undefined ? { description: dto.description || null } : {}),
        ...(dto.avatar !== undefined ? { avatar: dto.avatar || null } : {}),
        ...(dto.coverImage !== undefined ? { coverImage: dto.coverImage || null } : {}),
        ...(dto.category !== undefined ? { category: dto.category || null } : {}),
        ...(dto.isPublic !== undefined ? { isPublic: dto.isPublic } : {}),
      },
    });
  }

  /** Communities the organizer owns, with member + event counts. */
  async listMine(organizerId: string) {
    const rows = await prisma.community.findMany({
      where: { organizerId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: COUNTS,
    });
    return rows.map(withCounts);
  }

  /**
   * Browse/discover public communities (newest first) so attendees can find and
   * join them. Includes counts + owner, and `isMember` for the viewer so the UI
   * can show Join vs Joined. Anonymous callers get everything except membership.
   */
  async listPublic(viewerId?: string, q?: string, category?: string) {
    const where: Prisma.CommunityWhereInput = {
      isPublic: true,
      deletedAt: null,
      ...(category ? { category } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { description: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const rows = await prisma.community.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { ...COUNTS, organizer: { select: PUBLIC_ORGANIZER_SELECT } },
    });

    let memberSet = new Set<string>();
    if (viewerId && rows.length > 0) {
      const mships = await prisma.communityMember.findMany({
        where: { userId: viewerId, communityId: { in: rows.map((r) => r.id) } },
        select: { communityId: true },
      });
      memberSet = new Set(mships.map((m) => m.communityId));
    }

    return rows.map((r) => ({ ...withCounts(r), isMember: memberSet.has(r.id) }));
  }

  /** Communities the user follows. */
  async listFollowing(userId: string) {
    const memberships = await prisma.communityMember.findMany({
      where: { userId, community: { deletedAt: null } },
      orderBy: { createdAt: 'desc' },
      include: {
        community: { include: { ...COUNTS, organizer: { select: PUBLIC_ORGANIZER_SELECT } } },
      },
    });
    return memberships.map((m) => withCounts(m.community));
  }

  /** Public community page — details + its events + the viewer's membership. */
  async getBySlug(slug: string, viewerId?: string) {
    const community = await prisma.community.findFirst({
      where: { slug, deletedAt: null },
      include: { ...COUNTS, organizer: { select: PUBLIC_ORGANIZER_SELECT } },
    });
    if (!community) throw new NotFoundError('Community');
    const isOwner = viewerId === community.organizerId;
    if (!community.isPublic && !isOwner) throw new NotFoundError('Community');

    // Events + viewer membership only need community.id — fetch them together.
    const [events, membership] = await Promise.all([
      prisma.event.findMany({
        where: { communityId: community.id, deletedAt: null, status: { not: 'DRAFT' } },
        orderBy: { startDate: 'desc' },
        take: 50,
        select: {
          id: true,
          title: true,
          slug: true,
          startDate: true,
          endDate: true,
          city: true,
          locationType: true,
          coverImage: true,
          theme: true,
          status: true,
        },
      }),
      viewerId
        ? prisma.communityMember.findUnique({
            where: { communityId_userId: { communityId: community.id, userId: viewerId } },
            select: { id: true },
          })
        : Promise.resolve(null),
    ]);
    const isMember = !!membership;

    return { community: withCounts(community), events, isMember, isOwner };
  }

  async join(communityId: string, userId: string) {
    const community = await prisma.community.findFirst({
      where: { id: communityId, deletedAt: null },
      select: { id: true },
    });
    if (!community) throw new NotFoundError('Community');
    await prisma.communityMember.upsert({
      where: { communityId_userId: { communityId, userId } },
      create: { communityId, userId },
      update: {},
    });
    return { joined: true };
  }

  async leave(communityId: string, userId: string) {
    await prisma.communityMember.deleteMany({ where: { communityId, userId } });
    return { joined: false };
  }

  /**
   * Invite users to a public community — sends each an in-app notification
   * (deep-linking to the community page) rather than a DM. Silently skips
   * anyone already a member. Capped to keep a single request cheap.
   */
  async invite(communityId: string, inviterId: string, userIds: string[]) {
    const community = await prisma.community.findFirst({
      where: { id: communityId, deletedAt: null },
      select: { id: true, name: true, slug: true, isPublic: true },
    });
    if (!community) throw new NotFoundError('Community');
    if (!community.isPublic) throw new BadRequestError('This community is private');

    const targets = [...new Set(userIds)].filter((id) => id && id !== inviterId).slice(0, 50);
    if (targets.length === 0) return { invited: 0 };

    // Don't notify people who already joined.
    const members = await prisma.communityMember.findMany({
      where: { communityId, userId: { in: targets } },
      select: { userId: true },
    });
    const memberSet = new Set(members.map((m) => m.userId));
    const toNotify = targets.filter((id) => !memberSet.has(id));

    const inviter = await prisma.user.findUnique({
      where: { id: inviterId },
      select: { profile: { select: { firstName: true, lastName: true } } },
    });
    const inviterName = inviter?.profile
      ? `${inviter.profile.firstName} ${inviter.profile.lastName}`.trim()
      : 'Someone';

    await Promise.all(
      toNotify.map((userId) =>
        notificationsService
          .createNotification(
            userId,
            'SYSTEM',
            'Community invite',
            `${inviterName} invited you to join ${community.name}`,
            { communityId: community.id, communitySlug: community.slug }
          )
          .catch(() => {})
      )
    );

    return { invited: toNotify.length };
  }

  // ── Community feed: posts, comments, announcements ──────────────────────────

  private readonly AUTHOR_SELECT = {
    id: true,
    profile: { select: { firstName: true, lastName: true, avatar: true, company: true, position: true } },
  } as const;

  /**
   * Viewer's standing in a community: 'owner' | 'moderator' | 'member' | null.
   * Owners moderate implicitly (they're auto-added as MODERATOR on create, but
   * legacy communities may predate that).
   */
  private async membershipRole(
    communityId: string,
    userId: string
  ): Promise<'owner' | 'moderator' | 'member' | null> {
    const community = await prisma.community.findFirst({
      where: { id: communityId, deletedAt: null },
      select: { organizerId: true },
    });
    if (!community) throw new NotFoundError('Community');
    if (community.organizerId === userId) return 'owner';
    const m = await prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId, userId } },
      select: { role: true },
    });
    if (!m) return null;
    return m.role === 'MODERATOR' ? 'moderator' : 'member';
  }

  /** Feed: pinned posts first, then newest. Readable by anyone who can see the community. */
  async listPosts(communityId: string, viewerId: string | undefined, page?: number, limit?: number) {
    const community = await prisma.community.findFirst({
      where: { id: communityId, deletedAt: null },
      select: { isPublic: true, organizerId: true },
    });
    if (!community) throw new NotFoundError('Community');
    if (!community.isPublic) {
      // Private community feeds are member/owner-only.
      const role = viewerId ? await this.membershipRole(communityId, viewerId) : null;
      if (!role) throw new NotFoundError('Community');
    }

    const pagination = parsePaginationQuery({ page, limit });
    const where = { communityId, deletedAt: null };
    const [posts, total, likesData] = await Promise.all([
      prisma.communityPost.findMany({
        where,
        include: {
          author: { select: this.AUTHOR_SELECT },
          _count: { select: { comments: true } },
        },
        orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
        skip: pagination.skip,
        take: pagination.limit,
      }),
      prisma.communityPost.count({ where }),
      prisma.$queryRawUnsafe<{ postId: string; count: number }[]>(
        `SELECT "postId", COUNT(*)::int as count
        FROM community_post_likes
        WHERE "postId" IN (
          SELECT id FROM community_posts WHERE "communityId" = $1 AND "deletedAt" IS NULL
        )
        GROUP BY "postId"`,
        communityId
      ).catch(() => [] as { postId: string; count: number }[]),
    ]);

    let userLikedPostIds = new Set<string>();
    if (viewerId && posts.length > 0) {
      const postIds = posts.map(p => p.id);
      const likedRecords = await prisma.$queryRawUnsafe<{ postId: string }[]>(
        `SELECT "postId"
        FROM community_post_likes
        WHERE "userId" = $1
          AND "postId" = ANY($2::text[])`,
        viewerId,
        postIds
      ).catch(() => [] as { postId: string }[]);
      userLikedPostIds = new Set(likedRecords.map(r => r.postId));
    }

    const likeCountMap = new Map<string, number>();
    for (const item of likesData) {
      likeCountMap.set(item.postId, item.count);
    }

    return {
      posts: posts.map(({ _count, ...p }) => ({
        ...p,
        commentCount: _count.comments,
        likeCount: likeCountMap.get(p.id) ?? 0,
        isLiked: userLikedPostIds.has(p.id),
      })),
      pagination: buildPaginationMeta(total, pagination.page, pagination.limit),
    };
  }

  /** Author edits their own post (or owner/moderator). */
  async updatePost(
    communityId: string,
    postId: string,
    userId: string,
    input: { body?: string; imageUrl?: string }
  ) {
    const post = await prisma.communityPost.findFirst({
      where: { id: postId, communityId, deletedAt: null },
      select: { id: true, authorId: true, createdAt: true },
    });
    if (!post) throw new NotFoundError('Post');

    // Posts can only be edited within 1 hour of creation
    const oneHourMs = 60 * 60 * 1000;
    const isWithinOneHour = Date.now() - new Date(post.createdAt).getTime() <= oneHourMs;
    if (!isWithinOneHour) {
      throw new BadRequestError('Posts can only be edited within 1 hour of posting');
    }

    if (post.authorId !== userId) {
      const role = await this.membershipRole(communityId, userId);
      if (role !== 'owner' && role !== 'moderator') {
        throw new ForbiddenError('You can only edit your own posts');
      }
    }

    const trimmed = input.body?.trim();
    if (input.body !== undefined && !trimmed) {
      throw new BadRequestError('Post cannot be empty');
    }
    if (trimmed && trimmed.length > 4000) {
      throw new BadRequestError('Post is too long (max 4000 chars)');
    }

    const updated = await prisma.communityPost.update({
      where: { id: postId },
      data: {
        ...(trimmed !== undefined ? { body: trimmed } : {}),
        ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl || null } : {}),
      },
      include: {
        author: { select: this.AUTHOR_SELECT },
        _count: { select: { comments: true } },
      },
    });

    const [likesCountRes, isLikedRes] = await Promise.all([
      prisma.$queryRawUnsafe<{ count: number }[]>(
        'SELECT COUNT(*)::int as count FROM community_post_likes WHERE "postId" = $1',
        postId
      ).catch(() => [{ count: 0 }]),
      prisma.$queryRawUnsafe<{ id: string }[]>(
        'SELECT id FROM community_post_likes WHERE "postId" = $1 AND "userId" = $2 LIMIT 1',
        postId,
        userId
      ).catch(() => []),
    ]);

    return {
      ...updated,
      commentCount: updated._count.comments,
      likeCount: likesCountRes[0]?.count ?? 0,
      isLiked: isLikedRes.length > 0,
    };
  }

  /** Toggle like on a community post */
  async togglePostLike(communityId: string, postId: string, userId: string) {
    const post = await prisma.communityPost.findFirst({
      where: { id: postId, communityId, deletedAt: null },
      select: { id: true, communityId: true },
    });
    if (!post) throw new NotFoundError('Post');

    // Check membership / access
    const role = await this.membershipRole(communityId, userId);
    if (!role) throw new ForbiddenError('Join this community to like posts');

    const existing = await prisma.$queryRawUnsafe<{ id: string }[]>(
      'SELECT id FROM community_post_likes WHERE "postId" = $1 AND "userId" = $2 LIMIT 1',
      postId,
      userId
    );

    let isLiked = false;
    if (existing.length > 0) {
      await prisma.$executeRawUnsafe(
        'DELETE FROM community_post_likes WHERE "postId" = $1 AND "userId" = $2',
        postId,
        userId
      );
      isLiked = false;
    } else {
      await prisma.$executeRawUnsafe(
        'INSERT INTO community_post_likes (id, "postId", "userId", "createdAt") VALUES (gen_random_uuid(), $1, $2, NOW())',
        postId,
        userId
      );
      isLiked = true;
    }

    const likesCountRes = await prisma.$queryRawUnsafe<{ count: number }[]>(
      'SELECT COUNT(*)::int as count FROM community_post_likes WHERE "postId" = $1',
      postId
    );
    const likeCount = likesCountRes[0]?.count ?? 0;

    return { isLiked, likeCount };
  }

  /** Members post to the feed; only the owner/moderators may pin. */
  async createPost(
    communityId: string,
    authorId: string,
    input: { body: string; imageUrl?: string; pinned?: boolean }
  ) {
    const body = input.body?.trim();
    if (!body) throw new BadRequestError('Post cannot be empty');
    if (body.length > 4000) throw new BadRequestError('Post is too long (max 4000 chars)');

    const role = await this.membershipRole(communityId, authorId);
    if (!role) throw new ForbiddenError('Join this community to post');
    const canModerate = role === 'owner' || role === 'moderator';

    return prisma.communityPost.create({
      data: {
        communityId,
        authorId,
        body,
        imageUrl: input.imageUrl || null,
        pinned: canModerate ? !!input.pinned : false,
      },
      include: { author: { select: this.AUTHOR_SELECT } },
    });
  }

  /**
   * Announcement: an owner/moderator post that is pinned and notifies every
   * member (batched like invite). Returns the post.
   */
  async announce(communityId: string, authorId: string, body: string) {
    const role = await this.membershipRole(communityId, authorId);
    if (role !== 'owner' && role !== 'moderator') {
      throw new ForbiddenError('Only the organizer or moderators can post announcements');
    }

    const community = await prisma.community.findFirst({
      where: { id: communityId, deletedAt: null },
      select: { name: true, slug: true },
    });
    if (!community) throw new NotFoundError('Community');

    const trimmed = body?.trim();
    if (!trimmed) throw new BadRequestError('Announcement cannot be empty');

    const post = await prisma.communityPost.create({
      data: { communityId, authorId, body: trimmed, pinned: true, isAnnouncement: true },
      include: { author: { select: this.AUTHOR_SELECT } },
    });

    // Fan out to members (excluding the author). Best-effort; capped batch.
    const members = await prisma.communityMember.findMany({
      where: { communityId, userId: { not: authorId } },
      select: { userId: true },
      take: 2000,
    });
    if (members.length > 0) {
      await notificationsService
        .sendBulkNotification(
          members.map((m) => m.userId),
          'SYSTEM',
          `${community.name}: announcement`,
          trimmed.length > 140 ? `${trimmed.slice(0, 140)}…` : trimmed,
          { communityId, communitySlug: community.slug, postId: post.id }
        )
        .catch(() => {});
    }

    return post;
  }

  /** Author deletes their own post; owner/moderators delete any (soft delete). */
  async deletePost(communityId: string, postId: string, userId: string): Promise<void> {
    const post = await prisma.communityPost.findFirst({
      where: { id: postId, communityId, deletedAt: null },
      select: { authorId: true },
    });
    if (!post) throw new NotFoundError('Post');
    if (post.authorId !== userId) {
      const role = await this.membershipRole(communityId, userId);
      if (role !== 'owner' && role !== 'moderator') {
        throw new ForbiddenError('You can only delete your own posts');
      }
    }
    await prisma.communityPost.update({ where: { id: postId }, data: { deletedAt: new Date() } });
  }

  async listComments(postId: string, viewerId?: string, page?: number, limit?: number) {
    const post = await prisma.communityPost.findFirst({
      where: { id: postId, deletedAt: null },
      select: { id: true },
    });
    if (!post) throw new NotFoundError('Post');
    const pagination = parsePaginationQuery({ page, limit });
    const [comments, total, likesData] = await Promise.all([
      prisma.communityPostComment.findMany({
        where: { postId },
        include: { author: { select: this.AUTHOR_SELECT } },
        orderBy: { createdAt: 'asc' },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      prisma.communityPostComment.count({ where: { postId } }),
      prisma.$queryRawUnsafe<{ commentId: string; count: number }[]>(
        `SELECT "commentId", COUNT(*)::int as count
        FROM community_comment_likes
        WHERE "commentId" IN (
          SELECT id FROM community_post_comments WHERE "postId" = $1
        )
        GROUP BY "commentId"`,
        postId
      ).catch(() => [] as { commentId: string; count: number }[]),
    ]);

    let userLikedCommentIds = new Set<string>();
    if (viewerId && comments.length > 0) {
      const commentIds = comments.map(c => c.id);
      const likedRecords = await prisma.$queryRawUnsafe<{ commentId: string }[]>(
        `SELECT "commentId"
        FROM community_comment_likes
        WHERE "userId" = $1
          AND "commentId" = ANY($2::text[])`,
        viewerId,
        commentIds
      ).catch(() => [] as { commentId: string }[]);
      userLikedCommentIds = new Set(likedRecords.map(r => r.commentId));
    }

    const likeCountMap = new Map<string, number>();
    for (const item of likesData) {
      likeCountMap.set(item.commentId, item.count);
    }

    return {
      comments: comments.map(cm => ({
        ...cm,
        likeCount: likeCountMap.get(cm.id) ?? 0,
        isLiked: userLikedCommentIds.has(cm.id),
      })),
      pagination: buildPaginationMeta(total, pagination.page, pagination.limit),
    };
  }

  async addComment(postId: string, authorId: string, body: string) {
    const trimmed = body?.trim();
    if (!trimmed) throw new BadRequestError('Comment cannot be empty');
    if (trimmed.length > 2000) throw new BadRequestError('Comment is too long (max 2000 chars)');

    const post = await prisma.communityPost.findFirst({
      where: { id: postId, deletedAt: null },
      select: { communityId: true },
    });
    if (!post) throw new NotFoundError('Post');
    const role = await this.membershipRole(post.communityId, authorId);
    if (!role) throw new ForbiddenError('Join this community to comment');

    const created = await prisma.communityPostComment.create({
      data: { postId, authorId, body: trimmed },
      include: { author: { select: this.AUTHOR_SELECT } },
    });

    return {
      ...created,
      likeCount: 0,
      isLiked: false,
    };
  }

  /** Author edits their own comment within 1 hour. */
  async updateComment(commentId: string, userId: string, body: string) {
    const trimmed = body?.trim();
    if (!trimmed) throw new BadRequestError('Comment cannot be empty');
    if (trimmed.length > 2000) throw new BadRequestError('Comment is too long (max 2000 chars)');

    const comment = await prisma.communityPostComment.findUnique({
      where: { id: commentId },
      select: { id: true, authorId: true, createdAt: true, post: { select: { communityId: true } } },
    });
    if (!comment) throw new NotFoundError('Comment');

    // Comments can only be edited within 1 hour of creation
    const oneHourMs = 60 * 60 * 1000;
    const isWithinOneHour = Date.now() - new Date(comment.createdAt).getTime() <= oneHourMs;
    if (!isWithinOneHour) {
      throw new BadRequestError('Comments can only be edited within 1 hour of posting');
    }

    if (comment.authorId !== userId) {
      const role = await this.membershipRole(comment.post.communityId, userId);
      if (role !== 'owner' && role !== 'moderator') {
        throw new ForbiddenError('You can only edit your own comments');
      }
    }

    const updated = await prisma.communityPostComment.update({
      where: { id: commentId },
      data: { body: trimmed },
      include: { author: { select: this.AUTHOR_SELECT } },
    });

    const [likesCountRes, isLikedRes] = await Promise.all([
      prisma.$queryRawUnsafe<{ count: number }[]>(
        'SELECT COUNT(*)::int as count FROM community_comment_likes WHERE "commentId" = $1',
        commentId
      ).catch(() => [{ count: 0 }]),
      prisma.$queryRawUnsafe<{ id: string }[]>(
        'SELECT id FROM community_comment_likes WHERE "commentId" = $1 AND "userId" = $2 LIMIT 1',
        commentId,
        userId
      ).catch(() => []),
    ]);

    return {
      ...updated,
      likeCount: likesCountRes[0]?.count ?? 0,
      isLiked: isLikedRes.length > 0,
    };
  }

  /** Toggle like on a community post comment */
  async toggleCommentLike(commentId: string, userId: string) {
    const comment = await prisma.communityPostComment.findUnique({
      where: { id: commentId },
      select: { id: true, post: { select: { communityId: true } } },
    });
    if (!comment) throw new NotFoundError('Comment');

    // Check membership / access
    const role = await this.membershipRole(comment.post.communityId, userId);
    if (!role) throw new ForbiddenError('Join this community to like comments');

    const existing = await prisma.$queryRawUnsafe<{ id: string }[]>(
      'SELECT id FROM community_comment_likes WHERE "commentId" = $1 AND "userId" = $2 LIMIT 1',
      commentId,
      userId
    );

    let isLiked = false;
    if (existing.length > 0) {
      await prisma.$executeRawUnsafe(
        'DELETE FROM community_comment_likes WHERE "commentId" = $1 AND "userId" = $2',
        commentId,
        userId
      );
      isLiked = false;
    } else {
      await prisma.$executeRawUnsafe(
        'INSERT INTO community_comment_likes (id, "commentId", "userId", "createdAt") VALUES (gen_random_uuid(), $1, $2, NOW())',
        commentId,
        userId
      );
      isLiked = true;
    }

    const likesCountRes = await prisma.$queryRawUnsafe<{ count: number }[]>(
      'SELECT COUNT(*)::int as count FROM community_comment_likes WHERE "commentId" = $1',
      commentId
    );
    const likeCount = likesCountRes[0]?.count ?? 0;

    return { isLiked, likeCount };
  }

  async deleteComment(commentId: string, userId: string): Promise<void> {
    const comment = await prisma.communityPostComment.findUnique({
      where: { id: commentId },
      select: { authorId: true, post: { select: { communityId: true } } },
    });
    if (!comment) throw new NotFoundError('Comment');
    if (comment.authorId !== userId) {
      const role = await this.membershipRole(comment.post.communityId, userId);
      if (role !== 'owner' && role !== 'moderator') {
        throw new ForbiddenError('You can only delete your own comments');
      }
    }
    await prisma.communityPostComment.delete({ where: { id: commentId } });
  }
}

export default new CommunitiesService();
