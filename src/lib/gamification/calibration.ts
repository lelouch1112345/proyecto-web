// ────────────────────────────────────────────────────────────────
// Gamification — Metacognitive Calibration System
// Pure functions: no side effects, no storage reads
// ────────────────────────────────────────────────────────────────

import type { Calibration } from '$lib/types';

// ─── Types ───

export type GapCategory = 'over' | 'under' | 'exact';

export interface CalibrationStats {
  averageAccuracy: number; // 0–100
  totalEntries: number;
  totalOverestimated: number;
  totalUnderestimated: number;
  totalExact: number;
  trend: 'improving' | 'stable' | 'declining';
  lastFiveAccuracy: number[];
}

// ─── Single Entry ───

/**
 * Calculate the accuracy of a single calibration entry.
 * Returns a value from 0–100 where 100 = perfect prediction.
 *
 * Formula: min(predicted, actual) / max(predicted, actual) × 100
 *
 * @throws {RangeError} If either value is negative.
 *
 * @example
 * calcAccuracy(30, 25) // => 83 (overestimated by 5 min)
 * calcAccuracy(30, 30) // => 100 (perfect)
 * calcAccuracy(15, 30) // => 50 (underestimated by 15 min)
 */
export function calcAccuracy(predictedMin: number, actualMin: number): number {
  if (predictedMin < 0 || actualMin < 0) {
    throw new RangeError('Negative values are not allowed');
  }
  if (predictedMin === 0 && actualMin === 0) return 100;
  if (predictedMin === 0 || actualMin === 0) return 0;

  const ratio = Math.min(predictedMin, actualMin) / Math.max(predictedMin, actualMin);
  return Math.round(ratio * 100);
}

/**
 * Categorize the gap between predicted and actual time.
 */
export function categorizeGap(predictedMin: number, actualMin: number): GapCategory {
  if (predictedMin > actualMin) return 'over';
  if (predictedMin < actualMin) return 'under';
  return 'exact';
}

// ─── Aggregate Stats ───

/**
 * Calculate calibration statistics from an array of entries.
 * Returns aggregate stats including accuracy, trend, and counts.
 *
 * @example
 * calcCalibrationStats([{ predictedMin: 30, actualMin: 25, ... }, ...])
 * // => { averageAccuracy: 83, totalEntries: 1, ... }
 */
export function calcCalibrationStats(entries: Calibration[]): CalibrationStats {
  if (entries.length === 0) {
    return {
      averageAccuracy: 0,
      totalEntries: 0,
      totalOverestimated: 0,
      totalUnderestimated: 0,
      totalExact: 0,
      trend: 'stable',
      lastFiveAccuracy: []
    };
  }

  const sorted = [...entries].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const accuracies = sorted.map((e) => calcAccuracy(e.predictedMin, e.actualMin));
  const totalOverestimated = sorted.filter((e) => e.predictedMin > e.actualMin).length;
  const totalUnderestimated = sorted.filter((e) => e.predictedMin < e.actualMin).length;
  const totalExact = sorted.filter((e) => e.predictedMin === e.actualMin).length;
  const averageAccuracy = Math.round(
    accuracies.reduce((sum, a) => sum + a, 0) / accuracies.length
  );

  // Last 5 entries for trend
  const lastFive = accuracies.slice(-5);

  // Trend: compare first half of last 5 to second half
  let trend: CalibrationStats['trend'] = 'stable';
  if (lastFive.length >= 4) {
    const mid = Math.floor(lastFive.length / 2);
    const firstHalf = lastFive.slice(0, mid).reduce((s, a) => s + a, 0) / mid;
    const secondHalf = lastFive.slice(mid).reduce((s, a) => s + a, 0) / (lastFive.length - mid);

    const threshold = 5; // percentage points
    if (secondHalf > firstHalf + threshold) trend = 'improving';
    else if (firstHalf > secondHalf + threshold) trend = 'declining';
  }

  return {
    averageAccuracy,
    totalEntries: entries.length,
    totalOverestimated,
    totalUnderestimated,
    totalExact,
    trend,
    lastFiveAccuracy: lastFive
  };
}

// ─── Trend Helpers ───

/**
 * Get a human-readable interpretation of calibration trend.
 */
export function interpretTrend(trend: CalibrationStats['trend']): string {
  switch (trend) {
    case 'improving':
      return 'Your time estimation is getting better! Keep reflecting.';
    case 'declining':
      return 'You\'ve been off recently — try timing yourself more consciously.';
    case 'stable':
      return 'Your calibration is steady. Reflect on patterns to improve.';
  }
}

/**
 * Get a tip based on the most common gap category.
 */
export function getCalibrationTip(
  overCount: number,
  underCount: number
): string {
  if (overCount > underCount * 2) {
    return 'You tend to overestimate. Try breaking tasks into smaller chunks.';
  }
  if (underCount > overCount * 2) {
    return 'You tend to underestimate. Give yourself more buffer time.';
  }
  return 'Your predictions are balanced — keep reflecting!';
}
