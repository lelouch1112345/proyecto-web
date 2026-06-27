// ────────────────────────────────────────────────────────────────
// Tests: Metacognitive Calibration System
// ────────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest';
import {
  calcAccuracy,
  categorizeGap,
  calcCalibrationStats,
  interpretTrend,
  getCalibrationTip
} from '$lib/gamification/calibration';
import type { Calibration } from '$lib/types';

// ─── calcAccuracy ───

describe('calcAccuracy', () => {
  it('returns 100 for perfect prediction', () => {
    expect(calcAccuracy(30, 30)).toBe(100);
  });

  it('returns ~83 for slight overestimation', () => {
    const result = calcAccuracy(30, 25);
    expect(result).toBe(83); // 25/30 ≈ 0.833 × 100
  });

  it('returns 50 for double underestimation', () => {
    expect(calcAccuracy(15, 30)).toBe(50); // 15/30 = 0.5
  });

  it('returns 0 when one value is 0', () => {
    expect(calcAccuracy(0, 30)).toBe(0);
    expect(calcAccuracy(30, 0)).toBe(0);
  });

  it('returns 100 when both are 0', () => {
    expect(calcAccuracy(0, 0)).toBe(100);
  });

  it('throws RangeError for negative values', () => {
    expect(() => calcAccuracy(-1, 30)).toThrow(RangeError);
    expect(() => calcAccuracy(30, -5)).toThrow(RangeError);
  });

  it('handles same values of different magnitude', () => {
    expect(calcAccuracy(100, 100)).toBe(100);
    expect(calcAccuracy(1, 1)).toBe(100);
  });
});

// ─── categorizeGap ───

describe('categorizeGap', () => {
  it('returns "over" when predicted > actual', () => {
    expect(categorizeGap(30, 25)).toBe('over');
  });

  it('returns "under" when predicted < actual', () => {
    expect(categorizeGap(25, 30)).toBe('under');
  });

  it('returns "exact" when equal', () => {
    expect(categorizeGap(30, 30)).toBe('exact');
  });
});

// ─── calcCalibrationStats ───

describe('calcCalibrationStats', () => {
  function makeEntry(
    predicted: number,
    actual: number,
    daysAgo = 0
  ): Calibration {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return {
      id: `cal-${Math.random()}`,
      date: date.toISOString().split('T')[0],
      predictedMin: predicted,
      actualMin: actual,
      discipline: 'english',
      createdAt: date.toISOString()
    };
  }

  it('returns empty stats for no entries', () => {
    const stats = calcCalibrationStats([]);
    expect(stats.totalEntries).toBe(0);
    expect(stats.averageAccuracy).toBe(0);
    expect(stats.lastFiveAccuracy).toHaveLength(0);
  });

  it('calculates average accuracy for single entry', () => {
    const stats = calcCalibrationStats([makeEntry(30, 25)]);
    expect(stats.totalEntries).toBe(1);
    expect(stats.averageAccuracy).toBe(83);
  });

  it('calculates correct counts for over/under/exact', () => {
    const entries = [
      makeEntry(30, 25),  // over
      makeEntry(20, 30),  // under
      makeEntry(30, 30),  // exact
      makeEntry(40, 30),  // over
      makeEntry(10, 20)   // under
    ];

    const stats = calcCalibrationStats(entries);
    expect(stats.totalEntries).toBe(5);
    expect(stats.totalOverestimated).toBe(2);
    expect(stats.totalUnderestimated).toBe(2);
    expect(stats.totalExact).toBe(1);
  });

  it('detects improving trend', () => {
    const entries = [
      makeEntry(30, 10, 4),  // poor
      makeEntry(25, 20, 3),  // better
      makeEntry(30, 25, 2),  // better
      makeEntry(30, 28, 1),  // good
      makeEntry(30, 30, 0)   // perfect
    ];

    const stats = calcCalibrationStats(entries);
    expect(stats.trend).toBe('improving');
  });

  it('detects declining trend', () => {
    const entries = [
      makeEntry(30, 30, 4),  // perfect
      makeEntry(25, 25, 3),  // perfect
      makeEntry(30, 25, 2),  // less
      makeEntry(20, 30, 1),  // worse
      makeEntry(10, 30, 0)   // much worse
    ];

    const stats = calcCalibrationStats(entries);
    expect(stats.trend).toBe('declining');
  });

  it('reports stable when < 4 entries', () => {
    const entries = Array.from({ length: 3 }, () => makeEntry(30, 25));
    const stats = calcCalibrationStats(entries);
    expect(stats.trend).toBe('stable');
  });

  it('populates lastFiveAccuracy', () => {
    const entries = Array.from({ length: 10 }, (_, i) =>
      makeEntry(30, 25, 9 - i)
    );
    const stats = calcCalibrationStats(entries);
    expect(stats.lastFiveAccuracy).toHaveLength(5);
  });
});

// ─── interpretTrend ───

describe('interpretTrend', () => {
  it('returns message for improving', () => {
    expect(interpretTrend('improving')).toContain('getting better');
  });

  it('returns message for declining', () => {
    expect(interpretTrend('declining')).toContain('off recently');
  });

  it('returns message for stable', () => {
    expect(interpretTrend('stable')).toContain('steady');
  });
});

// ─── getCalibrationTip ───

describe('getCalibrationTip', () => {
  it('recommends breaking down tasks when overestimating', () => {
    expect(getCalibrationTip(10, 1)).toContain('overestimate');
  });

  it('recommends buffer time when underestimating', () => {
    expect(getCalibrationTip(1, 10)).toContain('underestimate');
  });

  it('says balanced when similar counts', () => {
    expect(getCalibrationTip(5, 5)).toContain('balanced');
  });
});
