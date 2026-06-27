// ────────────────────────────────────────────────────────────────
// Tests: Boss Battle / Weekly Review System
// Scenarios: H4 (boss battle outcome)
// ────────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest';
import {
  calcBossBattle,
  calcWeeklyGoal,
  calcPassThreshold,
  applyBossMultiplier,
  isBossBattleDay
} from '$lib/gamification/boss-battle';
import type { TaskResult } from '$lib/types';

// ─── Helpers ───

function makeResult(completed: boolean, xp = 10): TaskResult {
  return {
    id: `res-${Math.random()}`,
    taskId: 'task-1',
    dayId: 'day-1',
    completed,
    xpAwarded: xp,
    timeSpentMin: 15,
    discipline: 'english',
    difficulty: 'medium',
    completedAt: new Date().toISOString(),
    skipped: false
  };
}

// ─── calcBossBattle ───

describe('calcBossBattle', () => {
  // H4: Boss battle outcome
  it('H4: wins battle when tasks completed meet weekly goal', () => {
    const weekTasks = [
      makeResult(true), makeResult(true), makeResult(true),
      makeResult(true), makeResult(true), makeResult(false)
    ];

    const result = calcBossBattle(weekTasks, 5, 1);
    expect(result.completed).toBe(true);
    expect(result.xpMultiplier).toBe(1.5);
    expect(result.tasksCompleted).toBe(5);
    expect(result.totalTasks).toBe(5);
  });

  it('loses battle when tasks completed are below goal', () => {
    const weekTasks = [
      makeResult(true), makeResult(true), makeResult(true),
      makeResult(false), makeResult(false), makeResult(false)
    ];

    const result = calcBossBattle(weekTasks, 5, 1);
    expect(result.completed).toBe(false);
    expect(result.xpMultiplier).toBe(1.0);
    expect(result.tasksCompleted).toBe(3);
  });

  it('awards bonus XP on win', () => {
    const weekTasks = [
      makeResult(true, 50), makeResult(true, 25), makeResult(true, 25),
      makeResult(true, 10), makeResult(true, 10)
    ];

    const result = calcBossBattle(weekTasks, 5, 2);
    // baseXp = 50+25+25+10+10 = 120
    // bonus = 120 * 0.5 = 60
    expect(result.completed).toBe(true);
    expect(result.bonusXpAwarded).toBe(60); // 120 * 0.5
  });

  it('awards 0 bonus XP on loss', () => {
    const result = calcBossBattle([makeResult(false)], 5, 1);
    expect(result.bonusXpAwarded).toBe(0);
  });

  it('wins even with exactly the goal met', () => {
    const weekTasks = Array.from({ length: 5 }, () => makeResult(true));
    const result = calcBossBattle(weekTasks, 5, 1);
    expect(result.completed).toBe(true);
  });

  it('handles empty tasks array', () => {
    const result = calcBossBattle([], 0, 1);
    expect(result.completed).toBe(true); // 0 >= 0
    expect(result.xpMultiplier).toBe(1.5);
    expect(result.bonusXpAwarded).toBe(0);
  });
});

// ─── calcWeeklyGoal ───

describe('calcWeeklyGoal', () => {
  it('returns task count as goal', () => {
    const tasks = [makeResult(false), makeResult(false), makeResult(false)];
    expect(calcWeeklyGoal(tasks)).toBe(3);
  });
});

// ─── calcPassThreshold ───

describe('calcPassThreshold', () => {
  it('returns 80% of tasks by default', () => {
    expect(calcPassThreshold([...Array(10)])).toBe(8);
  });

  it('rounds up', () => {
    expect(calcPassThreshold([...Array(3)])).toBe(3); // ceil(2.4)
  });
});

// ─── applyBossMultiplier ───

describe('applyBossMultiplier', () => {
  it('applies 1.5x multiplier when won', () => {
    expect(applyBossMultiplier(100, true)).toBe(150);
  });

  it('returns same XP when lost', () => {
    expect(applyBossMultiplier(100, false)).toBe(100);
  });

  it('rounds to integer', () => {
    expect(applyBossMultiplier(33, true)).toBe(50); // 33 * 1.5 = 49.5 → 50
  });
});

// ─── isBossBattleDay ───

describe('isBossBattleDay', () => {
  it('returns true for Sunday', () => {
    // 2026-06-28 is a Sunday
    const sunday = new Date('2026-06-28T12:00:00');
    expect(isBossBattleDay(sunday)).toBe(true);
  });

  it('returns false for Monday', () => {
    const monday = new Date('2026-06-29T12:00:00');
    expect(isBossBattleDay(monday)).toBe(false);
  });

  it('returns false for Wednesday', () => {
    const wednesday = new Date('2026-06-24T12:00:00');
    expect(isBossBattleDay(wednesday)).toBe(false);
  });
});
