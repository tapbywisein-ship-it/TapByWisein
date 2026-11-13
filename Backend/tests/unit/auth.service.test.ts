import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { createHash } from 'crypto';

// The database is faked: these tests cover the current AuthService (getMe and
// the invite-claim flow), without a real database or any secrets.
/* eslint-disable @typescript-eslint/no-explicit-any */
const prisma: any = {
  user: { findUnique: jest.fn(), update: jest.fn() },
  claimToken: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
  gamification: { create: jest.fn() },
  $transaction: jest.fn(),
};
jest.mock('@config/database', () => ({ __esModule: true, default: prisma, prisma }));
jest.mock('@utils/crypto', () => ({
  __esModule: true,
  generateToken: jest.fn(() => 'raw-claim-token'),
  hashPassword: jest.fn(async (password: string) => `hashed(${password})`),
}));

import authService from '../../src/modules/auth/auth.service';

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');
const DAY = 86_400_000;

const dbUser = {
  id: 'user-1',
  email: 'ana@example.com',
  password: 'stored-hash',
  role: 'ATTENDEE',
  tier: 'FREE',
  isActive: true,
  isEmailVerified: true,
  username: 'ana',
  profile: {
    firstName: 'Ana',
    lastName: 'Rao',
    avatar: null,
    company: 'Acme',
    skills: ['React'],
    interests: [],
    lookingFor: [],
  },
  founderCard: null,
  gamification: { fkScore: 50, level: 1 },
};

const claimRow = (overrides: Record<string, unknown> = {}) => ({
  id: 'claim-1',
  userId: 'user-1',
  usedAt: null,
  expiresAt: new Date(Date.now() + DAY),
  user: dbUser,
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getMe', () => {
  it('returns the signed-in user without the password', async () => {
    prisma.user.findUnique.mockResolvedValue(dbUser);
    const me = await authService.getMe('user-1');
    expect(me).toMatchObject({ id: 'user-1', email: 'ana@example.com', role: 'ATTENDEE' });
    expect(me.profile).toMatchObject({ firstName: 'Ana', company: 'Acme', bio: null });
    expect(me).not.toHaveProperty('password');
  });

  it('throws when the user does not exist', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(authService.getMe('missing')).rejects.toThrow('User');
  });
});

describe('generateClaimToken', () => {
  it('stores only a hash of the token, valid for 14 days, and returns a link with the token', async () => {
    prisma.user.findUnique.mockResolvedValue(dbUser);
    const before = Date.now();

    const link = await authService.generateClaimToken('user-1');

    expect(link).toMatch(/\/claim\/raw-claim-token$/);
    const saved = prisma.claimToken.create.mock.calls[0][0].data;
    expect(saved.tokenHash).toBe(sha256('raw-claim-token'));
    expect(JSON.stringify(saved)).not.toContain('raw-claim-token');
    const days = (saved.expiresAt.getTime() - before) / DAY;
    expect(days).toBeGreaterThan(13.99);
    expect(days).toBeLessThan(14.01);
  });

  it('throws for an unknown user and stores nothing', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(authService.generateClaimToken('missing')).rejects.toThrow('User');
    expect(prisma.claimToken.create).not.toHaveBeenCalled();
  });
});

describe('validateClaimToken', () => {
  it('looks the token up by its hash and returns who it is for', async () => {
    prisma.claimToken.findUnique.mockResolvedValue(claimRow());
    const result = await authService.validateClaimToken('raw-claim-token');
    expect(prisma.claimToken.findUnique.mock.calls[0][0].where).toEqual({
      tokenHash: sha256('raw-claim-token'),
    });
    expect(result).toEqual({ email: 'ana@example.com', firstName: 'Ana', lastName: 'Rao' });
  });

  it('rejects an unknown token', async () => {
    prisma.claimToken.findUnique.mockResolvedValue(null);
    await expect(authService.validateClaimToken('nope')).rejects.toThrow('Claim token');
  });

  it('rejects a token that was already used', async () => {
    prisma.claimToken.findUnique.mockResolvedValue(claimRow({ usedAt: new Date() }));
    await expect(authService.validateClaimToken('raw-claim-token')).rejects.toThrow('already been claimed');
  });

  it('rejects an expired token', async () => {
    prisma.claimToken.findUnique.mockResolvedValue(claimRow({ expiresAt: new Date(Date.now() - DAY) }));
    await expect(authService.validateClaimToken('raw-claim-token')).rejects.toThrow('expired');
  });
});

describe('claimAccount', () => {
  beforeEach(() => {
    prisma.user.update.mockReturnValue({ ...dbUser, password: 'hashed(new-password)' });
    prisma.claimToken.update.mockReturnValue({});
    prisma.gamification.create.mockReturnValue({});
    prisma.$transaction.mockImplementation(async (steps: any[]) => steps);
  });

  it('rejects a password under 8 characters and changes nothing', async () => {
    prisma.claimToken.findUnique.mockResolvedValue(claimRow());
    await expect(authService.claimAccount('raw-claim-token', 'short')).rejects.toThrow('at least 8');
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rejects a used or expired token and changes nothing', async () => {
    prisma.claimToken.findUnique.mockResolvedValue(claimRow({ usedAt: new Date() }));
    await expect(authService.claimAccount('raw-claim-token', 'new-password')).rejects.toThrow('already');
    prisma.claimToken.findUnique.mockResolvedValue(claimRow({ expiresAt: new Date(Date.now() - DAY) }));
    await expect(authService.claimAccount('raw-claim-token', 'new-password')).rejects.toThrow('expired');
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('saves a hashed password and marks the token used, in one transaction', async () => {
    prisma.claimToken.findUnique.mockResolvedValue(claimRow());

    const result = await authService.claimAccount('raw-claim-token', 'new-password');

    const userUpdate = prisma.user.update.mock.calls[0][0];
    expect(userUpdate.where).toEqual({ id: 'user-1' });
    expect(userUpdate.data.password).toBe('hashed(new-password)');
    expect(prisma.claimToken.update.mock.calls[0][0]).toMatchObject({
      where: { id: 'claim-1' },
      data: { usedAt: expect.any(Date) },
    });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    // The user already has an FK Score row, so none is created.
    expect(prisma.gamification.create).not.toHaveBeenCalled();
    expect(result.user).not.toHaveProperty('password');
  });

  it('creates the FK Score row when the user has none yet', async () => {
    prisma.claimToken.findUnique.mockResolvedValue(claimRow({ user: { ...dbUser, gamification: null } }));
    await authService.claimAccount('raw-claim-token', 'new-password');
    expect(prisma.gamification.create).toHaveBeenCalledWith({
      data: { userId: 'user-1', fkScore: 0, level: 1 },
    });
  });
});
