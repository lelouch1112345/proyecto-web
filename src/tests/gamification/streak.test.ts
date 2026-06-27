// ────────────────────────────────────────────────────────────────
// Tests: Streak System
// ────────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest';
import {
  calcStreak,
  applyStreakFreeze,
  shouldUseFreeze,
  replenishFreezes
} from '$lib/gamification/streak';
import type { Streak } from '$lib/types';

// ─── calcStreak ───

describe('calcStreak', () => {
  it('returns 0 streak for empty history', () => {
    const result = calcStreak([], '2026-06-26', 3);
    expect(result.current).toBe(0);
    expect(result.longest).toBe(0);
    expect(result.lastDate).toBe('');
  });

  it('returns 1 for single day of activity today', () => {
    const result = calcStreak(['2026-06-26'], '2026-06-26', 3);
    expect(result.current).toBe(1);
    expect(result.longest).toBe(1);
    expect(result.lastDate).toBe('2026-06-26');
  });

  it('returns 3 for three consecutive days ending today', () => {
    const history = ['2026-06-24', '2026-06-25', '2026-06-26'];
    const result = calcStreak(history, '2026-06-26', 3);
    expect(result.current).toBe(3);
    expect(result.longest).toBe(3);
  });

  it('returns 2 when last active yesterday (still consecutive)', () => {
    const history = ['2026-06-24', '2026-06-25'];
    const result = calcStreak(history, '2026-06-26', 3);
    expect(result.current).toBe(2);
  });

  it('uses freeze for 1-day gap (last active 2 days ago)', () => {
    const history = ['2026-06-24'];
    const result = calcStreak(history, '2026-06-26', 3);
    expect(result.current).toBe(1);
    expect(result.freezeUsed).toBe(true);
  });

  it('does not use freeze when none available', () => {
    const history = ['2026-06-24'];
    const result = calcStreak(history, '2026-06-26', 0);
    expect(result.current).toBe(0);
    expect(result.freezeUsed).toBe(false);
  });

  it('returns 0 when gap is too big and no freeze', () => {
    const history = ['2026-06-20', '2026-06-21'];
    const result = calcStreak(history, '2026-06-26', 0);
    expect(result.current).toBe(0);
  });

  it('tracks longest streak correctly', () => {
    // Has a 5-day streak, then a gap, then 3 days
    const history = [
      '2026-06-01', '2026-06-02', '2026-06-03', '2026-06-04', '2026-06-05',
      '2026-06-10', '2026-06-11', '2026-06-12'
    ];
    const result = calcStreak(history, '2026-06-12', 3);
    expect(result.longest).toBe(5);
    expect(result.current).toBe(3);
  });

  it('deduplicates same-day entries', () => {
    const history = ['2026-06-26', '2026-06-26', '2026-06-26'];
    const result = calcStreak(history, '2026-06-26', 3);
    expect(result.current).toBe(1);
  });

  it('reports missed days when freeze is used', () => {
    const history = ['2026-06-24'];
    const result = calcStreak(history, '2026-06-26', 3);
    expect(result.missedDays.length).toBe(1);
    expect(result.missedDays[0]).toBe('2026-06-25');
  });

  it('handles unsorted date input', () => {
    const history = ['2026-06-26', '2026-06-24', '2026-06-25'];
    const result = calcStreak(history, '2026-06-26', 3);
    expect(result.current).toBe(3);
  });
});

// ─── applyStreakFreeze ───

describe('applyStreakFreeze', () => {
  const baseStreak: Streak = {
    id: 'current',
    current: 5,
    longest: 10,
    lastDate: '2026-06-25',
    freezeAvailable: 2
  };

  it('consumes one freeze token', () => {
    const result = applyStreakFreeze(baseStreak);
    expect(result.freezeAvailable).toBe(1);
    expect(result.current).toBe(5); // Unchanged
  });

  it('does nothing when freeze count is 0', () => {
    const zero = { ...baseStreak, freezeAvailable: 0 };
    const result = applyStreakFreeze(zero);
    expect(result.freezeAvailable).toBe(0);
    expect(result).toEqual(zero);
  });

  it('returns a new object (immutable)', () => {
    const result = applyStreakFreeze(baseStreak);
    expect(result).not.toBe(baseStreak);
  });
});

// ─── shouldUseFreeze ───

describe('shouldUseFreeze', () => {
  it('returns true when gap is 2 days', () => {
    expect(shouldUseFreeze('2026-06-24', '2026-06-26')).toBe(true);
  });

  it('returns false when active today', () => {
    expect(shouldUseFreeze('2026-06-26', '2026-06-26')).toBe(false);
  });

  it('returns false when gap is 1 day (still consecutive)', () => {
    expect(shouldUseFreeze('2026-06-25', '2026-06-26')).toBe(false);
  });

  it('returns false when gap is 3+ days', () => {
    expect(shouldUseFreeze('2026-06-23', '2026-06-26')).toBe(false);
  });

  it('returns false when lastDate is empty', () => {
    expect(shouldUseFreeze('', '2026-06-26')).toBe(false);
  });
});

// ─── replenishFreezes ───

describe('replenishFreezes', () => {
  it('increases freezes by 1', () => {
    expect(replenishFreezes(2)).toBe(3);
  });

  it('caps at STREAK_FREEZE_LIMIT (3)', () => {
    expect(replenishFreezes(3)).toBe(3);
    expect(replenishFreezes(5)).toBe(3);
  });

  it('increases from 0 to 1', () => {
    expect(replenishFreezes(0)).toBe(1);
  });
});
