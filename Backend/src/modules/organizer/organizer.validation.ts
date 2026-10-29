import { z } from 'zod';

// The organizer UI sends null for optional fields left empty, so optional
// strings accept null as well as a missing key.
const optionalText = (max: number) => z.string().max(max).trim().nullish();

// Accepts ISO strings and the "YYYY-MM-DDTHH:mm" a datetime-local input sends.
const dateString = z
  .string()
  .refine((s) => !Number.isNaN(new Date(s).getTime()), 'Must be a valid date');

export const updateLeadStatusSchema = z.object({
  status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'ARCHIVED']),
  notes: z.string().max(5000).optional(),
});

export const sendEventBlastSchema = z.object({
  subject: z.string().trim().min(1, 'Subject is required').max(200),
  body: z.string().trim().min(1, 'Message is required').max(50000),
  audience: z.enum(['all', 'registered', 'waitlist']).optional().default('all'),
});

export const sendAttendeeBlastSchema = z.object({
  userIds: z.array(z.string().min(1)).min(1, 'Select at least one attendee').max(5000),
  subject: z.string().trim().min(1, 'Subject is required').max(200),
  body: z.string().trim().min(1, 'Message is required').max(50000),
});

export const checkInAttendeeSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
});

export const createCouponSchema = z.object({
  code: z.string().trim().min(1, 'Coupon code is required').max(50),
  discountPct: z.coerce.number().int().min(1).max(100),
  maxUses: z.coerce.number().int().min(1).nullish(),
  expiresAt: dateString.nullish(),
});

export const addCoorganizerSchema = z.object({
  email: z.string().trim().email('Enter a valid email'),
  role: z.enum(['COHOST']).optional(),
});

export const createSpeakerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(200),
  title: optionalText(200),
  company: optionalText(200),
  bio: optionalText(5000),
  avatar: optionalText(2000),
  position: z.coerce.number().int().min(0).optional(),
});

export const createAgendaItemSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200),
  description: optionalText(5000),
  startsAt: dateString,
  endsAt: dateString.nullish(),
  speakerId: z.string().nullish(),
});

const questionFields = {
  prompt: z.string().trim().min(1, 'Prompt is required').max(500),
  type: z.enum(['TEXT', 'TEXTAREA', 'SELECT']),
  options: z.array(z.string().trim().min(1).max(200)).max(50),
  required: z.boolean(),
  position: z.coerce.number().int().min(0),
};

export const createQuestionSchema = z.object({
  prompt: questionFields.prompt,
  type: questionFields.type.optional(),
  options: questionFields.options.optional(),
  required: questionFields.required.optional(),
  position: questionFields.position.optional(),
});

export const updateQuestionSchema = z.object(questionFields).partial();

export const registrationActionSchema = z.object({
  action: z.enum(['APPROVE', 'DENY']),
});

export const setEventRoleSchema = z.object({
  role: z.enum(['ATTENDEE', 'VIP', 'SPEAKER', 'STAFF', 'SPONSOR']),
});

export type AddCoorganizerDto = z.infer<typeof addCoorganizerSchema>;
export type CreateSpeakerDto = z.infer<typeof createSpeakerSchema>;
export type CreateAgendaItemDto = z.infer<typeof createAgendaItemSchema>;
export type CreateQuestionDto = z.infer<typeof createQuestionSchema>;
export type UpdateQuestionDto = z.infer<typeof updateQuestionSchema>;
