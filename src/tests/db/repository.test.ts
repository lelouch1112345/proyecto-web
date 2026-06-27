// ────────────────────────────────────────────────────────────────
// Tests: Dexie Repositories (Integration with fake-indexeddb)
// ────────────────────────────────────────────────────────────────

import { describe, it, expect, beforeEach } from 'vitest';
import { ThirdLifeDB, db } from '$lib/db/schema';
import { PlanRepo } from '$lib/db/repositories/plans';
import { ResultRepo } from '$lib/db/repositories/results';
import { HeartRepo, StreakRepo } from '$lib/db/repositories/hearts';
import { AchievementRepo } from '$lib/db/repositories/achievements';
import type { Plan, Task, TaskResult, XpEvent } from '$lib/types';

// ─── Helpers ───

function makeResult(overrides: Partial<TaskResult> = {}): TaskResult {
  return {
    id: `res-${Math.random().toString(36).slice(2)}`,
    taskId: 'task-1',
    dayId: 'day-1',
    completed: true,
    xpAwarded: 25,
    timeSpentMin: 15,
    discipline: 'english',
    difficulty: 'medium',
    completedAt: new Date().toISOString(),
    skipped: false,
    ...overrides
  };
}

/**
 * Clear all tables before each test because fake-indexeddb
 * retains the same "ThirdLife" database across all tests.
 */
async function clearAllTables(): Promise<void> {
  await db.transaction('rw', db.tables, async () => {
    for (const table of db.tables) {
      await table.clear();
    }
  });
}

// ─── DB Schema ───

describe('ThirdLifeDB Schema', () => {
  beforeEach(async () => {
    await clearAllTables();
  });

  it('creates all 11 tables', () => {
    const tableNames = db.tables.map((t) => t.name).sort();
    expect(tableNames).toEqual([
      'achievements',
      'calibration',
      'checkIns',
      'days',
      'errorLogs',
      'hearts',
      'plans',
      'settings',
      'streak',
      'taskResults',
      'xpEvents'
    ].sort());
  });
});

// ─── PlanRepo ───

describe('PlanRepo', () => {
  let repo: PlanRepo;

  beforeEach(async () => {
    await clearAllTables();
    repo = new PlanRepo();
  });

  it('saves and retrieves a plan', async () => {
    const plan: Plan = {
      id: 'plan-1',
      name: 'Mes 1',
      totalDays: 18,
      totalWeeks: 3,
      startDate: '2026-06-26'
    };

    await repo.save(plan);
    const retrieved = await repo.getById('plan-1');
    expect(retrieved).toBeDefined();
    expect(retrieved?.name).toBe('Mes 1');
  });

  it('returns undefined for non-existent plan', async () => {
    const plan = await repo.getById('nonexistent');
    expect(plan).toBeUndefined();
  });

  it('returns all plans', async () => {
    await repo.save({ id: 'p1', name: 'Plan 1', totalDays: 10, totalWeeks: 2, startDate: '2026-06-26' });
    await repo.save({ id: 'p2', name: 'Plan 2', totalDays: 20, totalWeeks: 4, startDate: '2026-07-01' });

    const plans = await repo.getAll();
    expect(plans).toHaveLength(2);
  });

  it('counts plans via getAll length', async () => {
    expect((await repo.getAll()).length).toBe(0);
    await repo.save({ id: 'p1', name: 'Plan 1', totalDays: 10, totalWeeks: 2, startDate: '2026-06-26' });
    expect((await repo.getAll()).length).toBe(1);
  });
});

// ─── ResultRepo ───

describe('ResultRepo', () => {
  let repo: ResultRepo;

  beforeEach(async () => {
    await clearAllTables();
    repo = new ResultRepo();
  });

  it('saves and retrieves task results', async () => {
    const result = makeResult();
    await repo.saveResult(result);

    const results = await repo.getAll();
    expect(results).toHaveLength(1);
    expect(results[0].completed).toBe(true);
  });

  it('filters results by date range', async () => {
    // Use date-only strings so lexicographic between() works correctly
    await repo.saveResult(makeResult({ completedAt: '2026-06-25' }));
    await repo.saveResult(makeResult({ completedAt: '2026-06-26' }));
    await repo.saveResult(makeResult({ completedAt: '2026-06-26' }));
    await repo.saveResult(makeResult({ completedAt: '2026-06-27' }));

    const filtered = await repo.getByDateRange('2026-06-26', '2026-06-27');
    expect(filtered).toHaveLength(3);
  });

  it('counts by discipline', async () => {
    await repo.saveResult(makeResult({ discipline: 'english', completed: true }));
    await repo.saveResult(makeResult({ discipline: 'english', completed: true }));
    await repo.saveResult(makeResult({ discipline: 'music', completed: false }));

    const englishCount = await repo.countByDiscipline('english');
    expect(englishCount).toBe(2);

    const musicCount = await repo.countByDiscipline('music');
    expect(musicCount).toBe(0);
  });

  it('handles XP events', async () => {
    const event: XpEvent = {
      id: 'xp-1',
      date: '2026-06-26',
      amount: 25,
      source: 'task_completion',
      discipline: 'english',
      createdAt: new Date().toISOString()
    };

    await repo.saveXpEvent(event);
    const total = await repo.getTotalXp();
    expect(total).toBe(25);
  });

  it('sums total XP from multiple events', async () => {
    for (let i = 0; i < 5; i++) {
      await repo.saveXpEvent({
        id: `xp-${i}`,
        date: '2026-06-26',
        amount: 10,
        source: 'task_completion',
        discipline: 'english',
        createdAt: new Date().toISOString()
      });
    }
    expect(await repo.getTotalXp()).toBe(50);
  });

  it('filters XP by source', async () => {
    await repo.saveXpEvent({
      id: 'xp-1', date: '2026-06-26', amount: 25,
      source: 'task_completion', discipline: 'english',
      createdAt: new Date().toISOString()
    });
    await repo.saveXpEvent({
      id: 'xp-2', date: '2026-06-26', amount: 50,
      source: 'streak_bonus', discipline: 'english',
      createdAt: new Date().toISOString()
    });

    const taskXp = await repo.getXpBySource('task_completion');
    expect(taskXp).toHaveLength(1);

    const streakXp = await repo.getXpBySource('streak_bonus');
    expect(streakXp).toHaveLength(1);
  });

  it('filters XP by discipline', async () => {
    await repo.saveXpEvent({
      id: 'xp-1', date: '2026-06-26', amount: 25,
      source: 'task_completion', discipline: 'english',
      createdAt: new Date().toISOString()
    });
    await repo.saveXpEvent({
      id: 'xp-2', date: '2026-06-26', amount: 30,
      source: 'task_completion', discipline: 'music',
      createdAt: new Date().toISOString()
    });

    const englishXp = await repo.getTotalXpByDiscipline('english');
    expect(englishXp).toBe(25);

    const musicXp = await repo.getTotalXpByDiscipline('music');
    expect(musicXp).toBe(30);
  });

  it('saves and retrieves check-ins', async () => {
    await repo.saveCheckIn({
      id: 'ci-1', date: '2026-06-26',
      energy: 4, focus: 3, mood: 4, sleepHrs: 7.5,
      createdAt: new Date().toISOString()
    });

    const checkIn = await repo.getCheckInByDate('2026-06-26');
    expect(checkIn).toBeDefined();
    expect(checkIn?.energy).toBe(4);
  });

  it('deletes a task result', async () => {
    await repo.saveResult(makeResult({ id: 'delete-me' }));
    expect(await repo.getAll()).toHaveLength(1);

    await repo.delete('delete-me');
    expect(await repo.getAll()).toHaveLength(0);
  });
});

// ─── HeartRepo ───

describe('HeartRepo', () => {
  let repo: HeartRepo;

  beforeEach(async () => {
    await clearAllTables();
    repo = new HeartRepo();
  });

  it('initializes hearts to max', async () => {
    const hearts = await repo.initialize();
    expect(hearts.current).toBe(5);
    expect(hearts.max).toBe(5);
    expect(hearts.breakMode).toBe(false);
  });

  it('deducts a heart', async () => {
    await repo.initialize();
    const result = await repo.deduct();
    expect(result.current).toBe(4);
    expect(result.breakMode).toBe(false);
  });

  it('triggers break mode at 0 hearts', async () => {
    await repo.initialize();
    for (let i = 0; i < 5; i++) {
      await repo.deduct();
    }
    const result = await repo.deduct();
    expect(result.current).toBe(0);
    expect(result.breakMode).toBe(true);
  });

  it('restores a heart', async () => {
    await repo.initialize();
    await repo.deduct();
    const result = await repo.restore();
    expect(result.current).toBe(5);
  });

  it('resets to a specific value', async () => {
    await repo.initialize();
    const result = await repo.resetTo(3);
    expect(result.current).toBe(3);
  });
});

// ─── StreakRepo ───

describe('StreakRepo', () => {
  let repo: StreakRepo;

  beforeEach(async () => {
    await clearAllTables();
    repo = new StreakRepo();
  });

  it('initializes streak to 0', async () => {
    const streak = await repo.initialize();
    expect(streak.current).toBe(0);
    expect(streak.freezeAvailable).toBe(3);
  });

  it('increments streak', async () => {
    await repo.initialize();
    const result = await repo.increment('2026-06-26');
    expect(result.current).toBe(1);
    expect(result.longest).toBe(1);
  });

  it('does not double-count same day', async () => {
    await repo.initialize();
    await repo.increment('2026-06-26');
    const result = await repo.increment('2026-06-26');
    expect(result.current).toBe(1);
  });

  it('uses a freeze', async () => {
    await repo.initialize();
    const result = await repo.useFreeze();
    expect(result.freezeAvailable).toBe(2);
  });

  it('does not use freeze when empty', async () => {
    const streak = await repo.initialize();
    await repo.update({ ...streak, freezeAvailable: 0 });
    const result = await repo.useFreeze();
    expect(result.freezeAvailable).toBe(0);
  });

  it('resets streak', async () => {
    await repo.initialize();
    await repo.increment('2026-06-26');
    const result = await repo.reset();
    expect(result.current).toBe(0);
    expect(result.lastDate).toBe('');
  });
});

// ─── AchievementRepo ───

describe('AchievementRepo', () => {
  let repo: AchievementRepo;

  beforeEach(async () => {
    await clearAllTables();
    repo = new AchievementRepo();
  });

  it('saves and retrieves achievements', async () => {
    await repo.save({
      id: 'first-steps',
      name: 'First Steps',
      description: 'Complete your first task',
      icon: '👶',
      category: 'milestone',
      condition: { type: 'tasks_completed', target: 1 },
      progress: 0,
      unlocked: false
    });

    const all = await repo.getAll();
    expect(all).toHaveLength(1);
  });

  it('unlocks an achievement', async () => {
    await repo.save({
      id: 'first-steps',
      name: 'First Steps',
      description: 'Complete your first task',
      icon: '👶',
      category: 'milestone',
      condition: { type: 'tasks_completed', target: 1 },
      progress: 0,
      unlocked: false
    });

    const unlocked = await repo.unlock('first-steps');
    expect(unlocked?.unlocked).toBe(true);
    expect(unlocked?.progress).toBe(100);
  });

  it('counts unlocked achievements', async () => {
    await repo.save({
      id: 'a1', name: 'A1', description: 'First', icon: '1',
      category: 'milestone',
      condition: { type: 'tasks_completed', target: 1 },
      progress: 0, unlocked: false
    });
    await repo.save({
      id: 'a2', name: 'A2', description: 'Second', icon: '2',
      category: 'milestone',
      condition: { type: 'tasks_completed', target: 5 },
      progress: 0, unlocked: false
    });

    await repo.unlock('a1');
    expect(await repo.countUnlocked()).toBe(1);
  });

  it('updates progress', async () => {
    await repo.save({
      id: 'xp-1000', name: 'Century', description: 'Earn 1,000 XP', icon: '💯',
      category: 'milestone',
      condition: { type: 'total_xp', target: 1000 },
      progress: 0, unlocked: false
    });

    await repo.updateProgress('xp-1000', 50);
    const achievement = await repo.getById('xp-1000');
    expect(achievement?.progress).toBe(50);
  });

  it('does not unlock already-unlocked achievement twice', async () => {
    await repo.save({
      id: 'test', name: 'Test', description: 'Test', icon: 'T',
      category: 'milestone',
      condition: { type: 'tasks_completed', target: 1 },
      progress: 100, unlocked: true, unlockedAt: '2026-06-01T00:00:00.000Z'
    });

    const result = await repo.unlock('test');
    expect(result?.unlockedAt).toBe('2026-06-01T00:00:00.000Z');
  });
});
