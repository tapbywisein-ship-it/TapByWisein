/**
 * "Days left to register" for an event. Prefers the explicit
 * registrationDeadline; falls back to the event start date when the organizer
 * didn't set one. Shared by the Events and Discover cards so the countdown
 * reads identically everywhere.
 */
export function registrationCountdown(startDate: string, registrationDeadline?: string | null) {
  const deadline = registrationDeadline ? new Date(registrationDeadline) : new Date(startDate);
  const days = Math.ceil((deadline.getTime() - Date.now()) / 86_400_000);
  const closed = days < 0;
  const label = days > 1 ? `${days} days left` : days === 1 ? '1 day left' : days === 0 ? 'Last day' : 'Ended';
  const urgent = days >= 0 && days <= 3;
  return { days, closed, label, urgent };
}

/**
 * True once an event is over. Uses the end date (falling back to the start
 * date), the same rule My Calendar uses, so a booked event stops counting as
 * "upcoming" after it finishes even if the attendee was never checked in.
 */
export function hasEventEnded(event?: { startDate: string; endDate?: string | null } | null) {
  if (!event) return false;
  return new Date(event.endDate || event.startDate).getTime() < Date.now();
}
