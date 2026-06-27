import { db } from '$lib/db/schema';
import type { ErrorLog, ErrorCategory } from '$lib/types';

export class ErrorLogRepo {
  /**
   * Save an error log entry.
   */
  async save(error: ErrorLog): Promise<void> {
    await db.errorLogs.put(error);
  }

  /**
   * Get all error logs, ordered by date descending.
   */
  async getAll(): Promise<ErrorLog[]> {
    return db.errorLogs.orderBy('date').reverse().toArray();
  }

  /**
   * Get error logs filtered by category.
   */
  async getByCategory(category: ErrorCategory): Promise<ErrorLog[]> {
    return db.errorLogs.where('category').equals(category).toArray();
  }

  /**
   * Get unresolved errors.
   */
  async getUnresolved(): Promise<ErrorLog[]> {
    return db.errorLogs.filter((e) => !e.resolved).toArray();
  }

  /**
   * Mark an error as resolved.
   */
  async resolve(id: string): Promise<void> {
    const entry = await db.errorLogs.get(id);
    if (entry) {
      entry.resolved = true;
      await db.errorLogs.put(entry);
    }
  }

  /**
   * Delete an error log entry.
   */
  async delete(id: string): Promise<void> {
    await db.errorLogs.delete(id);
  }
}

export const errorLogRepo = new ErrorLogRepo();
