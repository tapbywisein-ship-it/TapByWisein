import {
  Cpu,
  TrendingUp,
  Palette,
  HeartPulse,
  Sparkles,
  Music,
  Trophy,
  Utensils,
  Rocket,
  Brain,
  Handshake,
  Mic,
  Code2,
  MoreHorizontal,
  type LucideIcon,
} from 'lucide-react';

export interface EventCategoryDefinition {
  id: string;
  label: string;
  icon: LucideIcon;
  description?: string;
}

export const EVENT_CATEGORIES: EventCategoryDefinition[] = [
  { id: 'tech', label: 'Tech', icon: Cpu, description: 'Technology, software, and engineering' },
  { id: 'ai', label: 'AI & Data', icon: Brain, description: 'Artificial Intelligence, ML, and Data' },
  { id: 'startup', label: 'Startup', icon: Rocket, description: 'Founders, early-stage, and pitch events' },
  { id: 'business', label: 'Business', icon: TrendingUp, description: 'Finance, sales, marketing, and leadership' },
  { id: 'design', label: 'Design', icon: Palette, description: 'UI/UX, graphic design, and product design' },
  { id: 'social', label: 'Social & Networking', icon: Handshake, description: 'Mixers, meetups, and networking sessions' },
  { id: 'hackathon', label: 'Hackathons', icon: Code2, description: 'Buildathons, coding sprints, and demos' },
  { id: 'workshop', label: 'Workshops', icon: Mic, description: 'Hands-on masterclasses and training' },
  { id: 'health', label: 'Health & Wellness', icon: HeartPulse, description: 'Fitness, mental health, and wellness' },
  { id: 'arts', label: 'Arts & Culture', icon: Music, description: 'Music, creative arts, and performances' },
  { id: 'sports', label: 'Sports & Fitness', icon: Trophy, description: 'Tournaments, matches, and activities' },
  { id: 'food', label: 'Food & Drinks', icon: Utensils, description: 'Dining, tasting, and casual get-togethers' },
  { id: 'other', label: 'Other', icon: MoreHorizontal, description: 'General and uncategorized events' },
];

export const CATEGORY_IDS = EVENT_CATEGORIES.map((c) => c.id);
export const CATEGORY_LABELS = EVENT_CATEGORIES.map((c) => c.label);

/**
 * Normalizes any category string (from legacy data, label, or id) to a matching standard category.
 */
export function getCategoryByIdOrLabel(value?: string | null): EventCategoryDefinition | undefined {
  if (!value) return undefined;
  const clean = value.trim().toLowerCase();
  return EVENT_CATEGORIES.find(
    (c) => c.id.toLowerCase() === clean || c.label.toLowerCase() === clean,
  );
}

/**
 * Returns a display-friendly label for any category string.
 */
export function formatCategoryLabel(value?: string | null): string {
  if (!value) return '';
  const match = getCategoryByIdOrLabel(value);
  return match ? match.label : value;
}

