import { db } from '$lib/db/schema';
import type { Calibration } from '$lib/types';

export class CalibrationRepo {
  /**
   * Save a calibration entry.
   */
  async save(calibration: Calibration): Promise<void> {
    await db.calibration.put(calibration);
  }

  /**
   * Get all calibration entries, ordered by date descending.
   */
  async getAll(): Promise<Calibration[]> {
    return db.calibration.orderBy('date').reverse().toArray();
  }

  /**
   * Get calibration entries for a date range.
   */
  async getByDateRange(fromDate: string, toDate: string): Promise<Calibration[]> {
    return db.calibration.where('date').between(fromDate, toDate, true, true).toArray();
  }

  /**
   * Calculate calibration accuracy as a percentage.
   * Accuracy = how often prediction was within 20% of actual.
   */
  async getAccuracy(): Promise<{ percentage: number; total: number; accurate: number }> {
    const all = await db.calibration.toArray();
    if (all.length === 0) return { percentage: 0, total: 0, accurate: 0 };

    const accurate = all.filter((c) => {
      const diff = Math.abs(c.predictedMin - c.actualMin);
      return diff <= c.predictedMin * 0.2 || diff <= 5; // within 20% or 5 min
    });

    return {
      total: all.length,
      accurate: accurate.length,
      percentage: Math.round((accurate.length / all.length) * 100)
    };
  }
}

export const calibrationRepo = new CalibrationRepo();
