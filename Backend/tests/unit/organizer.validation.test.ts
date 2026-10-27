import { describe, it, expect } from '@jest/globals';
import {
  addCoorganizerSchema,
  createAgendaItemSchema,
  createCouponSchema,
  createQuestionSchema,
  createSpeakerSchema,
  sendEventBlastSchema,
  setEventRoleSchema,
  updateLeadStatusSchema,
} from '../../src/modules/organizer/organizer.validation';

// The payloads below are what the organizer UI sends today, so these tests
// guard against a schema change that would start rejecting real requests.
describe('organizer.validation', () => {
  it('accepts a speaker with empty optional fields sent as null', () => {
    const result = createSpeakerSchema.safeParse({
      name: 'Asha Rao',
      title: null,
      company: null,
      bio: null,
    });
    expect(result.success).toBe(true);
  });

  it('accepts an agenda item with a datetime-local start and no end', () => {
    const result = createAgendaItemSchema.safeParse({
      title: 'Opening keynote',
      description: null,
      startsAt: '2026-11-01T10:00',
      endsAt: null,
      speakerId: null,
    });
    expect(result.success).toBe(true);
  });

  it('rejects an agenda item with an invalid start time', () => {
    const result = createAgendaItemSchema.safeParse({ title: 'Talk', startsAt: 'soon' });
    expect(result.success).toBe(false);
  });

  it('accepts a coupon without limits and rejects a discount over 100%', () => {
    expect(createCouponSchema.safeParse({ code: 'EARLY20', discountPct: 20 }).success).toBe(true);
    expect(createCouponSchema.safeParse({ code: 'FREE', discountPct: 150 }).success).toBe(false);
  });

  it('accepts the question types the editor offers and rejects others', () => {
    const base = { prompt: 'Company?', required: true };
    expect(createQuestionSchema.safeParse({ ...base, type: 'TEXT' }).success).toBe(true);
    expect(
      createQuestionSchema.safeParse({ ...base, type: 'SELECT', options: ['A', 'B'] }).success
    ).toBe(true);
    expect(createQuestionSchema.safeParse({ ...base, type: 'FILE' }).success).toBe(false);
  });

  it('only allows the COHOST co-host role', () => {
    expect(addCoorganizerSchema.safeParse({ email: 'host@example.com' }).success).toBe(true);
    expect(
      addCoorganizerSchema.safeParse({ email: 'host@example.com', role: 'OWNER' }).success
    ).toBe(false);
  });

  it('defaults a blast audience to all and requires a subject', () => {
    const ok = sendEventBlastSchema.safeParse({ subject: 'Hi', body: 'See you there' });
    expect(ok.success && ok.data.audience).toBe('all');
    expect(sendEventBlastSchema.safeParse({ subject: ' ', body: 'x' }).success).toBe(false);
  });

  it('validates lead statuses and event roles against their fixed lists', () => {
    expect(updateLeadStatusSchema.safeParse({ status: 'CONTACTED' }).success).toBe(true);
    expect(updateLeadStatusSchema.safeParse({ status: 'WON' }).success).toBe(false);
    expect(setEventRoleSchema.safeParse({ role: 'VIP' }).success).toBe(true);
    expect(setEventRoleSchema.safeParse({ role: 'ADMIN' }).success).toBe(false);
  });
});
