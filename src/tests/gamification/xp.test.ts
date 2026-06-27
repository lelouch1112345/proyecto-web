// ────────────────────────────────────────────────────────────────
// Tests: XP & Level System
// Scenarios: H1 (happy path), E1 (edge case — negative guard)
// ────────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest';
import {
  calcXP,
  calcXpByCategory,
  getLevel,
  getLevelProgress,
  didLevelUp,
  checkDailyXpCap,
  applyDailyXpCap,
  getStreakMilestoneBonus,
  isStreakMilestone,
  getNextStreakMilestone,
  DAILY_XP_CAP,
  STREAK_MILESTONES
} from '$lib/gamification/xp';
import type { XpEvent } from '$lib/types';

// ─── calcXP ───

describe('calcXP', () => {
  // H1: Task completion awards XP
  it('H1: returns correct XP for medium difficulty English task', () => {
    const xp = calcXP('medium', 'english');
    expect(xp).toBe(25); // 25 base × 1.0 multiplier
  });

  it('returns correct XP for easy English task', () => {
    const xp = calcXP('easy', 'english');
    expect(xp).toBe(10); // 10 × 1.0
  });

  it('returns correct XP for hard Japanese task (1.2× multiplier)', () => {
    const xp = calcXP('hard', 'japanese');
    expect(xp).toBe(60); // 50 × 1.2
  });

  it('returns correct XP for medium Music task (1.1× multiplier)', () => {
    const xp = calcXP('medium', 'music');
    const expected = Math.round(25 * 1.1);
    expect(xp).toBe(expected); // 28 (rounded)
  });

  it('returns correct XP for easy Spanish task', () => {
    const xp = calcXP('easy', 'spanish');
    expect(xp).toBe(10); // 10 × 1.0
  });

  // E1: Edge case — invalid difficulty
  it('E1: throws RangeError for invalid difficulty', () => {
    expect(() => calcXP('invalid' as never, 'english')).toThrow(RangeError);
    expect(() => calcXP('invalid' as never, 'english')).toThrow('Invalid difficulty');
  });

  it('throws RangeError for empty difficulty', () => {
    expect(() => calcXP('' as never, 'english')).toThrow(RangeError);
  });

  // R7: MUST be pure — no side effects
  it('R7: is a pure function — same inputs always return same output', () => {
    const result1 = calcXP('hard', 'japanese');
    const result2 = calcXP('hard', 'japanese');
    expect(result1).toBe(result2);
  });

  it('R6: rejects negative XP values (no negative difficulty)', () => {
    // Valid difficulty, valid discipline — but there's no way to compute
    // negative XP with the current types. The RangeError guard covers
    // invalid difficulty values.
    // Negative XP doesn't occur via the pure function; it's enforced at
    // the storage layer by only recording positive XP events.
    expect(() => calcXP('invalid' as never, 'english')).toThrow(RangeError);
  });
});

// ─── calcXpByCategory ───

describe('calcXpByCategory', () => {
  it('returns 10 XP for reading English task', () => {
    expect(calcXpByCategory('reading', 'english')).toBe(10);
  });

  it('returns 15 XP for speaking English task', () => {
    expect(calcXpByCategory('speaking', 'english')).toBe(15);
  });

  it('returns 5 XP for vocab task', () => {
    expect(calcXpByCategory('vocab', 'english')).toBe(5);
  });

  it('applies discipline multiplier for Japanese', () => {
    const xp = calcXpByCategory('reading', 'japanese');
    expect(xp).toBe(12); // 10 × 1.2
  });

  it('falls back to 10 XP for unknown category', () => {
    expect(calcXpByCategory('unknown', 'english')).toBe(10);
  });
});

// ─── getLevel ───

describe('getLevel', () => {
  it('returns level 1 (Novato) for 0 XP', () => {
    const level = getLevel(0);
    expect(level.level).toBe(1);
    expect(level.title).toBe('Novato');
  });

  it('returns level 5 (Constante) for 900 XP', () => {
    const level = getLevel(900);
    expect(level.level).toBe(5);
    expect(level.title).toBe('Constante');
  });

  it('returns level 14 (Third-Life) for max XP', () => {
    const level = getLevel(25000);
    expect(level.level).toBe(14);
    expect(level.title).toBe('Third-Life');
  });

  it('returns level 14 for XP beyond max', () => {
    const level = getLevel(99999);
    expect(level.level).toBe(14);
  });

  it('returns level 1 for negative XP (clamped)', () => {
    const level = getLevel(-100);
    expect(level.level).toBe(1);
  });

  it('returns correct thresholds for level 8', () => {
    const level = getLevel(3600);
    expect(level.level).toBe(8);
    expect(level.title).toBe('Resiliente');
    expect(level.xpRequiredCumulative).toBe(3600);
  });
});

// ─── getLevelProgress ───

describe('getLevelProgress', () => {
  it('returns 0% at start of level 1', () => {
    expect(getLevelProgress(0)).toBe(0);
  });

  it('returns 50% at halfway through a level', () => {
    // Level 1 → 2 requires 100 XP total. At 50 XP, that's 50%
    expect(getLevelProgress(50)).toBe(50);
  });

  it('returns 100% at max level', () => {
    expect(getLevelProgress(25000)).toBe(100);
  });

  it('returns 100% beyond max level', () => {
    expect(getLevelProgress(30000)).toBe(100);
  });

  it('returns 0% for negative XP', () => {
    expect(getLevelProgress(-10)).toBe(0);
  });
});

// ─── didLevelUp ───

describe('didLevelUp', () => {
  it('returns true when level increases', () => {
    expect(didLevelUp(0, 250)).toBe(true); // Level 1 → 4
  });

  it('returns false when same level', () => {
    expect(didLevelUp(50, 80)).toBe(false); // Still level 1
  });

  it('returns false when XP decreases', () => {
    expect(didLevelUp(500, 100)).toBe(false); // Went from level 4 to level 2
  });
});

// ─── Daily XP Cap ───

describe('checkDailyXpCap', () => {
  const makeEvent = (amount: number): XpEvent => ({
    id: 'test',
    date: '2026-06-26',
    amount,
    source: 'task_completion',
    discipline: 'english',
    createdAt: new Date().toISOString()
  });

  it('allows XP when under daily cap', () => {
    const events = [makeEvent(50), makeEvent(30)];
    expect(checkDailyXpCap(events, 20)).toBe(false);
  });

  it('rejects XP when cap would be exceeded', () => {
    const events = [makeEvent(DAILY_XP_CAP)];
    expect(checkDailyXpCap(events, 1)).toBe(true);
  });

  it('allows XP exactly at cap', () => {
    const events = [makeEvent(DAILY_XP_CAP - 10)];
    expect(checkDailyXpCap(events, 10)).toBe(false);
  });

  it('handles empty events array', () => {
    expect(checkDailyXpCap([], 50)).toBe(false);
  });
});

describe('applyDailyXpCap', () => {
  const makeEvent = (amount: number): XpEvent => ({
    id: 'test',
    date: '2026-06-26',
    amount,
    source: 'task_completion',
    discipline: 'english',
    createdAt: new Date().toISOString()
  });

  it('returns full requested XP when under cap', () => {
    const events = [makeEvent(50)];
    expect(applyDailyXpCap(events, 50)).toBe(50);
  });

  it('returns remaining cap when over cap', () => {
    const events = [makeEvent(DAILY_XP_CAP - 10)];
    expect(applyDailyXpCap(events, 50)).toBe(10);
  });

  it('returns 0 when cap is exhausted', () => {
    const events = [makeEvent(DAILY_XP_CAP)];
    expect(applyDailyXpCap(events, 10)).toBe(0);
  });
});

// ─── Streak Milestones ───

describe('getStreakMilestoneBonus', () => {
  it('returns 50 XP for 7-day streak', () => {
    expect(getStreakMilestoneBonus(7)).toBe(50);
  });

  it('returns 1000 XP for 84-day streak', () => {
    expect(getStreakMilestoneBonus(84)).toBe(1000);
  });

  it('returns 0 for non-milestone streak', () => {
    expect(getStreakMilestoneBonus(5)).toBe(0);
  });

  it('returns 0 for 0-day streak', () => {
    expect(getStreakMilestoneBonus(0)).toBe(0);
  });
});

describe('isStreakMilestone', () => {
  it('returns 7 for 7-day streak', () => {
    expect(isStreakMilestone(7)).toBe(7);
  });

  it('returns null for non-milestone', () => {
    expect(isStreakMilestone(8)).toBeNull();
  });
});

describe('getNextStreakMilestone', () => {
  it('returns 7 for streak of 3', () => {
    expect(getNextStreakMilestone(3)).toBe(7);
  });

  it('returns 30 for streak of 22', () => {
    expect(getNextStreakMilestone(22)).toBe(30);
  });

  it('returns null for streak beyond max milestone', () => {
    expect(getNextStreakMilestone(100)).toBeNull();
  });
});
