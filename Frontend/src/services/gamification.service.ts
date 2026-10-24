import type { LucideIcon } from 'lucide-react';
import { apiFetch } from './api';
import { SCORE_RULES as LOCAL_SCORE_RULES } from '@/lib/scoreRules';

export interface GamificationData {
  id: string;
  userId: string;
  fkScore: number;
  level: number;
  createdAt: string;
  updatedAt: string;
}

export interface ScoreRule {
  action: string;
  points: number;
  icon: LucideIcon;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  earnedAt?: string;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  fkScore: number;
  level: number;
  profile?: {
    firstName: string;
    lastName: string;
    avatar?: string;
    company?: string;
  };
}

export interface ScoreHistoryEntry {
  id: string;
  action: string;
  points: number;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export const gamificationService = {
  async getMyScore() {
    return apiFetch<{ data: GamificationData }>('/gamification/me');
  },

  async getLeaderboard(page = 1, limit = 20) {
    return apiFetch<{ data: { leaderboard: LeaderboardEntry[]; pagination: unknown } }>(
      `/gamification/leaderboard?page=${page}&limit=${limit}`
    );
  },

  async getMyBadges() {
    return apiFetch<{ data: Badge[] }>('/gamification/badges/me');
  },

  async getAllBadges() {
    return apiFetch<{ data: Badge[] }>('/gamification/badges');
  },

  async getScoreHistory(page = 1, limit = 20) {
    // A paginated response: `data` is the list itself (sendPaginated).
    return apiFetch<{ data: ScoreHistoryEntry[]; pagination: unknown }>(
      `/gamification/history?page=${page}&limit=${limit}`
    );
  },

  async getScoreRules(): Promise<ScoreRule[]> {
    try {
      const res = await apiFetch<{ data: Record<string, number> }>('/gamification/rules');
      // Transform backend SCORE_VALUES to frontend SCORE_RULES format
      const backendRules = res.data;
      const mapping: Record<string, string> = {
        'Complete your profile': 'PROFILE_COMPLETE',
        'Register for an event': 'EVENT_REGISTERED',
        'Attend an event (check-in)': 'EVENT_ATTENDED',
        'Make a connection': 'CONNECTION_MADE',
        'Activate your Founder Card': 'FOUNDER_CARD_ACTIVE',
        'Scan a QR code': 'QR_SCAN',
        'Earn a badge': 'BADGE_EARNED',
        'First login': 'FIRST_LOGIN',
        'Add a profile photo': 'PROFILE_PHOTO_ADDED',
      };
      return LOCAL_SCORE_RULES.map((rule) => ({
        ...rule,
        points: backendRules[mapping[rule.action]] ?? rule.points,
      }));
    } catch (error) {
      // Fallback to local rules if backend is unavailable
      console.warn('Failed to fetch score rules from backend, using local fallback');
      return LOCAL_SCORE_RULES;
    }
  },
};
