import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// The database is faked: these tests check that sign-ups stop after the
// registration deadline, without a real database or any secrets.
/* eslint-disable @typescript-eslint/no-explicit-any */
const prisma: any = {
  event: { findFirst: jest.fn() },
  user: { findUnique: jest.fn(), create: jest.fn() },
  eventQuestion: { findMany: jest.fn() },
  eventRegistration: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), count: jest.fn() },
  registrationAnswer: { createMany: jest.fn() },
  $transaction: jest.fn(),
  $executeRawUnsafe: jest.fn(),
};
jest.mock('@config/database', () => ({ __esModule: true, default: prisma, prisma }));
jest.mock('@modules/ambassadors/ambassadors.service', () => ({
  __esModule: true,
  default: { resolveReferralCode: jest.fn(async () => null) },
}));
jest.mock('@modules/notifications/notifications.service', () => ({
  __esModule: true,
  default: { createNotification: jest.fn(async () => undefined) },
}));
jest.mock('@modules/gamification/gamification.service', () => ({
  __esModule: true,
  default: { addScore: jest.fn(async () => undefined) },
}));
jest.mock('@modules/payments/payments.service', () => ({
  __esModule: true,
  default: {},
  paymentsConfigured: () => false,
}));

import { assertRegistrationOpen } from '../../src/utils/registrationWindow';
import eventsService from '../../src/modules/events/events.service';

const DAY = 86_400_000;
const daysFromNow = (days: number) => new Date(Date.now() + days * DAY);

describe('assertRegistrationOpen', () => {
  const now = new Date('2026-12-01T10:00:00Z');
  const endDate = new Date('2026-12-10T10:00:00Z');

  it('allows sign-ups before the deadline', () => {
    const registrationDeadline = new Date('2026-12-05T10:00:00Z');
    expect(() => assertRegistrationOpen({ registrationDeadline, endDate }, now)).not.toThrow();
  });

  it('allows sign-ups when no deadline is set and the event has not ended', () => {
    expect(() => assertRegistrationOpen({ registrationDeadline: null, endDate }, now)).not.toThrow();
  });

  it('blocks sign-ups after the deadline', () => {
    const registrationDeadline = new Date('2026-11-30T10:00:00Z');
    expect(() => assertRegistrationOpen({ registrationDeadline, endDate }, now)).toThrow(
      'Registration for this event has closed'
    );
  });

  it('blocks sign-ups once the event has ended, even without a deadline', () => {
    const ended = new Date('2026-11-30T10:00:00Z');
    expect(() => assertRegistrationOpen({ registrationDeadline: null, endDate: ended }, now)).toThrow(
      'This event has already ended'
    );
  });
});

describe('sign-ups after the registration deadline', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prisma.event.findFirst.mockResolvedValue({
      id: 'event-1',
      title: 'Demo',
      organizerId: 'org-1',
      capacity: 100,
      requiresApproval: false,
      ticketTiers: null,
      price: 0,
      registrationDeadline: daysFromNow(-1),
      endDate: daysFromNow(5),
      _count: { registrations: 0 },
    });
  });

  it('registerForEvent refuses and creates no registration', async () => {
    await expect(eventsService.registerForEvent('event-1', 'user-1')).rejects.toThrow(
      'Registration for this event has closed'
    );
    expect(prisma.eventRegistration.create).not.toHaveBeenCalled();
  });

  it('guest RSVP refuses before creating an account', async () => {
    await expect(
      eventsService.rsvpGuest('event-1', { name: 'New Guest', email: 'guest@example.com' } as any)
    ).rejects.toThrow('Registration for this event has closed');
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
    expect(prisma.user.create).not.toHaveBeenCalled();
  });
});
