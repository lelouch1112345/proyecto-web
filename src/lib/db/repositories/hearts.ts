import { db } from '$lib/db/schema';
import type { Hearts, Streak } from '$lib/types';
import { MAX_HEARTS } from '$lib/constants';

export class HeartRepo {
  /**
   * Get the current heart state (singleton).
   */
  async getState(): Promise<Hearts | undefined> {
    return db.hearts.limit(1).first();
  }

  /**
   * Initialize hearts for a new user.
   */
  async initialize(): Promise<Hearts> {
    const hearts: Hearts = {
      id: 'current',
      current: MAX_HEARTS,
      max: MAX_HEARTS,
      graceUntil: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      breakMode: false
    };
    await db.hearts.put(hearts);
    return hearts;
  }

  /**
   * Update the heart state.
   */
  async update(hearts: Hearts): Promise<void> {
    await db.hearts.put(hearts);
  }

  /**
   * Deduct a heart (with break mode check).
   */
  async deduct(): Promise<Hearts> {
    const state = (await this.getState()) ?? (await this.initialize());
    const updated: Hearts = {
      ...state,
      current: Math.max(0, state.current - 1),
      breakMode: state.current - 1 <= 0
    };
    await this.update(updated);
    return updated;
  }

  /**
   * Restore a heart (max = MAX_HEARTS).
   */
  async restore(): Promise<Hearts> {
    const state = (await this.getState()) ?? (await this.initialize());
    const updated: Hearts = {
      ...state,
      current: Math.min(state.max, state.current + 1),
      breakMode: false
    };
    await this.update(updated);
    return updated;
  }

  /**
   * Reset hearts to a specific value (used on recovery).
   */
  async resetTo(value: number): Promise<Hearts> {
    const state = (await this.getState()) ?? (await this.initialize());
    const updated: Hearts = {
      ...state,
      current: Math.min(state.max, Math.max(0, value)),
      graceUntil: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      breakMode: value <= 0
    };
    await this.update(updated);
    return updated;
  }
}

export class StreakRepo {
  /**
   * Get the current streak state (singleton).
   */
  async getState(): Promise<Streak | undefined> {
    return db.streak.limit(1).first();
  }

  /**
   * Initialize streak for a new user.
   */
  async initialize(): Promise<Streak> {
    const streak: Streak = {
      id: 'current',
      current: 0,
      longest: 0,
      lastDate: '',
      freezeAvailable: 3
    };
    await db.streak.put(streak);
    return streak;
  }

  /**
   * Update streak.
   */
  async update(streak: Streak): Promise<void> {
    await db.streak.put(streak);
  }

  /**
   * Increment streak (called on daily activity).
   */
  async increment(today: string): Promise<Streak> {
    const state = (await this.getState()) ?? (await this.initialize());

    // Don't double-count same day
    if (state.lastDate === today) return state;

    const newCurrent = state.current + 1;
    const updated: Streak = {
      ...state,
      current: newCurrent,
      longest: Math.max(state.longest, newCurrent),
      lastDate: today
    };
    await this.update(updated);
    return updated;
  }

  /**
   * Use a streak freeze.
   */
  async useFreeze(): Promise<Streak> {
    const state = (await this.getState()) ?? (await this.initialize());
    if (state.freezeAvailable <= 0) return state;

    const updated: Streak = {
      ...state,
      freezeAvailable: state.freezeAvailable - 1
    };
    await this.update(updated);
    return updated;
  }

  /**
   * Reset streak (called when a day is missed without freeze).
   */
  async reset(): Promise<Streak> {
    const state = (await this.getState()) ?? (await this.initialize());
    const updated: Streak = {
      ...state,
      current: 0,
      lastDate: ''
    };
    await this.update(updated);
    return updated;
  }
}

export const heartRepo = new HeartRepo();
export const streakRepo = new StreakRepo();
