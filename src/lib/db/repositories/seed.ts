import { db } from '$lib/db/schema';
import { planRepo } from './plans';
import { heartRepo, streakRepo } from './hearts';
import type { Plan, Day, Hearts, Streak, Settings } from '$lib/types';
import type { SeedPlanEntry } from '$lib/types';

/**
 * Check if seed data has been imported (by checking if any plan exists).
 */
export async function isSeeded(): Promise<boolean> {
  const count = await db.plans.count();
  return count > 0;
}

/**
 * Import seed data into IndexedDB on first visit.
 * This populates the database from the pre-converted JSON seed files.
 */
export async function importSeedData(): Promise<void> {
  if (await isSeeded()) return;

  // Dynamically import seed JSON files (Vite handles JSON imports)
  const mes1: SeedPlanEntry = await import('$data/seed/mes-1.json');
  const mes2: SeedPlanEntry = await import('$data/seed/mes-2.json');
  const mes3: SeedPlanEntry = await import('$data/seed/mes-3.json');
  const achievementsSeed: { achievements: import('$lib/types').AchievementDefinition[] } =
    await import('$data/seed/achievements.json');

  await db.transaction(
    'rw',
    db.plans,
    db.days,
    db.hearts,
    db.streak,
    db.settings,
    async () => {
      // Import plans
      const plans: Plan[] = [];
      const allDays: Day[] = [];

      for (const entry of [mes1, mes2, mes3]) {
        plans.push(entry.plan);
        let currentDayId = 1;

        for (const week of entry.weeks) {
          for (const dayEntry of week.days) {
            const day: Day = {
              id: `day-${entry.plan.id}-${dayEntry.day}`,
              planId: entry.plan.id,
              day: dayEntry.day,
              week: week.week,
              phase: week.phase,
              label: dayEntry.label,
              title: dayEntry.title,
              tasks: dayEntry.tasks.map((task, idx) => ({
                ...task,
                id: `task-${entry.plan.id}-${dayEntry.day}-${idx + 1}`,
                dayId: `day-${entry.plan.id}-${dayEntry.day}`
              }))
            };
            allDays.push(day);
            currentDayId++;
          }
        }
      }

      // Save all plans
      for (const plan of plans) {
        await planRepo.save(plan);
      }

      // Save all days
      await planRepo.saveDays(allDays);

      // Initialize hearts
      const hearts: Hearts = {
        id: 'current',
        current: 5,
        max: 5,
        graceUntil: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        breakMode: false
      };
      await db.hearts.put(hearts);

      // Initialize streak
      const streak: Streak = {
        id: 'current',
        current: 0,
        longest: 0,
        lastDate: '',
        freezeAvailable: 3
      };
      await db.streak.put(streak);

      // Initialize settings
      const settings: Settings = {
        id: 'default',
        theme: 'red-dark',
        sessionTimerDefault: 40,
        microObjectiveEnabled: true,
        dailyReminder: false,
        dataExportVersion: 1
      };
      await db.settings.put(settings);
    }
  );
}
