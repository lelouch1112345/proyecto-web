import { db } from '$lib/db/schema';
import type { Achievement } from '$lib/types';

export class AchievementRepo {
  /**
   * Save an achievement (upsert — updates progress or unlocked state).
   */
  async save(achievement: Achievement): Promise<void> {
    await db.achievements.put(achievement);
  }

  /**
   * Get all achievements.
   */
  async getAll(): Promise<Achievement[]> {
    return db.achievements.toArray();
  }

  /**
   * Get unlocked achievements, ordered by unlock date.
   */
  async getUnlocked(): Promise<Achievement[]> {
    const all = await db.achievements.filter((a) => a.unlocked).toArray();
    return all.sort((a, b) => {
      if (!a.unlockedAt || !b.unlockedAt) return 0;
      return a.unlockedAt.localeCompare(b.unlockedAt);
    });
  }

  /**
   * Get locked (not yet unlocked) achievements.
   */
  async getLocked(): Promise<Achievement[]> {
    return db.achievements.filter((a) => !a.unlocked).toArray();
  }

  /**
   * Get a specific achievement by ID.
   */
  async getById(id: string): Promise<Achievement | undefined> {
    return db.achievements.get(id);
  }

  /**
   * Unlock an achievement.
   */
  async unlock(id: string): Promise<Achievement | undefined> {
    const achievement = await db.achievements.get(id);
    if (!achievement || achievement.unlocked) return achievement;

    achievement.unlocked = true;
    achievement.unlockedAt = new Date().toISOString();
    achievement.progress = 100;
    await db.achievements.put(achievement);
    return achievement;
  }

  /**
   * Update achievement progress.
   */
  async updateProgress(id: string, progress: number): Promise<void> {
    const achievement = await db.achievements.get(id);
    if (!achievement) return;

    achievement.progress = Math.min(100, Math.max(0, progress));
    await db.achievements.put(achievement);
  }

  /**
   * Count unlocked achievements.
   */
  async countUnlocked(): Promise<number> {
    return db.achievements.filter((a) => a.unlocked).count();
  }
}

export const achievementRepo = new AchievementRepo();
