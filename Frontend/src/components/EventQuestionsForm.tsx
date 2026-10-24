import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select as UiSelect,
  SelectContent as UiSelectContent,
  SelectItem as UiSelectItem,
  SelectTrigger as UiSelectTrigger,
  SelectValue as UiSelectValue,
} from '@/components/ui/select';
import type { EventQuestion } from '@/services/events.service';
import type { AnswerMap } from '@/lib/eventQuestions';

/**
 * The host's custom registration questions. Shared by the quick-register
 * popup and the event page, so both ask them the same way.
 */
export const EventQuestionsForm = ({
  questions,
  answers,
  onChange,
  className = '',
}: {
  questions: EventQuestion[] | undefined;
  answers: AnswerMap;
  onChange: (next: AnswerMap) => void;
  className?: string;
}) => {
  if (!questions || questions.length === 0) return null;
  const set = (id: string, value: string) => onChange({ ...answers, [id]: value });

  return (
    <div className={`space-y-3 rounded-card border border-border bg-card/40 p-3 ${className}`}>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        A few questions from the host
      </p>
      {questions.map((q) => (
        <div key={q.id} className="space-y-1">
          <label htmlFor={`eq-${q.id}`} className="text-xs font-medium text-foreground">
            {q.prompt}
            {q.required && <span className="ml-0.5 text-rose-500">*</span>}
          </label>
          {q.type === 'TEXTAREA' ? (
            <Textarea
              id={`eq-${q.id}`}
              rows={2}
              value={answers[q.id] ?? ''}
              onChange={(e) => set(q.id, e.target.value)}
              required={q.required}
            />
          ) : q.type === 'SELECT' && (q.options?.length ?? 0) > 0 ? (
            <UiSelect value={answers[q.id] ?? ''} onValueChange={(v) => set(q.id, v)}>
              <UiSelectTrigger id={`eq-${q.id}`}>
                <UiSelectValue placeholder="Choose…" />
              </UiSelectTrigger>
              <UiSelectContent>
                {(q.options ?? []).map((opt) => (
                  <UiSelectItem key={opt} value={opt}>
                    {opt}
                  </UiSelectItem>
                ))}
              </UiSelectContent>
            </UiSelect>
          ) : (
            <Input
              id={`eq-${q.id}`}
              value={answers[q.id] ?? ''}
              onChange={(e) => set(q.id, e.target.value)}
              required={q.required}
            />
          )}
        </div>
      ))}
    </div>
  );
};
