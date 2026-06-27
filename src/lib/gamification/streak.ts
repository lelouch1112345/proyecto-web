// ────────────────────────────────────────────────────────────────
// Gamification — Streak System
// Pure functions: no side effects, no storage reads
// ────────────────────────────────────────────────────────────────

import type { Streak } from '$lib/types';
import { STREAK_FREEZE_LIMIT } from '$lib/constants';

// ─── Streak Calculation ───

export interface StreakResult {
  current: number;
  longest: number;
  lastDate: string;
  missedDays: string[];
  freezeUsed: boolean;
}

/**
 * Calculate streak state from a history of active dates.
 *
 * @param history ISO date strings for days with activity (sorted ascending).
 * @param today ISO date string for today (YYYY-MM-DD).
 * @param freezeAvailable Number of streak freezes available.
 * @returns Computed streak state.
 *
 * @example
 * calcStreak(['2026-06-20', '2026-06-21', '2026-06-22'], '2026-06-22', 3)
 * // => { current: 3, longest: 3, lastDate: '2026-06-22', missedDays: [], freezeUsed: false }
 */
export function calcStreak(
  history: string[],
  today: string,
  freezeAvailable: number = 0
): StreakResult {
  if (history.length === 0) {
    return { current: 0, longest: 0, lastDate: '', missedDays: [], freezeUsed: false };
  }

  const sorted = [...history].sort();
  const uniqueDays = [...new Set(sorted)].map((d) => d.split('T')[0]);
  const todayDate = today.split('T')[0];

  // Find the longest streak by scanning all dates
  let longest = 0;
  let temp = 1;
  for (let i = 1; i < uniqueDays.length; i++) {
    const diff = daysBetween(uniqueDays[i - 1], uniqueDays[i]);
    if (diff === 1) {
      temp++;
    } else {
      longest = Math.max(longest, temp);
      temp = 1;
    }
  }
  longest = Math.max(longest, temp);

  // Calculate current streak from the end
  let current = 0;
  let freezeUsed = false;

  if (uniqueDays.length > 0) {
    const lastActive = uniqueDays[uniqueDays.length - 1];
    const diffToToday = daysBetween(lastActive, todayDate);

    if (diffToToday === 0) {
      // Active today — count back
      current = 1;
      for (let i = uniqueDays.length - 2; i >= 0; i--) {
        const gap = daysBetween(uniqueDays[i], uniqueDays[i + 1]);
        if (gap === 1) current++;
        else break;
      }
    } else if (diffToToday === 1) {
      // Last active yesterday — still consecutive, count back
      current = 1;
      for (let i = uniqueDays.length - 2; i >= 0; i--) {
        const gap = daysBetween(uniqueDays[i], uniqueDays[i + 1]);
        if (gap === 1) current++;
        else break;
      }
    } else if (diffToToday === 2 && freezeAvailable > 0) {
      // One day gap — use freeze
      freezeUsed = true;
      current = 1;
      for (let i = uniqueDays.length - 2; i >= 0; i--) {
        const gap = daysBetween(uniqueDays[i], uniqueDays[i + 1]);
        if (gap === 1) current++;
        else break;
      }
    }
    // else: gap too big, current = 0
  }

  // Find missed days in the current streak gap
  const missedDays: string[] = [];
  if (freezeUsed) {
    const lastActive = uniqueDays[uniqueDays.length - 1];
    const missDate = addDays(lastActive, 1);
    if (missDate < todayDate) {
      missedDays.push(missDate);
    }
  }

  return {
    current,
    longest,
    lastDate: uniqueDays.length > 0 ? uniqueDays[uniqueDays.length - 1] : '',
    missedDays,
    freezeUsed
  };
}

// ─── Streak Freeze ───

/**
 * Apply a streak freeze (consume one freeze token).
 * Returns the updated streak without mutating the input.
 */
export function applyStreakFreeze(streak: Streak): Streak {
  if (streak.freezeAvailable <= 0) return streak;
  return {
    ...streak,
    freezeAvailable: streak.freezeAvailable - 1
  };
}

/**
 * Check whether a streak freeze should be consumed.
 * Returns true if the last activity was exactly 1 day before yesterday
 * (i.e. there's a 1-day gap that needs bridging).
 */
export function shouldUseFreeze(lastDate: string, today: string): boolean {
  if (!lastDate) return false;
  const diff = daysBetween(lastDate.split('T')[0], today.split('T')[0]);
  return diff === 2; // Exactly 2 day gap = yesterday was missed
}

// ─── Freeze Replenishment ───

/**
 * Replenish streak freezes (up to the limit).
 * Called after a perfect week or boss battle victory.
 */
export function replenishFreezes(currentFreezes: number): number {
  return Math.min(STREAK_FREEZE_LIMIT, currentFreezes + 1);
}

// ─── Helpers ───

/**
 * Calculate the number of calendar days between two ISO date strings.
 */
function daysBetween(a: string, b: string): number {
  const dateA = new Date(a + 'T00:00:00');
  const dateB = new Date(b + 'T00:00:00');
  return Math.round(Math.abs((dateB.getTime() - dateA.getTime()) / (1000 * 60 * 60 * 24)));
}

/**
 * Add days to an ISO date string.
 */
function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr + 'T00:00:00');
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}
