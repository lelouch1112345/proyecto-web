// ────────────────────────────────────────────────────────────────
// Integration Tests: Full App Flow
// Verifies: seed → load plan → complete task → XP → streak → achievement
// Uses fake-indexeddb for IndexedDB mocking
// ────────────────────────────────────────────────────────────────

import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '$lib/db/schema';
import { PlanRepo } from '$lib/db/repositories/plans';
import { ResultRepo } from '$lib/db/repositories/results';
import { HeartRepo, StreakRepo } from '$lib/db/repositories/hearts';
import { AchievementRepo } from '$lib/db/repositories/achievements';
import { isSeeded, importSeedData } from '$lib/db/repositories/seed';
import { settingsRepo } from '$lib/db/repositories/settings';
import { calcXP } from '$lib/gamification/xp';
import { genId, today, now } from '$lib/utils/id';
import type { Plan, Day, TaskResult, XpEvent } from '$lib/types';

// ─── Helpers ───

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

// ─── Integration: Full Seed → Task → XP → Streak → Achievement Flow ───

describe('Full App Flow (Seed → Task → XP → Streak → Achievement)', () => {
  let planRepo: PlanRepo;
  let resultRepo: ResultRepo;
  let heartRepo: HeartRepo;
  let streakRepo: StreakRepo;
  let achievementRepo: AchievementRepo;

  beforeEach(async () => {
    await clearAllTables();
    planRepo = new PlanRepo();
    resultRepo = new ResultRepo();
    heartRepo = new HeartRepo();
    streakRepo = new StreakRepo();
    achievementRepo = new AchievementRepo();
  });

  it('seeds all data on first visit → loads plan → creates initial game state', async () => {
    // 1. Verify DB starts empty
    expect(await isSeeded()).toBe(false);

    // 2. Import seed data (JSON files)
    await importSeedData();

    // 3. Verify DB is now seeded
    expect(await isSeeded()).toBe(true);

    // 4. Verify a plan exists
    const plan = await planRepo.getActive();
    expect(plan).toBeDefined();
    expect(plan!.name).toBeTruthy();
    expect(plan!.totalDays).toBeGreaterThan(0);

    // 5. Verify days exist
    const days = await planRepo.getDays(plan!.id);
    expect(days.length).toBeGreaterThan(0);
    expect(days[0].tasks.length).toBeGreaterThan(0);

    // 6. Verify hearts initialized
    const hearts = await heartRepo.getState();
    expect(hearts).toBeDefined();
    expect(hearts!.current).toBe(5);
    expect(hearts!.max).toBe(5);

    // 7. Verify streak initialized
    const streak = await streakRepo.getState();
    expect(streak).toBeDefined();
    expect(streak!.current).toBe(0);

    // 8. Verify settings initialized with defaults
    const settings = await settingsRepo.get();
    expect(settings).toBeDefined();
    expect(settings!.theme).toBe('red-dark');
  });

  it('completes a task → awards XP → updates streak → unlocks first achievement', async () => {
    // 1. Seed the database
    await importSeedData();

    // 2. Get the active plan and set a startDate so getCurrentDayNumber works
    const plan = await planRepo.getActive();
    expect(plan).toBeDefined();
    plan!.startDate = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    await planRepo.save(plan!);

    // 3. Get today's day
    const dayNumber = planRepo.getCurrentDayNumber(plan!);
    const day = await planRepo.getDay(plan!.id, dayNumber);
    expect(day).toBeDefined();

    // 3. Pick the first task of the day
    const firstTask = day!.tasks[0];
    expect(firstTask).toBeDefined();
    const todayStr = today();

    // 4. Complete the task
    const xpAwarded = calcXP(firstTask.difficulty, firstTask.discipline);
    expect(xpAwarded).toBeGreaterThan(0);

    // Save task result
    const result: TaskResult = {
      id: genId(),
      taskId: firstTask.id,
      dayId: day!.id,
      completed: true,
      xpAwarded,
      timeSpentMin: firstTask.durationMin,
      discipline: firstTask.discipline,
      difficulty: firstTask.difficulty,
      completedAt: now(),
      skipped: false
    };
    await resultRepo.saveResult(result);

    // Save XP event
    const xpEvent: XpEvent = {
      id: genId(),
      date: todayStr,
      amount: xpAwarded,
      source: 'task_completion',
      discipline: firstTask.discipline,
      description: `Completed: ${firstTask.description}`,
      createdAt: now()
    };
    await resultRepo.saveXpEvent(xpEvent);

    // 5. Verify XP increased
    const totalXp = await resultRepo.getTotalXp();
    expect(totalXp).toBe(xpAwarded);

    const events = await resultRepo.getXpEvents(10);
    expect(events.length).toBe(1);
    expect(events[0].amount).toBe(xpAwarded);
    expect(events[0].source).toBe('task_completion');

    // 6. Verify streak updated
    const streak = await streakRepo.increment(todayStr);
    expect(streak.current).toBe(1);
    expect(streak.lastDate).toBe(todayStr);
    expect(streak.longest).toBe(1);

    // 7. Verify achievement unlocked (First Steps: complete 1 task)
    const allResults = await resultRepo.getAll();
    const allEvents = await resultRepo.getXpEvents(1000);

    // Create initial achievements
    const { createInitialAchievements, checkAchievements } = await import('$lib/gamification/achievements');
    const initialAchievements = createInitialAchievements();
    // Find the "First Steps" achievement
    const firstStepsDef = initialAchievements.find((a) => a.id === 'first-steps');
    expect(firstStepsDef).toBeDefined();

    const { calcDisciplineCounts } = await import('$lib/gamification/achievements');
    const disciplineCounts = calcDisciplineCounts(allResults);

    const updatedAchievements = checkAchievements(initialAchievements, {
      events: allEvents,
      results: allResults,
      currentStreak: streak.current,
      totalCheckIns: 0,
      perfectWeeks: 0,
      recoveryCount: 0,
      disciplineTaskCounts: disciplineCounts,
      heartSaverDays: 0
    });

    const firstStepsAfter = updatedAchievements.find((a) => a.id === 'first-steps');
    expect(firstStepsAfter).toBeDefined();
    expect(firstStepsAfter!.unlocked).toBe(true);
    expect(firstStepsAfter!.progress).toBe(100);

    // 8. Verify saved through the repository
    // Save the updated achievements
    for (const ach of updatedAchievements) {
      if (ach.unlocked) {
        await achievementRepo.save(ach);
      }
    }
    const savedAchievements = await achievementRepo.getUnlocked();
    expect(savedAchievements.length).toBeGreaterThanOrEqual(1);
    expect(savedAchievements.some((a) => a.id === 'first-steps')).toBe(true);
  });

  it('handles partial completion and XP cap correctly', async () => {
    await importSeedData();

    const plan = await planRepo.getActive();
    plan!.startDate = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    await planRepo.save(plan!);
    const dayNumber = planRepo.getCurrentDayNumber(plan!);
    const day = await planRepo.getDay(plan!.id, dayNumber);
    expect(day).toBeDefined();

    const tasks = day!.tasks;
    expect(tasks.length).toBeGreaterThan(1);

    // Complete first task
    const firstTask = tasks[0];
    const xp1 = calcXP(firstTask.difficulty, firstTask.discipline);
    await resultRepo.saveResult({
      id: genId(), taskId: firstTask.id, dayId: day!.id,
      completed: true, xpAwarded: xp1, timeSpentMin: firstTask.durationMin,
      discipline: firstTask.discipline, difficulty: firstTask.difficulty,
      completedAt: now(), skipped: false
    });
    await resultRepo.saveXpEvent({
      id: genId(), date: today(), amount: xp1,
      source: 'task_completion', discipline: firstTask.discipline,
      description: `Completed: ${firstTask.description}`, createdAt: now()
    });

    // Verify partial state (not all tasks done)
    const allResultsSoFar = await resultRepo.getAll();
    const dayResults = allResultsSoFar.filter((r) => r.dayId === day!.id);
    expect(dayResults.length).toBe(1);
    expect(dayResults.every((r) => r.completed)).toBe(true);

    // Complete all remaining tasks
    for (let i = 1; i < tasks.length; i++) {
      const task = tasks[i];
      const xp = calcXP(task.difficulty, task.discipline);
      await resultRepo.saveResult({
        id: genId(), taskId: task.id, dayId: day!.id,
        completed: true, xpAwarded: xp, timeSpentMin: task.durationMin,
        discipline: task.discipline, difficulty: task.difficulty,
        completedAt: now(), skipped: false
      });

      await resultRepo.saveXpEvent({
        id: genId(), date: today(), amount: xp,
        source: 'task_completion', discipline: task.discipline,
        description: `Completed: ${task.description}`, createdAt: now()
      });
    }

    // Verify all tasks completed
    const allResultsAfter = await resultRepo.getAll();
    const allDayResults = allResultsAfter.filter((r) => r.dayId === day!.id);
    expect(allDayResults.length).toBe(tasks.length);

    // Verify XP correctly summed
    const totalXp = await resultRepo.getTotalXp();
    const expectedXp = tasks.reduce((sum, t) => sum + calcXP(t.difficulty, t.discipline), 0);
    expect(totalXp).toBe(expectedXp);

    // But verify it respects the daily XP cap from constants
    const { applyDailyXpCap, DAILY_XP_CAP } = await import('$lib/gamification/xp');
    const todayStr = today();
    const todaysEvents = await resultRepo.getXpByDateRange(
      todayStr + 'T00:00:00',
      todayStr + 'T23:59:59'
    );
    // The cap should not be exceeded
    const todayXpTotal = todaysEvents.reduce((sum, e) => sum + e.amount, 0);
    expect(todayXpTotal).toBeLessThanOrEqual(DAILY_XP_CAP);
  });
});
