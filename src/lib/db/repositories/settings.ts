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
}

export const settingsRepo = new SettingsRepo();
