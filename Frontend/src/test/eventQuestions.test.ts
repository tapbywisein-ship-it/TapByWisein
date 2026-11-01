import { describe, it, expect } from 'vitest';
import { toAnswerList, unansweredRequired } from '@/lib/eventQuestions';
import type { EventQuestion } from '@/services/events.service';

const q = (id: string, required: boolean): EventQuestion => ({
  id,
  eventId: 'e1',
  prompt: `Question ${id}`,
  type: 'TEXT',
  options: null,
  required,
  position: 0,
});

describe('eventQuestions', () => {
  it('lists required questions that are unanswered or only spaces', () => {
    const questions = [q('a', true), q('b', true), q('c', false)];
    expect(unansweredRequired(questions, { a: 'Acme', b: '   ' }).map((x) => x.id)).toEqual(['b']);
  });

  it('has nothing missing when there are no questions', () => {
    expect(unansweredRequired(undefined, {})).toEqual([]);
  });

  it('sends only non-empty answers', () => {
    expect(toAnswerList({ a: 'Acme', b: '  ', c: '' })).toEqual([{ questionId: 'a', answer: 'Acme' }]);
  });
});
