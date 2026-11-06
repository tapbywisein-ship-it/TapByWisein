import { BadRequestError } from '@utils/errors';

/**
 * Throws if an event no longer takes sign-ups: after the organizer's
 * registration deadline (when one is set), or once the event has ended.
 * Called by every way an attendee can sign up: free registration, guest RSVP
 * and paid checkout (before any payment is taken). Organizers adding guests
 * themselves are not limited by this.
 */
export function assertRegistrationOpen(
  event: { registrationDeadline: Date | null; endDate: Date },
  now: Date = new Date()
): void {
  if (event.registrationDeadline && now > event.registrationDeadline) {
    throw new BadRequestError('Registration for this event has closed');
  }
  if (now > event.endDate) {
    throw new BadRequestError('This event has already ended');
  }
}
