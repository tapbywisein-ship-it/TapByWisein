import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// The database is faked: these tests check what registerForEvent does with the
// host's questions, without a real database or any secrets.
/* eslint-disable @typescript-eslint/no-explicit-any */
const prisma: any = {
  event: { findFirst: jest.fn() },
  eventQuestion: { findMany: jest.fn() },
  eventRegistration: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), count: jest.fn() },
  registrationAnswer: { createMany: jest.fn() },
  lead: { upsert: jest.fn() },
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

import eventsService from '../../src/modules/events/events.service';

const EVENT_ID = 'event-1';
const USER_ID = 'user-1';
const requiredQuestion = { id: 'q-required', prompt: 'Your company?' };

const setUp = ({ full = false } = {}) => {
  prisma.event.findFirst.mockResolvedValue({
    id: EVENT_ID,
    title: 'Demo',
    organizerId: 'org-1',
    capacity: full ? 1 : 100,
    requiresApproval: false,
    ticketTiers: null,
    price: 0,
    _count: { registrations: full ? 1 : 0 },
  });
  // findMany is asked for required questions first, then for the answered ones.
  prisma.eventQuestion.findMany.mockImplementation(async (args: any) =>
    args.where.required ? [requiredQuestion] : [{ id: 'q-required' }]
  );
  prisma.eventRegistration.findUnique.mockResolvedValue(null);
  prisma.eventRegistration.count.mockResolvedValue(0);
  prisma.eventRegistration.create.mockImplementation(async (args: any) => ({ id: 'reg-1', ...args.data }));
  prisma.$transaction.mockImplementation(async (fn: any) => fn(prisma));
  prisma.$executeRawUnsafe.mockResolvedValue(1);
  prisma.registrationAnswer.createMany.mockResolvedValue({ count: 1 });
  prisma.lead.upsert.mockResolvedValue({});
};

describe('registerForEvent and the host\'s questions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // The confirmation email isn't what's being tested here.
    // (It's private, hence the cast.)
    jest.spyOn(eventsService as any, 'sendRegistrationConfirmation').mockResolvedValue(undefined as never);
  });

  it('rejects a registration that sends no answers when a question is required, and saves nothing', async () => {
    setUp();
    await expect(eventsService.registerForEvent(EVENT_ID, USER_ID)).rejects.toThrow(
      'Please answer required question: "Your company?"'
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.eventRegistration.create).not.toHaveBeenCalled();
  });

  it('rejects a blank answer to a required question before registering', async () => {
    setUp();
    await expect(
      eventsService.registerForEvent(EVENT_ID, USER_ID, [{ questionId: 'q-required', answer: '   ' }])
    ).rejects.toThrow('Please answer required question');
    expect(prisma.eventRegistration.create).not.toHaveBeenCalled();
  });

  it('registers and saves the answers when the required question is answered', async () => {
    setUp();
    const result = await eventsService.registerForEvent(EVENT_ID, USER_ID, [
      { questionId: 'q-required', answer: '  Acme  ' },
    ]);
    expect(result.registration.status).toBe('REGISTERED');
    expect(prisma.registrationAnswer.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: [{ registrationId: 'reg-1', questionId: 'q-required', answer: 'Acme' }],
      })
    );
  });

  it('saves the answers on the waitlist path too', async () => {
    setUp({ full: true });
    const result = await eventsService.registerForEvent(EVENT_ID, USER_ID, [
      { questionId: 'q-required', answer: 'Acme' },
    ]);
    expect(result.registration.status).toBe('WAITLISTED');
    expect(prisma.registrationAnswer.createMany).toHaveBeenCalledTimes(1);
  });

  it('still lets guest RSVP register without answers (requireAnswers: false)', async () => {
    setUp();
    const result = await eventsService.registerForEvent(EVENT_ID, USER_ID, undefined, undefined, {
      requireAnswers: false,
    });
    expect(result.registration.status).toBe('REGISTERED');
    expect(prisma.registrationAnswer.createMany).not.toHaveBeenCalled();
  });
});
