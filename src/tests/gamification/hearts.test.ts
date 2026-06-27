// ────────────────────────────────────────────────────────────────
// Tests: Heart System
// Scenarios: H3 (heart deduction), E2 (break mode at 0 hearts)
// ────────────────────────────────────────────────────────────────

import { describe, it, expect, vi } from 'vitest';
import {
  calcHearts,
  isWithinGraceWindow,
  isBreakMode,
  processDailyHearts,
  projectHeartState,
  recoverHearts
} from '$lib/gamification/hearts';
import type { Hearts } from '$lib/types';
import { MAX_HEARTS } from '$lib/constants';

// Helper to create a future grace timestamp
function futureGrace(hours = 48): string {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

// Helper to create a past grace timestamp
function pastGrace(): string {
  return new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString();
}

// Sample full-hp state
function fullHearts(): Hearts {
  return {
    id: 'current',
    current: MAX_HEARTS,
    max: MAX_HEARTS,
    graceUntil: futureGrace(),
    breakMode: false
  };
}

// ─── calcHearts ───

describe('calcHearts', () => {
  // H3: Heart deduction on missed day
  it('H3: deducts 1 heart for 1 missed day outside grace window', () => {
    const state: Hearts = {
      id: 'current',
      current: 5,
      max: 5,
      graceUntil: pastGrace(),
      breakMode: false
    };

    const result = calcHearts(state, { missedDays: 1 });
    expect(result.current).toBe(4);
    expect(result.breakMode).toBe(false);
  });

  it('does NOT deduct hearts inside grace window', () => {
    const state = fullHearts();
    // Grace window is still valid (future)
    const result = calcHearts(state, { missedDays: 1 });
    expect(result.current).toBe(5); // No deduction
  });

  it('extends grace window when active', () => {
    const state = fullHearts();
    // The grace window should be extended (≥ 48h from now)
    const result = calcHearts(state, { missedDays: 0 });
    const minExpected = Date.now() + 48 * 60 * 60 * 1000;
    expect(new Date(result.graceUntil).getTime()).toBeGreaterThanOrEqual(minExpected - 100);
  });

  it('recharges 1 heart from perfect week', () => {
    const state: Hearts = {
      id: 'current',
      current: 4,
      max: 5,
      graceUntil: futureGrace(),
      breakMode: false
    };

    const result = calcHearts(state, { missedDays: 0, perfectWeeks: 1 });
    expect(result.current).toBe(5); // Restored to max
  });

  it('recharges 1 heart from 7+ hours sleep', () => {
    const state: Hearts = {
      id: 'current',
      current: 4,
      max: 5,
      graceUntil: futureGrace(),
      breakMode: false
    };

    const result = calcHearts(state, { missedDays: 0, sleepHrs: 8 });
    expect(result.current).toBe(5);
  });

  it('does NOT recharge from sleep when at max', () => {
    const state = fullHearts();
    const result = calcHearts(state, { missedDays: 0, sleepHrs: 8 });
    expect(result.current).toBe(5); // No overflow
  });

  it('does NOT recharge from sleep when there are deductions', () => {
    const state: Hearts = {
      id: 'current',
      current: 4,
      max: 5,
      graceUntil: pastGrace(),
      breakMode: false
    };

    const result = calcHearts(state, { missedDays: 1, sleepHrs: 8 });
    // -1 for missed day, no sleep recovery because there were deductions
    expect(result.current).toBe(3);
  });

  // E2: Zero hearts triggers break mode
  it('E2: triggers break mode when hearts reach 0', () => {
    const state: Hearts = {
      id: 'current',
      current: 1,
      max: 5,
      graceUntil: pastGrace(),
      breakMode: false
    };

    const result = calcHearts(state, { missedDays: 5 });
    expect(result.current).toBe(0);
    expect(result.breakMode).toBe(true);
  });

  it('caps hearts at max', () => {
    const state: Hearts = {
      id: 'current',
      current: 4,
      max: 5,
      graceUntil: futureGrace(),
      breakMode: false
    };

    const result = calcHearts(state, { missedDays: 0, perfectWeeks: 3, sleepHrs: 8 });
    expect(result.current).toBe(5); // Capped, not 7
  });

  it('keeps hearts at 0 (no negative)', () => {
    const state: Hearts = {
      id: 'current',
      current: 2,
      max: 5,
      graceUntil: pastGrace(),
      breakMode: false
    };

    const result = calcHearts(state, { missedDays: 10 });
    expect(result.current).toBe(0);
    expect(result.current).toBeGreaterThanOrEqual(0);
  });

  it('tracks last missed date when deductions occur', () => {
    const state: Hearts = {
      id: 'current',
      current: 5,
      max: 5,
      graceUntil: pastGrace(),
      breakMode: false
    };

    const result = calcHearts(state, { missedDays: 2 });
    expect(result.lastMissedDate).toBeDefined();
  });

  it('preserves lastMissedDate when no missed days', () => {
    const state: Hearts = {
      id: 'current',
      current: 3,
      max: 5,
      graceUntil: futureGrace(),
      breakMode: false,
      lastMissedDate: '2026-06-24'
    };

    const result = calcHearts(state, { missedDays: 0 });
    expect(result.lastMissedDate).toBe('2026-06-24');
  });
});

// ─── isWithinGraceWindow ───

describe('isWithinGraceWindow', () => {
  it('returns true for future grace date', () => {
    const future = futureGrace();
    expect(isWithinGraceWindow(future)).toBe(true);
  });

  it('returns false for past grace date', () => {
    expect(isWithinGraceWindow('2020-01-01T00:00:00.000Z')).toBe(false);
  });
});

// ─── isBreakMode ───

describe('isBreakMode', () => {
  it('returns true for 0 hearts', () => {
    expect(isBreakMode(0)).toBe(true);
  });

  it('returns false for positive hearts', () => {
    expect(isBreakMode(1)).toBe(false);
    expect(isBreakMode(5)).toBe(false);
  });
});

// ─── processDailyHearts ───

describe('processDailyHearts', () => {
  it('deducts heart when inactive yesterday', () => {
    const state: Hearts = {
      id: 'current',
      current: 5,
      max: 5,
      graceUntil: pastGrace(),
      breakMode: false
    };

    const result = processDailyHearts(state, false, 0, 6);
    expect(result.current).toBe(4);
  });

  it('recharges heart when active and slept well', () => {
    const state: Hearts = {
      id: 'current',
      current: 4,
      max: 5,
      graceUntil: futureGrace(),
      breakMode: false
    };

    const result = processDailyHearts(state, true, 0, 8);
    expect(result.current).toBe(5);
  });
});

// ─── projectHeartState ───

describe('projectHeartState', () => {
  it('projects heart loss for mostly inactive days', () => {
    const state = fullHearts();
    // Simulate having a past grace window for projection
    const oldState = { ...state, graceUntil: pastGrace() };
    const result = projectHeartState(oldState, 7, 2, 0);
    // 5 hearts - 5 missed = 0
    expect(result.current).toBe(0);
    expect(result.breakMode).toBe(true);
  });
});

// ─── recoverHearts ───

describe('recoverHearts', () => {
  it('resets to specified heart count', () => {
    const state: Hearts = {
      id: 'current',
      current: 0,
      max: 5,
      graceUntil: pastGrace(),
      breakMode: true
    };

    const result = recoverHearts(state, 3);
    expect(result.current).toBe(3);
    expect(result.breakMode).toBe(false);
  });

  it('does not exceed max hearts', () => {
    const state = fullHearts();
    const result = recoverHearts(state, 10);
    expect(result.current).toBe(5);
  });

  it('extends grace window on recovery', () => {
    const state: Hearts = {
      id: 'current',
      current: 0,
      max: 5,
      graceUntil: pastGrace(),
      breakMode: true
    };

    const result = recoverHearts(state, 3);
    expect(new Date(result.graceUntil).getTime()).toBeGreaterThan(Date.now());
  });
});
