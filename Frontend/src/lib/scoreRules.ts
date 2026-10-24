// Icons come from lucide-react, the same icon set used across the app,
// so they look the same on every device (emoji render differently per OS).
import { UserCheck, Ticket, CalendarCheck, Handshake, CreditCard, ScanLine, Award, LogIn, ImagePlus } from 'lucide-react';

export const SCORE_RULES = [
  { action: 'Complete your profile', points: 50, icon: UserCheck },
  { action: 'Register for an event', points: 20, icon: Ticket },
  { action: 'Attend an event (check-in)', points: 50, icon: CalendarCheck },
  { action: 'Make a connection', points: 10, icon: Handshake },
  { action: 'Activate your Founder Card', points: 100, icon: CreditCard },
  { action: 'Scan a QR code', points: 5, icon: ScanLine },
  { action: 'Earn a badge', points: 25, icon: Award },
  { action: 'First login', points: 10, icon: LogIn },
  { action: 'Add a profile photo', points: 15, icon: ImagePlus },
] as const;

export const LEVEL_THRESHOLDS = [
  { level: 1, minScore: 0, label: 'Newcomer' },
  { level: 2, minScore: 100, label: 'Explorer' },
  { level: 3, minScore: 250, label: 'Networker' },
  { level: 4, minScore: 500, label: 'Connector' },
  { level: 5, minScore: 1000, label: 'Influencer' },
  { level: 6, minScore: 1500, label: 'Builder' },
  { level: 7, minScore: 2500, label: 'Innovator' },
  { level: 8, minScore: 4000, label: 'Visionary' },
  { level: 9, minScore: 6000, label: 'Pioneer' },
  { level: 10, minScore: 10000, label: 'Legend' },
] as const;

/**
 * How far a score is between its level and the next one, using the real
 * LEVEL_THRESHOLDS above (same table as the backend). The FK Score page and
 * the Dashboard ring both use this so they always agree.
 * Example: 120 pts is Level 2 (starts at 100); Level 3 starts at 250, so
 * progress is (120 - 100) / (250 - 100) = 13%.
 */
export function levelProgress(score: number) {
  // The highest level whose starting score has been reached.
  const current =
    [...LEVEL_THRESHOLDS].reverse().find((t) => score >= t.minScore) ?? LEVEL_THRESHOLDS[0];
  const next = LEVEL_THRESHOLDS.find((t) => t.level === current.level + 1);

  // Already at the top level: nothing left to reach.
  if (!next) return { nextLevel: null, nextLevelScore: null, percent: 100 };

  const percent = ((score - current.minScore) / (next.minScore - current.minScore)) * 100;
  return {
    nextLevel: next.level,
    nextLevelScore: next.minScore,
    percent: Math.max(0, Math.min(100, percent)),
  };
}
