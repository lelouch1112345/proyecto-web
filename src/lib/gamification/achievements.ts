// ────────────────────────────────────────────────────────────────
// Gamification — Achievement System
// Pure functions: no side effects, no storage reads
// ────────────────────────────────────────────────────────────────

import type {
  Achievement,
  AchievementCondition,
  XpEvent,
  TaskResult
} from '$lib/types';
import { ACHIEVEMENT_DEFINITIONS } from '$lib/constants';

// ─── Achievement Checking ───

export interface AchievementContext {
  events: XpEvent[];
  results: TaskResult[];
  currentStreak: number;
  totalCheckIns: number;
  perfectWeeks: number;
  recoveryCount: number;
  disciplineTaskCounts: Record<string, number>;
  heartSaverDays: number;
}

/**
 * Check all achievements against current player state.
 * Returns updated achievements with progress and unlock status.
 *
 * Pure function — does not mutate the input array.
 *
 * @example
 * checkAchievements(achievements, { events, results, currentStreak: 7, ... })
 * // => Achievement[] with progress and unlock updated
 */
export function checkAchievements(
  achievements: Achievement[],
  ctx: AchievementContext
): Achievement[] {
  const { events, results, currentStreak, totalCheckIns, perfectWeeks, recoveryCount, disciplineTaskCounts, heartSaverDays } = ctx;

  return achievements.map((achievement) => {
    if (achievement.unlocked) return achievement;

    const progress = calcSingleProgress(
      achievement.condition,
      events,
      results,
      currentStreak,
      totalCheckIns,
      perfectWeeks,
      recoveryCount,
      disciplineTaskCounts,
      heartSaverDays
    );

    const unlocked = progress >= 100;

    return {
      ...achievement,
      progress: Math.min(100, Math.max(0, progress)),
      unlocked,
      unlockedAt: unlocked
        ? new Date().toISOString()
        : achievement.unlockedAt
    };
  });
}

/**
 * Calculate progress (0–100) for a single achievement condition.
 */
function calcSingleProgress(
  condition: AchievementCondition,
  events: XpEvent[],
  results: TaskResult[],
  currentStreak: number,
  totalCheckIns: number,
  perfectWeeks: number,
  recoveryCount: number,
  disciplineTaskCounts: Record<string, number>,
  heartSaverDays: number
): number {
  const { type, target, discipline } = condition;

  if (target <= 0) return 0;

  let current: number;

  switch (type) {
    case 'total_xp':
      current = events.reduce((sum, e) => sum + e.amount, 0);
      break;

    case 'streak_days':
      current = currentStreak;
      break;

    case 'tasks_completed':
      current = results.filter((r) => r.completed).length;
      break;

    case 'discipline_tasks': {
      if (discipline) {
        current =
          disciplineTaskCounts[discipline] ??
          results.filter((r) => r.completed && r.discipline === discipline).length;
      } else {
        current = 0;
      }
      break;
    }

    case 'perfect_weeks':
      current = perfectWeeks;
      break;

    case 'check_ins':
      current = totalCheckIns;
      break;

    case 'hearts_saved':
      current = heartSaverDays;
      break;

    case 'recoveries':
      current = recoveryCount;
      break;

    default:
      return 0;
  }

  return Math.round((current / target) * 100);
}

// ─── Newly Unlocked Detection ───

/**
 * Compare before/after achievement states and return newly unlocked ones.
 */
export function getNewlyUnlocked(
  before: Achievement[],
  after: Achievement[]
): Achievement[] {
  const beforeMap = new Map(before.map((a) => [a.id, a]));
  return after.filter((a) => a.unlocked && !beforeMap.get(a.id)?.unlocked);
}

/**
 * Get the count of newly unlocked achievements.
 */
export function countNewlyUnlocked(
  before: Achievement[],
  after: Achievement[]
): number {
  return getNewlyUnlocked(before, after).length;
}

// ─── Discipline Counts ───

/**
 * Calculate completed task counts per discipline.
 */
export function calcDisciplineCounts(
  results: TaskResult[]
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const r of results) {
    if (r.completed) {
      counts[r.discipline] = (counts[r.discipline] ?? 0) + 1;
    }
  }
  return counts;
}

// ─── Initial State ───

/**
 * Create the initial achievement state from definitions.
 * All achievements start as locked with 0% progress.
 */
export function createInitialAchievements(): Achievement[] {
  return ACHIEVEMENT_DEFINITIONS.map((def) => ({
    id: def.id,
    name: def.name,
    description: def.description,
    icon: def.icon,
    category: def.category,
    condition: { ...def.condition },
    progress: 0,
    unlocked: false,
    unlockedAt: undefined
  }));
}
