import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// The database is faked with one in-memory score row. Every fake query waits a
// tick before it runs, so two awards started together really do interleave,
// the way two requests do on the live server.
/* eslint-disable @typescript-eslint/no-explicit-any */
const row = { userId: 'user-1', fkScore: 0, level: 1 };
const tick = () => new Promise((resolve) => setImmediate(resolve));

const prisma: any = {
  gamification: {
    findUnique: jest.fn(async () => {
      await tick();
      return { ...row };
    }),
    upsert: jest.fn(async ({ update }: any) => {
      await tick();
      const fk = update.fkScore;
      row.fkScore = typeof fk === 'number' ? fk : row.fkScore + fk.increment;
      if (typeof update.level === 'number') row.level = update.level;
      return { ...row };
    }),
    updateMany: jest.fn(async ({ where, data }: any) => {
      await tick();
      if (where.level && row.level < where.level.lt) {
        row.level = data.level;
        return { count: 1 };
      }
      return { count: 0 };
    }),
  },
  scoreHistory: { create: jest.fn(async () => ({})), count: jest.fn(async () => 0) },
  connection: { count: jest.fn(async () => 0) },
  eventRegistration: { count: jest.fn(async () => 0) },
  userBadge: { findMany: jest.fn(async () => []), createMany: jest.fn() },
  founderCard: { findUnique: jest.fn(async () => null) },
  profile: { findUnique: jest.fn(async () => null) },
  user: { findUnique: jest.fn(async () => null) },
  badge: { findUnique: jest.fn() },
};
jest.mock('@config/database', () => ({ __esModule: true, default: prisma, prisma }));

const createNotification = jest.fn(async () => undefined);
jest.mock('@modules/notifications/notifications.service', () => ({
  __esModule: true,
  default: { createNotification },
}));

import { GamificationService } from '../../src/modules/gamification/gamification.service';
import { BADGE_NAMES, SCORE_VALUES } from '../../src/config/constants';

const USER_ID = 'user-1';

function serviceWithoutBadgeChecks() {
  const service = new GamificationService();
  jest.spyOn(service, 'checkAndAwardBadges').mockResolvedValue(undefined);
  return service;
}

const levelUpNotifications = () =>
  createNotification.mock.calls.filter((call: any[]) => call[1] === 'LEVEL_UP');

beforeEach(() => {
  row.fkScore = 0;
  row.level = 1;
});

describe('addScore', () => {
  it('lets the database add the points instead of writing a total', async () => {
    const service = serviceWithoutBadgeChecks();

    await service.addScore(USER_ID, 'EVENT_REGISTERED', 20);

    const upsert = prisma.gamification.upsert.mock.calls[0][0];
    expect(upsert.update).toEqual({ fkScore: { increment: 20 } });
    expect(prisma.gamification.findUnique).not.toHaveBeenCalled();
    expect(prisma.scoreHistory.create).toHaveBeenCalledTimes(1);
  });

  it('counts both awards when two land at the same moment', async () => {
    const service = serviceWithoutBadgeChecks();

    await Promise.all([
      service.addScore(USER_ID, 'EVENT_REGISTERED', 20),
      service.addScore(USER_ID, 'CONNECTION_MADE', 10),
    ]);

    expect(row.fkScore).toBe(30);
  });

  it('raises the level and sends one level-up notification', async () => {
    row.fkScore = 90;
    const service = serviceWithoutBadgeChecks();

    await service.addScore(USER_ID, 'EVENT_REGISTERED', 20);

    expect(row.level).toBe(2);
    expect(levelUpNotifications()).toHaveLength(1);
  });

  it('sends only one level-up notification when two awards cross a level together', async () => {
    row.fkScore = 90;
    const service = serviceWithoutBadgeChecks();

    await Promise.all([
      service.addScore(USER_ID, 'EVENT_REGISTERED', 20),
      service.addScore(USER_ID, 'CONNECTION_MADE', 10),
    ]);

    expect(row.fkScore).toBe(120);
    expect(row.level).toBe(2);
    expect(levelUpNotifications()).toHaveLength(1);
  });

  it("doesn't make the caller wait for badge checks", async () => {
    const service = new GamificationService();
    const neverFinishes = new Promise<void>(() => {});
    jest.spyOn(service, 'checkAndAwardBadges').mockReturnValue(neverFinishes);

    await service.addScore(USER_ID, 'QR_SCAN', 5);

    expect(service.checkAndAwardBadges).toHaveBeenCalledWith(USER_ID);
    expect(row.fkScore).toBe(5);
  });
});

describe('checkAndAwardBadges', () => {
  const firstConnection = { id: 'badge-1', name: BADGE_NAMES.FIRST_CONNECTION };

  beforeEach(() => {
    prisma.connection.count.mockResolvedValue(1);
    prisma.badge.findUnique.mockResolvedValue(firstConnection);
  });

  it('awards a new badge with its notification and points', async () => {
    prisma.userBadge.createMany.mockResolvedValue({ count: 1 });
    const service = new GamificationService();
    const addScore = jest.spyOn(service, 'addScore').mockResolvedValue(undefined);

    await service.checkAndAwardBadges(USER_ID);

    expect(prisma.userBadge.createMany).toHaveBeenCalledWith({
      data: [{ userId: USER_ID, badgeId: 'badge-1' }],
      skipDuplicates: true,
    });
    expect(createNotification).toHaveBeenCalledTimes(1);
    expect(addScore).toHaveBeenCalledWith(USER_ID, 'BADGE_EARNED', SCORE_VALUES.BADGE_EARNED, {
      badgeId: 'badge-1',
    });
  });

  it('gives no second notification or points when another check already awarded it', async () => {
    prisma.userBadge.createMany.mockResolvedValue({ count: 0 });
    const service = new GamificationService();
    const addScore = jest.spyOn(service, 'addScore').mockResolvedValue(undefined);

    await service.checkAndAwardBadges(USER_ID);

    expect(createNotification).not.toHaveBeenCalled();
    expect(addScore).not.toHaveBeenCalled();
  });
});
