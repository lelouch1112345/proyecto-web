import { db } from '$lib/db/schema';
import type { Plan, Day, Task } from '$lib/types';

export class PlanRepo {
  /**
   * Get the active/default plan.
   */
  async getActive(): Promise<Plan | undefined> {
    const plans = await db.plans.limit(1).toArray();
    return plans[0];
  }

  /**
   * Get all plans.
   */
  async getAll(): Promise<Plan[]> {
    return db.plans.toArray();
  }

  /**
   * Get a plan by ID.
   */
  async getById(id: string): Promise<Plan | undefined> {
    return db.plans.get(id);
  }

  /**
   * Save (upsert) a plan.
   */
  async save(plan: Plan): Promise<void> {
    await db.plans.put(plan);
  }

  /**
   * Get all days for a plan, ordered by day number.
   */
  async getDays(planId: string): Promise<Day[]> {
    return db.days.where('planId').equals(planId).sortBy('day');
  }

  /**
   * Get a specific day by plan ID and day number.
   */
  async getDay(planId: string, day: number): Promise<Day | undefined> {
    return db.days.where({ planId, day }).first();
  }

  /**
   * Get the current day for a plan based on start date.
   * Returns the plan day number (1-indexed) relative to today.
   */
  getCurrentDayNumber(plan: Plan): number {
    const start = new Date(plan.startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffMs = today.getTime() - start.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return Math.max(1, Math.min(plan.totalDays, diffDays + 1));
  }

  /**
   * Get today's tasks by finding the current day from the plan.
   */
  async getTodayTasks(planId: string): Promise<{ day: Day | undefined; tasks: Task[] }> {
    const plan = await this.getById(planId);
    if (!plan) return { day: undefined, tasks: [] };

    const dayNumber = this.getCurrentDayNumber(plan);
    const day = await this.getDay(planId, dayNumber);

    return {
      day: day ?? undefined,
      tasks: day?.tasks ?? []
    };
  }

  /**
   * Save a day (with its tasks).
   */
  async saveDay(day: Day): Promise<void> {
    await db.days.put(day);
  }

  /**
   * Save multiple days in a transaction.
   */
  async saveDays(days: Day[]): Promise<void> {
    await db.transaction('rw', db.days, async () => {
      for (const day of days) {
        await db.days.put(day);
      }
    });
  }

  /**
   * Get a range of days (for weekly view).
   */
  async getDayRange(planId: string, startDay: number, endDay: number): Promise<Day[]> {
    return db.days
      .where('planId')
      .equals(planId)
      .filter((d) => d.day >= startDay && d.day <= endDay)
      .sortBy('day');
  }

  /**
   * Get a specific week's days.
   */
  async getWeek(planId: string, week: number): Promise<Day[]> {
    const startDay = (week - 1) * 7 + 1;
    const endDay = week * 7;
    return this.getDayRange(planId, startDay, endDay);
  }
}

export const planRepo = new PlanRepo();
