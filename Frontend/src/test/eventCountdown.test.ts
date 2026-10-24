import { describe, it, expect } from "vitest";
import { hasEventEnded } from "@/lib/eventCountdown";

const daysFromNow = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString();

describe("hasEventEnded", () => {
  it("is false for an event that has not started yet", () => {
    expect(hasEventEnded({ startDate: daysFromNow(2), endDate: daysFromNow(3) })).toBe(false);
  });

  it("is false while a multi-day event is still running", () => {
    expect(hasEventEnded({ startDate: daysFromNow(-1), endDate: daysFromNow(1) })).toBe(false);
  });

  it("is true once the end date has passed (e.g. ran 12-15 Oct, now later)", () => {
    expect(hasEventEnded({ startDate: daysFromNow(-5), endDate: daysFromNow(-2) })).toBe(true);
  });

  it("falls back to the start date when there is no end date", () => {
    expect(hasEventEnded({ startDate: daysFromNow(-1), endDate: null })).toBe(true);
    expect(hasEventEnded({ startDate: daysFromNow(1), endDate: null })).toBe(false);
  });

  it("is false when the event details are missing", () => {
    expect(hasEventEnded(undefined)).toBe(false);
  });
});
