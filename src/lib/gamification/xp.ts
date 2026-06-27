// ────────────────────────────────────────────────────────────────
// Gamification — XP & Level System
// Pure functions: no side effects, no storage reads
// ────────────────────────────────────────────────────────────────

import type { Discipline, Difficulty, XpEvent } from '$lib/types';
import { DIFFICULTY_XP, DISCIPLINES, LEVEL_TITLES, MAX_LEVEL, MAX_XP } from '$lib/constants';

// ─── Constants ───

/** Base XP per task category */
export const CATEGORY_XP: Record<string, number> = {
  reading: 10,
  speaking: 15,
  listening: 10,
  writing: 15,
  vocab: 5,
  grammar: 10,
  theory: 10,
  practice: 10,
  'ear-training': 10
} as const;

/** Maximum XP earnable per day from task completion */
export const DAILY_XP_CAP = 200;

/** Streak milestone bonuses: [streakDays, bonusXp] */
export const STREAK_MILESTONES: [number, number][] = [
  [7, 50],
  [14, 100],
  [21, 150],
  [30, 250],
  [60, 500],
  [84, 1000]
];

// ─── Helpers ───

/**
 * Get the discipline XP multiplier.
 */
export function getMultiplier(discipline: Discipline): number {
  const config = DISCIPLINES.find((d) => d.id === discipline);
  return config?.xpMultiplier ?? 1.0;
}

// ─── XP Calculation ───

/**
 * Calculate XP awarded for completing a task based on difficulty + discipline.
 * Formula: difficultyBase × disciplineMultiplier
 *
 * @throws {RangeError} If difficulty is not valid
 *
 * @example
 * calcXP('medium', 'english') // => 25
 * calcXP('hard', 'japanese')  // => 60 (50 × 1.2)
 */
export function calcXP(difficulty: Difficulty, discipline: Discipline): number {
  const baseXp = DIFFICULTY_XP[difficulty];
  if (baseXp === undefined) {
    throw new RangeError(`Invalid difficulty: ${difficulty}`);
  }
  const multiplier = getMultiplier(discipline);
  return Math.round(baseXp * multiplier);
}

/**
 * Calculate XP based on task category (alternative to difficulty-based).
 * Falls back to 10 if category is unknown.
 */
export function calcXpByCategory(category: string, discipline: Discipline): number {
  const baseXp = CATEGORY_XP[category] ?? 10;
  const multiplier = getMultiplier(discipline);
  return Math.round(baseXp * multiplier);
}

// ─── Level System ───

/**
 * Get the level data for a given total XP.
 * Returns the current level, title, and XP thresholds.
 */
export function getLevel(totalXp: number): {
  level: number;
  title: string;
  xpRequired: number;
  xpRequiredCumulative: number;
} {
  const clamped = Math.max(0, Math.min(totalXp, MAX_XP));

  // Walk backwards: find the highest level whose threshold we've met
  for (let i = LEVEL_TITLES.length - 1; i >= 0; i--) {
    if (clamped >= LEVEL_TITLES[i].xpRequiredCumulative) {
      return { ...LEVEL_TITLES[i] };
    }
  }

  // Fallback: level 1
  return { ...LEVEL_TITLES[0] };
}

/**
 * Calculate progress percentage (0–100) toward the next level.
 */
export function getLevelProgress(totalXp: number): number {
  const clamped = Math.max(0, Math.min(totalXp, MAX_XP));

  // Already at max level
  const lastLevel = LEVEL_TITLES[LEVEL_TITLES.length - 1];
  if (clamped >= lastLevel.xpRequiredCumulative) return 100;

  // Find current and next level
  let currentLevel = LEVEL_TITLES[0];
  let nextLevel = LEVEL_TITLES[1];

  for (let i = 0; i < LEVEL_TITLES.length; i++) {
    if (clamped >= LEVEL_TITLES[i].xpRequiredCumulative) {
      currentLevel = LEVEL_TITLES[i];
      nextLevel = LEVEL_TITLES[Math.min(i + 1, LEVEL_TITLES.length - 1)];
    }
  }

  const xpInLevel = clamped - currentLevel.xpRequiredCumulative;
  const xpForNext = nextLevel.xpRequiredCumulative - currentLevel.xpRequiredCumulative;

  return Math.round((xpInLevel / xpForNext) * 100);
}

/**
 * Check if the player has just leveled up (xpBefore vs xpAfter).
 */
export function didLevelUp(xpBefore: number, xpAfter: number): boolean {
  const levelBefore = getLevel(xpBefore).level;
  const levelAfter = getLevel(xpAfter).level;
  return levelAfter > levelBefore;
}

/**
 * Get the XP required to reach a specific level.
 */
export function getXpForLevel(level: number): number {
  const found = LEVEL_TITLES.find((l) => l.level === level);
  return found?.xpRequiredCumulative ?? MAX_XP;
}

// ─── Daily XP Cap ───

/**
 * Check if adding `newXp` would exceed the daily XP cap.
 * Returns `true` if the cap would be exceeded (i.e. new XP should be capped/rejected).
 */
export function checkDailyXpCap(xpEventsToday: XpEvent[], newXp: number): boolean {
  const todayTotal = xpEventsToday.reduce((sum, e) => sum + e.amount, 0);
  return todayTotal + newXp > DAILY_XP_CAP;
}

/**
 * Calculate the actual XP that can be earned given the daily cap.
 * Returns the amount that can actually be awarded (might be less than requested).
 */
export function applyDailyXpCap(xpEventsToday: XpEvent[], requestedXp: number): number {
  const todayTotal = xpEventsToday.reduce((sum, e) => sum + e.amount, 0);
  const remaining = DAILY_XP_CAP - todayTotal;
  if (remaining <= 0) return 0;
  return Math.min(requestedXp, remaining);
}

// ─── Streak Milestone Bonuses ───

/**
 * Get the bonus XP for reaching a specific streak milestone.
 * Returns 0 if the current streak is not a milestone.
 */
export function getStreakMilestoneBonus(streakDays: number): number {
  for (const [days, bonus] of STREAK_MILESTONES) {
    if (streakDays === days) return bonus;
  }
  return 0;
}

/**
 * Check if the current streak is a milestone day.
 * Returns the milestone number or null.
 */
export function isStreakMilestone(streakDays: number): number | null {
  const milestoneDays = STREAK_MILESTONES.map(([d]) => d);
  return milestoneDays.includes(streakDays) ? streakDays : null;
}

/**
 * Get the next streak milestone number.
 */
export function getNextStreakMilestone(streakDays: number): number | null {
  for (const [days] of STREAK_MILESTONES) {
    if (streakDays < days) return days;
  }
  return null;
}
