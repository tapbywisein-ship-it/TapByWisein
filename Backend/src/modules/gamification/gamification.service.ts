import prisma from '@config/database';
import { NotFoundError } from '@utils/errors';
import { LEVEL_THRESHOLDS, SCORE_VALUES, BADGE_NAMES } from '@config/constants';
import { parsePaginationQuery, buildPaginationMeta } from '@utils/pagination';
import notificationsService from '@modules/notifications/notifications.service';
import logger from '@utils/logger';

export class GamificationService {
  async getUserScore(userId: string) {
    const gamification = await prisma.gamification.findUnique({ where: { userId } });
    if (!gamification) {
      return { fkScore: 0, level: 1, levelLabel: 'Newcomer' };
    }

    const levelInfo = this.getLevelInfo(gamification.fkScore);
    return { ...gamification, levelLabel: levelInfo.label };
  }

  async addScore(
    userId: string,
    action: string,
    points: number,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    // The database adds the points itself (increment), so two awards landing at
    // the same moment both count. Reading the score, adding in code and writing
    // it back let one award overwrite the other. The history row doesn't depend
    // on the score, so both writes go out together.
    const [scoreRow] = await Promise.all([
      prisma.gamification.upsert({
        where: { userId },
        update: { fkScore: { increment: points } },
        create: { userId, fkScore: Math.max(0, points) },
      }),
      prisma.scoreHistory.create({
        data: {
          userId,
          action,
          points,
          metadata: metadata
            ? (metadata as import('@prisma/client').Prisma.InputJsonValue)
            : undefined,
        },
      }),
    ]);

    // Clamp at 0 so a buggy double-debit can't push a score negative.
    let newScore = scoreRow.fkScore;
    if (newScore < 0) {
      await prisma.gamification.updateMany({
        where: { userId, fkScore: { lt: 0 } },
        data: { fkScore: 0 },
      });
      newScore = 0;
    }

    const oldLevel = scoreRow.level;
    const newLevel = this.calculateLevel(newScore);
    if (newLevel > oldLevel) {
      // Only ever raise the stored level: when two awards run at once their
      // writes can land in either order. The count also makes sure only one
      // of them sends the level-up notification.
      const raised = await prisma.gamification.updateMany({
        where: { userId, level: { lt: newLevel } },
        data: { level: newLevel },
      });
      if (raised.count > 0) {
        const levelInfo = this.getLevelInfo(newScore);
        await notificationsService
          .createNotification(
            userId,
            'LEVEL_UP',
            'Level Up!',
            `Congratulations! You've reached Level ${newLevel}: ${levelInfo.label}`,
            { newLevel, oldLevel }
          )
          .catch(() => {});
      }
    }

    // Badge checks run about ten queries and the caller doesn't need their
    // result, so the request no longer waits for them.
    this.checkAndAwardBadges(userId).catch((err: unknown) =>
      logger.warn('Badge check failed', { userId, err })
    );
  }

  async getLeaderboard(page?: number, limit?: number) {
    const pagination = parsePaginationQuery({ page, limit });

    // Everyone with an account, minus deactivated or deleted ones.
    const where = { user: { isActive: true, deletedAt: null } };

    const [users, total] = await Promise.all([
      prisma.gamification.findMany({
        where,
        include: {
          // Any signed-in user can read the leaderboard, so select only public
          // fields. `include` on user would send the whole account row for
          // everyone listed.
          user: {
            select: {
              id: true,
              username: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                  avatar: true,
                  company: true,
                },
              },
            },
          },
        },
        // Ties keep a fixed order (earliest first), so nobody shows up on two
        // pages or on none when paging through equal scores.
        orderBy: [{ fkScore: 'desc' }, { createdAt: 'asc' }, { id: 'asc' }],
        skip: pagination.skip,
        take: pagination.limit,
      }),
      prisma.gamification.count({ where }),
    ]);

    const leaderboard = users.map((g, index) => ({
      rank: pagination.skip + index + 1,
      userId: g.userId,
      fkScore: g.fkScore,
      level: g.level,
      levelLabel: this.getLevelInfo(g.fkScore).label,
      user: g.user,
    }));

    return {
      leaderboard,
      pagination: buildPaginationMeta(total, pagination.page, pagination.limit),
    };
  }

  async getUserBadges(userId: string) {
    return prisma.userBadge.findMany({
      where: { userId },
      include: {
        badge: true,
      },
      orderBy: { earnedAt: 'desc' },
    });
  }

  async checkAndAwardBadges(userId: string): Promise<void> {
    const [
      connectionCount,
      eventCount,
      gamification,
      earnedBadges,
      hasFounderCard,
      qrScanCount,
      profile,
      user,
    ] = await Promise.all([
      prisma.connection.count({
        where: {
          status: 'ACCEPTED',
          OR: [{ requesterId: userId }, { receiverId: userId }],
        },
      }),
      prisma.eventRegistration.count({
        where: { userId, status: { in: ['REGISTERED', 'ATTENDED'] } },
      }),
      prisma.gamification.findUnique({ where: { userId } }),
      // Fetched with the counts instead of after them: one round trip fewer.
      prisma.userBadge.findMany({
        where: { userId },
        select: { badge: { select: { name: true } } },
      }),
      prisma.founderCard.findUnique({ where: { userId, status: 'ACTIVE' } } as {
        where: { userId: string; status: 'ACTIVE' };
      }),
      prisma.scoreHistory.count({ where: { userId, action: 'QR_SCAN' } }),
      prisma.profile.findUnique({
        where: { userId },
        select: { firstName: true, lastName: true, bio: true, avatar: true, skills: true },
      }),
      prisma.user.findUnique({ where: { id: userId }, select: { createdAt: true } }),
    ]);

    const earnedBadgeNames = new Set(earnedBadges.map((b) => b.badge.name));

    const badgesToAward: string[] = [];

    if (connectionCount >= 1 && !earnedBadgeNames.has(BADGE_NAMES.FIRST_CONNECTION)) {
      badgesToAward.push(BADGE_NAMES.FIRST_CONNECTION);
    }
    if (connectionCount >= 10 && !earnedBadgeNames.has(BADGE_NAMES.NETWORK_STARTER)) {
      badgesToAward.push(BADGE_NAMES.NETWORK_STARTER);
    }
    if (connectionCount >= 50 && !earnedBadgeNames.has(BADGE_NAMES.SUPER_CONNECTOR)) {
      badgesToAward.push(BADGE_NAMES.SUPER_CONNECTOR);
    }
    if (eventCount >= 1 && !earnedBadgeNames.has(BADGE_NAMES.EVENT_GOER)) {
      badgesToAward.push(BADGE_NAMES.EVENT_GOER);
    }
    if (eventCount >= 5 && !earnedBadgeNames.has(BADGE_NAMES.EVENT_ENTHUSIAST)) {
      badgesToAward.push(BADGE_NAMES.EVENT_ENTHUSIAST);
    }
    if (hasFounderCard && !earnedBadgeNames.has(BADGE_NAMES.FOUNDER_BADGE)) {
      badgesToAward.push(BADGE_NAMES.FOUNDER_BADGE);
    }
    if (
      gamification &&
      gamification.fkScore >= 500 &&
      !earnedBadgeNames.has(BADGE_NAMES.COMMUNITY_PILLAR)
    ) {
      badgesToAward.push(BADGE_NAMES.COMMUNITY_PILLAR);
    }

    // QR_MASTER: scanned 10+ QR codes
    if (qrScanCount >= 10 && !earnedBadgeNames.has(BADGE_NAMES.QR_MASTER)) {
      badgesToAward.push(BADGE_NAMES.QR_MASTER);
    }

    // PROFILE_CHAMPION: profile fully complete
    const isProfileComplete =
      !!profile?.firstName &&
      !!profile?.lastName &&
      !!profile?.bio &&
      !!profile?.avatar &&
      (profile?.skills?.length ?? 0) > 0;
    if (isProfileComplete && !earnedBadgeNames.has(BADGE_NAMES.PROFILE_CHAMPION)) {
      badgesToAward.push(BADGE_NAMES.PROFILE_CHAMPION);
    }

    // EARLY_ADOPTER: signed up within the first 90 days of launch (2024-01-01)
    const LAUNCH_DATE = new Date('2024-01-01T00:00:00Z');
    const EARLY_CUTOFF = new Date(LAUNCH_DATE.getTime() + 90 * 24 * 60 * 60 * 1000);
    if (
      user &&
      user.createdAt <= EARLY_CUTOFF &&
      !earnedBadgeNames.has(BADGE_NAMES.EARLY_ADOPTER)
    ) {
      badgesToAward.push(BADGE_NAMES.EARLY_ADOPTER);
    }

    // Award new badges
    for (const badgeName of badgesToAward) {
      const badge = await prisma.badge.findUnique({ where: { name: badgeName } });
      if (!badge) continue;

      // Two badge checks for the same user can now overlap (they run in the
      // background), so both may decide to award the same badge. skipDuplicates
      // lets the database keep only one; the other check sees count 0 and
      // skips the notification and the points.
      const awarded = await prisma.userBadge.createMany({
        data: [{ userId, badgeId: badge.id }],
        skipDuplicates: true,
      });
      if (awarded.count === 0) continue;

      await notificationsService
        .createNotification(
          userId,
          'BADGE_EARNED',
          'Badge Earned!',
          `You've earned the "${badge.name}" badge!`,
          { badgeId: badge.id, badgeName: badge.name }
        )
        .catch(() => {});

      // Add score for earning badge
      await this.addScore(userId, 'BADGE_EARNED', SCORE_VALUES.BADGE_EARNED, {
        badgeId: badge.id,
      }).catch(() => {});
    }
  }

  calculateLevel(score: number): number {
    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
      if (score >= LEVEL_THRESHOLDS[i].minScore) {
        return LEVEL_THRESHOLDS[i].level;
      }
    }
    return 1;
  }

  getLevelInfo(score: number): { level: number; label: string; minScore: number } {
    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
      if (score >= LEVEL_THRESHOLDS[i].minScore) {
        return LEVEL_THRESHOLDS[i];
      }
    }
    return LEVEL_THRESHOLDS[0];
  }

  async getScoreHistory(userId: string, page?: number, limit?: number) {
    const user = await prisma.user.findFirst({ where: { id: userId, deletedAt: null } });
    if (!user) throw new NotFoundError('User');

    const pagination = parsePaginationQuery({ page, limit });

    const [history, total] = await Promise.all([
      prisma.scoreHistory.findMany({
        where: { userId },
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.scoreHistory.count({ where: { userId } }),
    ]);

    return {
      history,
      pagination: buildPaginationMeta(total, pagination.page, pagination.limit),
    };
  }

  async getAllBadges() {
    return prisma.badge.findMany({ orderBy: { name: 'asc' } });
  }
}

export default new GamificationService();
