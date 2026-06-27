// ────────────────────────────────────────────────────────────────
// Gamification — Boss Battle / Weekly Review System
// Pure functions: no side effects, no storage reads
// ────────────────────────────────────────────────────────────────

import type { BossBattle, TaskResult } from '$lib/types';
import { BOSS_BATTLE_MULTIPLIER, STREAK_BOSS_BATTLE_DAY } from '$lib/constants';

// ─── Boss Battle Calculation ───

/**
 * Calculate the boss battle outcome for a weekly review.
 *
 * Rules:
 * - Boss battle happens on Sunday (day 7 of the week)
 * - Pass condition: completed tasks >= weekly goal
 * - Win → 1.5× XP multiplier for the next week
 * - Loss → normal (1.0×) XP
 * - Bonus XP = base XP × (multiplier − 1)
 *
 * @param weekTasks All task results for the week (completed or not).
 * @param weekGoal Number of tasks the user committed to complete this week.
 * @param week Week number (1-indexed).
 * @returns Boss battle result (without `id` / `completedAt` — add at storage layer).
 *
 * @example
 * calcBossBattle(weekResults, 10, 5)
 * // completed=true if >= 10 tasks done
 */
export function calcBossBattle(
  weekTasks: TaskResult[],
  weekGoal: number,
  week: number
): Omit<BossBattle, 'id' | 'completedAt'> {
  const completedTasks = weekTasks.filter((t) => t.completed).length;
  const passCondition = completedTasks >= weekGoal;
  const xpMultiplier = passCondition ? BOSS_BATTLE_MULTIPLIER : 1.0;

  // Calculate bonus XP: the extra amount beyond normal XP
  const baseXpForWeek = weekTasks
    .filter((t) => t.completed)
    .reduce((sum, t) => sum + (t.xpAwarded || 0), 0);

  const bonusXp = passCondition
    ? Math.round(baseXpForWeek * (BOSS_BATTLE_MULTIPLIER - 1.0))
    : 0;

  return {
    week,
    completed: passCondition,
    tasksCompleted: completedTasks,
    totalTasks: weekGoal,
    xpMultiplier,
    bonusXpAwarded: bonusXp
  };
}

// ─── Weekly Goal ───

/**
 * Calculate the weekly goal from an array of tasks.
 * The goal is the total number of tasks scheduled for the week.
 */
export function calcWeeklyGoal(weekTasks: TaskResult[]): number {
  return weekTasks.length;
}

/**
 * Calculate the minimum completion count needed to pass the boss battle.
 * Default: 80% of weekly tasks must be completed.
 */
export function calcPassThreshold(weekTasks: TaskResult[], threshold = 0.8): number {
  return Math.ceil(weekTasks.length * threshold);
}

// ─── Multiplier ───

/**
 * Apply the boss battle XP multiplier to a base XP amount.
 */
export function applyBossMultiplier(baseXp: number, won: boolean): number {
  return won ? Math.round(baseXp * BOSS_BATTLE_MULTIPLIER) : baseXp;
}

// ─── Day Check ───

/**
 * Determine if today is boss battle day (Sunday).
 */
export function isBossBattleDay(today: Date = new Date()): boolean {
  return today.getDay() === 0;
}

/**
 * Get the day of the week for boss battle (0 = Sunday).
 */
export function getBossBattleDay(): number {
  return 0; // Sunday
}

// ─── Formatting ───

/**
 * Format a boss battle result for display.
 */
export function formatBossBattleResult(
  result: Omit<BossBattle, 'id' | 'completedAt'>
): string {
  const ratio = `${result.tasksCompleted}/${result.totalTasks}`;
  if (result.completed) {
    return `🏆 Boss Battle WON! (${ratio} tasks) — ${result.xpMultiplier}× XP for next week!`;
  }
  return `💀 Boss Battle lost (${ratio} tasks). Next week at normal XP.`;
}
