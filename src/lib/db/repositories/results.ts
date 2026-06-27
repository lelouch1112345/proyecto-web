import { db } from '$lib/db/schema';
import type { TaskResult, XpEvent, CheckIn } from '$lib/types';

export class ResultRepo {
  // ───────────── Task Results ─────────────

  /**
   * Save a task result.
   */
  async saveResult(result: TaskResult): Promise<void> {
    await db.taskResults.put(result);
  }

  /**
   * Get all results for a specific task.
   */
  async getByTask(taskId: string): Promise<TaskResult[]> {
    return db.taskResults.where('taskId').equals(taskId).toArray();
  }

  /**
   * Get results for a date range.
   */
  async getByDateRange(fromDate: string, toDate: string): Promise<TaskResult[]> {
    return db.taskResults
      .where('completedAt')
      .between(fromDate, toDate, true, true)
      .toArray();
  }

  /**
   * Get all task results, ordered by date descending.
   */
  async getAll(): Promise<TaskResult[]> {
    return db.taskResults.orderBy('completedAt').reverse().toArray();
  }

  /**
   * Count completed tasks for a discipline.
   */
  async countByDiscipline(discipline: string): Promise<number> {
    return db.taskResults
      .where('discipline')
      .equals(discipline)
      .filter((r) => r.completed)
      .count();
  }

  /**
   * Get task results for a specific day.
   */
  async getByDayId(dayId: string): Promise<TaskResult[]> {
    return db.taskResults.where('dayId').equals(dayId).toArray();
  }

  /**
   * Delete a task result.
   */
  async delete(id: string): Promise<void> {
    await db.taskResults.delete(id);
  }

  // ───────────── XP Events ─────────────

  /**
   * Save an XP event (append to ledger).
   */
  async saveXpEvent(event: XpEvent): Promise<void> {
    await db.xpEvents.put(event);
  }

  /**
   * Get all XP events, ordered by date descending.
   */
  async getXpEvents(limit = 100): Promise<XpEvent[]> {
    return db.xpEvents.orderBy('date').reverse().limit(limit).toArray();
  }

  /**
   * Get XP events for a date range.
   */
  async getXpByDateRange(fromDate: string, toDate: string): Promise<XpEvent[]> {
    return db.xpEvents.where('date').between(fromDate, toDate, true, true).toArray();
  }

  /**
   * Get total XP earned.
   */
  async getTotalXp(): Promise<number> {
    const events = await db.xpEvents.toArray();
    return events.reduce((sum, e) => sum + e.amount, 0);
  }

  /**
   * Get XP events by source.
   */
  async getXpBySource(source: string): Promise<XpEvent[]> {
    return db.xpEvents.where('source').equals(source).toArray();
  }

  /**
   * Get XP events for a specific discipline.
   */
  async getXpByDiscipline(discipline: string): Promise<XpEvent[]> {
    return db.xpEvents.where('discipline').equals(discipline).toArray();
  }

  /**
   * Get total XP for a discipline.
   */
  async getTotalXpByDiscipline(discipline: string): Promise<number> {
    const events = await this.getXpByDiscipline(discipline);
    return events.reduce((sum, e) => sum + e.amount, 0);
  }

  // ───────────── Check-Ins ─────────────

  /**
   * Save a daily check-in.
   */
  async saveCheckIn(checkIn: CheckIn): Promise<void> {
    await db.checkIns.put(checkIn);
  }

  /**
   * Get check-in for a specific date.
   */
  async getCheckInByDate(date: string): Promise<CheckIn | undefined> {
    return db.checkIns.where('date').equals(date).first();
  }

  /**
   * Get all check-ins, ordered by date descending.
   */
  async getAllCheckIns(): Promise<CheckIn[]> {
    return db.checkIns.orderBy('date').reverse().toArray();
  }

  /**
   * Get check-ins for a date range.
   */
  async getCheckInsByRange(fromDate: string, toDate: string): Promise<CheckIn[]> {
    return db.checkIns.where('date').between(fromDate, toDate, true, true).toArray();
  }

  /**
   * Count total check-ins.
   */
  async countCheckIns(): Promise<number> {
    return db.checkIns.count();
  }
}

export const resultRepo = new ResultRepo();
