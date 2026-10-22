import { describe, it, expect } from "vitest";
import { SCORE_RULES } from "@/lib/scoreRules";

describe("Score Rules Consistency", () => {
  it("should have matching point values for all actions", () => {
    // These values must match Backend/src/config/constants.ts SCORE_VALUES
    const expectedPoints: Record<string, number> = {
      'Complete your profile': 50,
      'Register for an event': 20,
      'Attend an event (check-in)': 50,
      'Make a connection': 10,
      'Activate your Founder Card': 100,
      'Scan a QR code': 5,
      'Earn a badge': 25,
      'First login': 10,
      'Add a profile photo': 15,
    };

    SCORE_RULES.forEach((rule) => {
      expect(rule.points).toBe(expectedPoints[rule.action]);
    });
  });

  it("should ensure Connect shows +10 points (fix for the reported bug)", () => {
    const connectRule = SCORE_RULES.find((r) => r.action === 'Make a connection');
    expect(connectRule).toBeDefined();
    expect(connectRule?.points).toBe(10);
  });

  it("should ensure Attend event shows +50 points", () => {
    const attendRule = SCORE_RULES.find((r) => r.action === 'Attend an event (check-in)');
    expect(attendRule).toBeDefined();
    expect(attendRule?.points).toBe(50);
  });

  it("should ensure Profile complete shows +50 points", () => {
    const profileRule = SCORE_RULES.find((r) => r.action === 'Complete your profile');
    expect(profileRule).toBeDefined();
    expect(profileRule?.points).toBe(50);
  });
});
