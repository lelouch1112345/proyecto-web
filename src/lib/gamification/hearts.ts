// ────────────────────────────────────────────────────────────────
// Gamification — Heart System
// Pure functions: no side effects, no storage reads
// ────────────────────────────────────────────────────────────────

import type { Hearts } from '$lib/types';
import {
  MAX_HEARTS,
  GRACE_WINDOW_HOURS,
  HEART_RECOVERY_PERFECT_WEEKS
} from '$lib/constants';

// ─── Heart Calculation ───

export interface HeartParams {
  missedDays: number;
  perfectWeeks?: number;
  sleepHrs?: number;
}

/**
 * Calculate the new heart state based on current state and daily activity.
 * Pure function — returns a new Hearts object, no mutations.
 *
 * Rules:
 * - 5 ❤ max
 * - Lose 1 per missed day outside the 48h grace window
 * - Recharge 1 ❤ per perfect week (if no deductions that day)
 * - Recharge 1 ❤ if sleep ≥ 7h (if no deductions that day)
 * - Grace window extends with each day of activity
 * - Break mode (❤ = 0) disables heart tracking until hearts recover
 *
 * @example
 * calcHearts(
 *   { current: 5, max: 5, graceUntil: '2026-06-28T...', breakMode: false },
 *   { missedDays: 1, perfectWeeks: 0, sleepHrs: 8 }
 * )
 * // => { current: 4, ... }
 */
export function calcHearts(state: Hearts, params: HeartParams): Hearts {
  const { current, max, graceUntil, breakMode, lastMissedDate } = state;
  const { missedDays, perfectWeeks = 0, sleepHrs } = params;

  const now = new Date();
  const graceEnd = new Date(graceUntil);
  const isWithinGrace = now < graceEnd;

  // Determine heart deductions (only outside grace window)
  let deductions = 0;
  if (!isWithinGrace && missedDays > 0) {
    deductions = missedDays;
  }

  // Heart recovery from perfect weeks
  const weekRecoveries = Math.floor(perfectWeeks / HEART_RECOVERY_PERFECT_WEEKS);

  // Sleep recovery: +1 if sleep >= 7h and no deductions and not at max
  let sleepRecovery = false;
  if (
    sleepHrs !== undefined &&
    sleepHrs >= 7 &&
    deductions === 0 &&
    current < max
  ) {
    sleepRecovery = true;
  }

  // Calculate net hearts
  let newHearts = current - deductions + weekRecoveries + (sleepRecovery ? 1 : 0);
  newHearts = Math.max(0, Math.min(max, newHearts));

  // Extend grace window when user is active
  let newGraceUntil = graceUntil;
  if (missedDays === 0) {
    newGraceUntil = new Date(now.getTime() + GRACE_WINDOW_HOURS * 60 * 60 * 1000).toISOString();
  }

  // Track last missed date
  const newLastMissedDate =
    missedDays > 0
      ? now.toISOString().split('T')[0]
      : lastMissedDate;

  return {
    ...state,
    current: newHearts,
    graceUntil: newGraceUntil,
    breakMode: newHearts <= 0,
    lastMissedDate: newLastMissedDate
  };
}

// ─── Grace Window ───

/**
 * Check if the current time is within the grace window.
 */
export function isWithinGraceWindow(graceUntil: string): boolean {
  return new Date() < new Date(graceUntil);
}

// ─── Break Mode ───

/**
 * Check if the heart count triggers break mode (0 hearts).
 */
export function isBreakMode(hearts: number): boolean {
  return hearts <= 0;
}

// ─── Daily Processing ───

/**
 * Process heart state for a new day.
 * Call this once per day to check heart deductions/recovery.
 *
 * @param state Current heart state
 * @param wasActiveYesterday Whether the user completed any task yesterday
 * @param perfectWeeks Number of consecutive perfect weeks
 * @param sleepHrs Hours of sleep last night
 */
export function processDailyHearts(
  state: Hearts,
  wasActiveYesterday: boolean,
  perfectWeeks: number,
  sleepHrs: number
): Hearts {
  const missedDays = wasActiveYesterday ? 0 : 1;
  return calcHearts(state, { missedDays, perfectWeeks, sleepHrs });
}

// ─── Heart Projection ───

/**
 * Project heart state forward by N days.
 * Useful for showing "what if" scenarios.
 *
 * @param state Current heart state
 * @param totalDays Total days to project
 * @param activeDays How many of those days will be active
 * @param perfectWeeks How many perfect weeks in the projection
 */
export function projectHeartState(
  state: Hearts,
  totalDays: number,
  activeDays: number,
  perfectWeeks: number
): Hearts {
  const missedDays = totalDays - activeDays;
  return calcHearts(state, { missedDays, perfectWeeks });
}

// ─── Emergency Recovery ───

/**
 * Calculate heart state after a recovery.
 * Resets hearts to a specific value and extends the grace window.
 */
export function recoverHearts(
  state: Hearts,
  targetHearts: number
): Hearts {
  return {
    ...state,
    current: Math.min(state.max, Math.max(0, targetHearts)),
    graceUntil: new Date(Date.now() + GRACE_WINDOW_HOURS * 60 * 60 * 1000).toISOString(),
    breakMode: targetHearts <= 0,
    lastMissedDate: undefined
  };
}
