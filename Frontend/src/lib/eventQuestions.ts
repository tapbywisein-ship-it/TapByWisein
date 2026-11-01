import type { EventQuestion } from '@/services/events.service';

/** Answers as typed in the form, keyed by question id. */
export type AnswerMap = Record<string, string>;

/** The answers to send with a registration: non-empty ones only. */
export const toAnswerList = (answers: AnswerMap) =>
  Object.entries(answers)
    .filter(([, v]) => v.trim())
    .map(([questionId, answer]) => ({ questionId, answer }));

/** Required questions that don't have an answer yet. */
export const unansweredRequired = (questions: EventQuestion[] | undefined, answers: AnswerMap) =>
  (questions ?? []).filter((q) => q.required && !(answers[q.id] ?? '').trim());
