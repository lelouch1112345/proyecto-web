import { db } from '$lib/db/schema';
import type { Settings } from '$lib/types';

export class SettingsRepo {
  /**
   * Get the current settings (singleton).
   */
  async get(): Promise<Settings | undefined> {
    return db.settings.limit(1).first();
  }

  /**
   * Initialize default settings.
   */
  async initialize(): Promise<Settings> {
    const settings: Settings = {
      id: 'default',
      theme: 'red-dark',
      sessionTimerDefault: 40,
      microObjectiveEnabled: true,
      dailyReminder: false,
      dataExportVersion: 1
    };
    await db.settings.put(settings);
    return settings;
  }

  /**
   * Update settings.
   */
  async update(settings: Partial<Settings>): Promise<Settings> {
    const current = (await this.get()) ?? (await this.initialize());
    const updated: Settings = { ...current, ...settings, id: 'default' };
    await db.settings.put(updated);
    return updated;
  }

  /**
   * Export all data as JSON (for backup/download).
   */
  async exportAll(): Promise<Record<string, unknown>> {
    return {
      plans: await db.plans.toArray(),
      days: await db.days.toArray(),
      taskResults: await db.taskResults.toArray(),
      checkIns: await db.checkIns.toArray(),
      xpEvents: await db.xpEvents.toArray(),
      achievements: await db.achievements.toArray(),
      hearts: await db.hearts.toArray(),
      errorLogs: await db.errorLogs.toArray(),
      calibration: await db.calibration.toArray(),
      streak: await db.streak.toArray(),
      settings: await this.get(),
      exportedAt: new Date().toISOString()
    };
  }

  /**
   * Import all data from a JSON backup.
   * Clears existing data before importing.
   */
  async importAll(data: Record<string, unknown>): Promise<void> {
    // Clear existing data first
    await db.plans.clear();
    await db.days.clear();
    await db.taskResults.clear();
    await db.checkIns.clear();
    await db.xpEvents.clear();
    await db.achievements.clear();
    await db.hearts.clear();
    await db.errorLogs.clear();
    await db.calibration.clear();
    await db.streak.clear();
    await db.settings.clear();

    // Import each table if present
    if (Array.isArray(data.plans)) for (const item of data.plans) await db.plans.put(item);
    if (Array.isArray(data.days)) for (const item of data.days) await db.days.put(item);
    if (Array.isArray(data.taskResults)) for (const item of data.taskResults) await db.taskResults.put(item);
    if (Array.isArray(data.checkIns)) for (const item of data.checkIns) await db.checkIns.put(item);
    if (Array.isArray(data.xpEvents)) for (const item of data.xpEvents) await db.xpEvents.put(item);
    if (Array.isArray(data.achievements)) for (const item of data.achievements) await db.achievements.put(item);
    if (Array.isArray(data.hearts)) for (const item of data.hearts) await db.hearts.put(item);
    if (Array.isArray(data.errorLogs)) for (const item of data.errorLogs) await db.errorLogs.put(item);
    if (Array.isArray(data.calibration)) for (const item of data.calibration) await db.calibration.put(item);
    if (Array.isArray(data.streak)) for (const item of data.streak) await db.streak.put(item);
    if (data.settings && typeof data.settings === 'object' && 'id' in data.settings) {
      await db.settings.put(data.settings as import('$lib/types').Settings);
    }
  }
}

export const settingsRepo = new SettingsRepo();
