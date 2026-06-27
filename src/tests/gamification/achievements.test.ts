// ────────────────────────────────────────────────────────────────
// Tests: Achievement System
// ────────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest';
import {
  checkAchievements,
  getNewlyUnlocked,
  countNewlyUnlocked,
  calcDisciplineCounts,
  createInitialAchievements
} from '$lib/gamification/achievements';
import type { Achievement, XpEvent, TaskResult } from '$lib/types';
import type { AchievementContext } from '$lib/gamification/achievements';

// ─── Helpers ───

function makeEvent(amount: number, discipline = 'english'): XpEvent {
  return {
    id: `xp-${Math.random()}`,
    date: '2026-06-26',
    amount,
    source: 'task_completion',
    discipline: discipline as never,
    createdAt: new Date().toISOString()
  };
}

function makeResult(discipline = 'english', completed = true): TaskResult {
  return {
    id: `res-${Math.random()}`,
    taskId: 'task-1',
    dayId: 'day-1',
    completed,
    xpAwarded: 10,
    timeSpentMin: 15,
    discipline: discipline as never,
    difficulty: 'medium',
    completedAt: new Date().toISOString(),
    skipped: false
  };
}

function makeAchievement(overrides: Partial<Achievement> = {}): Achievement {
  return {
    id: 'first-steps',
    name: 'First Steps',
    description: 'Complete your first task',
    icon: '👶',
    category: 'milestone',
    condition: { type: 'tasks_completed', target: 1 },
    progress: 0,
    unlocked: false,
    ...overrides
  };
}

function defaultCtx(overrides: Partial<AchievementContext> = {}): AchievementContext {
  return {
    events: [],
    results: [],
    currentStreak: 0,
    totalCheckIns: 0,
    perfectWeeks: 0,
    recoveryCount: 0,
    disciplineTaskCounts: {},
    heartSaverDays: 0,
    ...overrides
  };
}

// ─── checkAchievements ───

describe('checkAchievements', () => {
  it('unlocks "First Steps" when 1 task is completed', () => {
    const achievements = [makeAchievement()];
    const ctx = defaultCtx({
      results: [makeResult()]
    });

    const result = checkAchievements(achievements, ctx);
    expect(result[0].unlocked).toBe(true);
    expect(result[0].progress).toBe(100);
  });

  it('does not unlock when target not met', () => {
    const achievements = [makeAchievement()]; // tasks_completed: 1
    const ctx = defaultCtx({ results: [] });

    const result = checkAchievements(achievements, ctx);
    expect(result[0].unlocked).toBe(false);
    expect(result[0].progress).toBe(0);
  });

  it('unlocks XP milestone achievements', () => {
    const achievements = [
      makeAchievement({
        id: 'xp-1000',
        condition: { type: 'total_xp', target: 1000 }
      })
    ];
    const ctx = defaultCtx({
      events: Array.from({ length: 100 }, () => makeEvent(10))
    });

    const result = checkAchievements(achievements, ctx);
    expect(result[0].unlocked).toBe(true);
    expect(result[0].progress).toBe(100);
  });

  it('unlocks streak achievements', () => {
    const achievements = [
      makeAchievement({
        id: 'week-1',
        condition: { type: 'streak_days', target: 7 }
      })
    ];
    const ctx = defaultCtx({ currentStreak: 7 });

    const result = checkAchievements(achievements, ctx);
    expect(result[0].unlocked).toBe(true);
  });

  it('unlocks discipline-specific achievement', () => {
    const achievements = [
      makeAchievement({
        id: 'english-dedication',
        condition: { type: 'discipline_tasks', target: 30, discipline: 'english' }
      })
    ];
    const ctx = defaultCtx({
      results: Array.from({ length: 30 }, () => makeResult('english'))
    });

    const result = checkAchievements(achievements, ctx);
    expect(result[0].unlocked).toBe(true);
  });

  it('uses disciplineTaskCounts from context if provided', () => {
    const achievements = [
      makeAchievement({
        id: 'english-dedication',
        condition: { type: 'discipline_tasks', target: 30, discipline: 'english' }
      })
    ];
    const ctx = defaultCtx({
      results: [], // empty, but context has counts
      disciplineTaskCounts: { english: 30 }
    });

    const result = checkAchievements(achievements, ctx);
    expect(result[0].unlocked).toBe(true);
  });

  it('unlocks perfect week achievement', () => {
    const achievements = [
      makeAchievement({
        id: 'perfect-week',
        condition: { type: 'perfect_weeks', target: 1 }
      })
    ];
    const ctx = defaultCtx({ perfectWeeks: 1 });

    const result = checkAchievements(achievements, ctx);
    expect(result[0].unlocked).toBe(true);
  });

  it('unlocks check-in achievement', () => {
    const achievements = [
      makeAchievement({
        id: 'checkin-master',
        condition: { type: 'check_ins', target: 30 }
      })
    ];
    const ctx = defaultCtx({ totalCheckIns: 30 });

    const result = checkAchievements(achievements, ctx);
    expect(result[0].unlocked).toBe(true);
  });

  it('unlocks recovery achievement (Fénix)', () => {
    const achievements = [
      makeAchievement({
        id: 'fenix',
        condition: { type: 'recoveries', target: 1 }
      })
    ];
    const ctx = defaultCtx({ recoveryCount: 1 });

    const result = checkAchievements(achievements, ctx);
    expect(result[0].unlocked).toBe(true);
  });

  it('calculates progress percentage for partial achievement', () => {
    const achievements = [
      makeAchievement({
        id: 'xp-5000',
        condition: { type: 'total_xp', target: 5000 }
      })
    ];
    const ctx = defaultCtx({
      events: Array.from({ length: 25 }, () => makeEvent(10)) // 250 XP
    });

    const result = checkAchievements(achievements, ctx);
    expect(result[0].unlocked).toBe(false);
    expect(result[0].progress).toBe(5); // 250/5000 = 5%
  });

  it('does not re-check already unlocked achievements', () => {
    const alreadyUnlocked = makeAchievement({ unlocked: true, unlockedAt: '2026-06-01T00:00:00.000Z' });
    const achievements = [alreadyUnlocked];
    const ctx = defaultCtx({ results: [makeResult()] });

    const result = checkAchievements(achievements, ctx);
    // Should not re-set unlockedAt
    expect(result[0].unlockedAt).toBe('2026-06-01T00:00:00.000Z');
  });

  it('sets progress to 0 for unsupported condition type', () => {
    const achievements = [
      makeAchievement({
        condition: { type: 'nonexistent' as never, target: 1 }
      })
    ];
    const ctx = defaultCtx();

    const result = checkAchievements(achievements, ctx);
    expect(result[0].progress).toBe(0);
  });

  it('handles heart_saver achievement', () => {
    const achievements = [
      makeAchievement({
        id: 'heart-saver',
        condition: { type: 'hearts_saved', target: 14 }
      })
    ];
    const ctx = defaultCtx({ heartSaverDays: 14 });

    const result = checkAchievements(achievements, ctx);
    expect(result[0].unlocked).toBe(true);
  });

  it('returns immutable result (new objects)', () => {
    const original = [makeAchievement()];
    const ctx = defaultCtx({ results: [makeResult()] });
    const result = checkAchievements(original, ctx);

    expect(result).not.toBe(original);
    expect(result[0]).not.toBe(original[0]);
  });
});

// ─── getNewlyUnlocked ───

describe('getNewlyUnlocked', () => {
  it('detects newly unlocked achievements', () => {
    const before = [makeAchievement()];
    const after = [makeAchievement({ unlocked: true, unlockedAt: '2026-06-26T00:00:00.000Z' })];

    const unlocked = getNewlyUnlocked(before, after);
    expect(unlocked).toHaveLength(1);
    expect(unlocked[0].id).toBe('first-steps');
  });

  it('does not include already unlocked achievements', () => {
    const before = [makeAchievement({ unlocked: true })];
    const after = [makeAchievement({ unlocked: true })];

    expect(getNewlyUnlocked(before, after)).toHaveLength(0);
  });
});

describe('countNewlyUnlocked', () => {
  it('counts newly unlocked', () => {
    const before = [makeAchievement()];
    const after = [makeAchievement({ unlocked: true, unlockedAt: '2026-06-26T00:00:00.000Z' })];
    expect(countNewlyUnlocked(before, after)).toBe(1);
  });
});

// ─── calcDisciplineCounts ───

describe('calcDisciplineCounts', () => {
  it('counts completed tasks per discipline', () => {
    const results = [
      makeResult('english'),
      makeResult('english'),
      makeResult('music'),
      makeResult('japanese', false) // not completed
    ];

    const counts = calcDisciplineCounts(results);
    expect(counts['english']).toBe(2);
    expect(counts['music']).toBe(1);
    expect(counts['japanese']).toBeUndefined(); // not completed
  });

  it('returns empty for no results', () => {
    expect(calcDisciplineCounts([])).toEqual({});
  });
});

// ─── createInitialAchievements ───

describe('createInitialAchievements', () => {
  it('creates achievements from definitions', () => {
    const achievements = createInitialAchievements();
    expect(achievements.length).toBeGreaterThan(15);
  });

  it('all achievements start locked', () => {
    const achievements = createInitialAchievements();
    expect(achievements.every((a) => !a.unlocked)).toBe(true);
  });

  it('all achievements start at 0 progress', () => {
    const achievements = createInitialAchievements();
    expect(achievements.every((a) => a.progress === 0)).toBe(true);
  });

  it('includes known achievement IDs', () => {
    const achievements = createInitialAchievements();
    const ids = achievements.map((a) => a.id);
    expect(ids).toContain('first-steps');
    expect(ids).toContain('fenix');
    expect(ids).toContain('xp-10000');
    expect(ids).toContain('perfect-month');
  });
});
