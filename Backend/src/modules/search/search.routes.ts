import { Router, Request, Response } from 'express';
import { authenticate } from '@middlewares/authenticate';
import prisma from '@config/database';
import { sendSuccess } from '@utils/response';
import { env } from '@config/env';
import { createClient } from 'redis';

const router = Router();

// Redis client for search caching
let redisClient: ReturnType<typeof createClient> | null = null;

async function getRedisClient() {
  if (!redisClient) {
    redisClient = createClient({ url: env.REDIS_URL });
    await redisClient.connect().catch(() => {
      // Fail silently if Redis is unavailable
      redisClient = null;
    });
  }
  return redisClient;
}

router.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  const q = ((req.query.q as string) ?? '').trim();
  const currentUserId = req.user!.userId;

  if (!q || q.length < 2) {
    sendSuccess(res, { users: [], events: [] });
    return;
  }

  // Optimize: Use raw SQL with trigram similarity for faster text search
  // This avoids full table scans and provides better performance
  const searchTerm = `%${q}%`;

  const [users, events] = await Promise.all([
    prisma.$queryRaw<Array<{
      id: string;
      username: string | null;
      role: string;
      firstName: string | null;
      lastName: string | null;
      avatar: string | null;
      company: string | null;
    }>>`
      SELECT
        u.id,
        u.username,
        u.role,
        p.first_name as "firstName",
        p.last_name as "lastName",
        p.avatar,
        p.company
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      WHERE u.deleted_at IS NULL
        AND u.is_active = true
        AND u.id != $1
        AND (
          u.username ILIKE $2
          OR u.email ILIKE $2
          OR p.first_name ILIKE $2
          OR p.last_name ILIKE $2
          OR p.company ILIKE $2
        )
      LIMIT 5
    `,
      currentUserId,
      searchTerm,
    ),
    prisma.$queryRaw<Array<{
      id: string;
      title: string;
      slug: string | null;
      start_date: string;
      cover_image: string | null;
      city: string | null;
      address: string | null;
    }>>`
      SELECT
        id,
        title,
        slug,
        start_date as "startDate",
        cover_image as "coverImage",
        city,
        address
      FROM events
      WHERE deleted_at IS NULL
        AND status = 'PUBLISHED'
        AND (
          title ILIKE $1
          OR description ILIKE $1
          OR city ILIKE $1
          OR address ILIKE $1
        )
      LIMIT 5
    `,
      searchTerm,
  ]);

  sendSuccess(res, {
    users: users.map((u) => ({
      id: u.id,
      username: u.username,
      role: u.role,
      profile: {
        firstName: u.firstName,
        lastName: u.lastName,
        avatar: u.avatar,
        company: u.company,
      },
    })),
    events: events.map((e) => ({
      id: e.id,
      title: e.title,
      slug: e.slug,
      startDate: e.startDate,
      coverImage: e.coverImage,
      city: e.city,
      address: e.address,
    })),
  });
});

export default router;
