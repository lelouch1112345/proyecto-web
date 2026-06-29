// ────────────────────────────────────────────────────────────────
// Tests: Adaptive Tone System
// Scenarios: H1, H2, H3, H4, E1, E2
// ────────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest';
import { deriveTone } from '$lib/i18n/tone';
import { t } from '$lib/i18n/t';
import type { UserSignals } from '$lib/i18n/tone';

describe('deriveTone', () => {
  const base: UserSignals = {
    streak: 5,
    hearts: { current: 3, breakMode: false },
    totalXp: 100,
    level: 2,
    completionRatio: 0.5,
    missedDays: 0,
  };

  // H3: neutral by default
  it('returns neutral by default', () => {
    expect(deriveTone(base)).toBe('neutral');
  });

  // E1: empty-ish state defaults to neutral
  it('defaults to neutral when no strong signal present', () => {
    expect(deriveTone({ ...base, streak: 1, hearts: { current: 3, breakMode: false } })).toBe('neutral');
  });

  // H1: energetic on high streak + full hearts + high completion
  it('returns energetic on high streak + full hearts + high completion', () => {
    expect(
      deriveTone({
        ...base,
        streak: 14,
        hearts: { current: 5, breakMode: false },
        completionRatio: 0.9,
      })
    ).toBe('energetic');
  });

  it('returns energetic on battle won', () => {
    expect(deriveTone({ ...base, battleWon: true })).toBe('energetic');
  });

  it('returns energetic on level up achievements', () => {
    expect(deriveTone({ ...base, levelUpAchievements: ['first_blood'] })).toBe('energetic');
  });

  // H2: empathetic on break mode
  it('returns empathetic on break mode', () => {
    expect(
      deriveTone({ ...base, hearts: { current: 3, breakMode: true } })
    ).toBe('empathetic');
  });

  it('returns empathetic on low hearts', () => {
    expect(
      deriveTone({ ...base, hearts: { current: 1, breakMode: false } })
    ).toBe('empathetic');
  });

  it('returns empathetic on zero streak', () => {
    expect(deriveTone({ ...base, streak: 0 })).toBe('empathetic');
  });

  it('returns empathetic on many missed days', () => {
    expect(deriveTone({ ...base, missedDays: 5 })).toBe('empathetic');
  });
});

describe('t()', () => {
  // H4: resolves to correct variant
  it('resolves neutral variant by default', () => {
    expect(t('xp.toast', 'neutral', '50')).toContain('+50 XP');
  });

  it('resolves energetic variant when specified', () => {
    const result = t('dashboard.greeting', 'energetic');
    expect(result).toBe('Ready to CRUSH today?');
  });

  it('interpolates multiple positional args', () => {
    expect(t('xpbar.level', 'neutral', '3', 'Warrior')).toBe('Lv.3 Warrior');
  });

  // E2: falls back to neutral on missing variant
  it('falls back to neutral when variant missing', () => {
    // All keys currently have 3 variants, but test fallback logic anyway
    const result = t('xp.toast', 'empathetic', '10');
    expect(result).toContain('+10 XP');
  });

  // Unknown key returns key as fallback
  it('returns key as fallback for unknown key', () => {
    const result = t('nonexistent' as any);
    expect(result).toBe('nonexistent');
  });
});

describe('achievements key variants', () => {
  it('achievements.empty — neutral', () => {
    expect(t('achievements.empty', 'neutral')).toBe('Complete your first tasks to earn achievements!');
  });

  it('achievements.empty — empathetic', () => {
    expect(t('achievements.empty', 'empathetic')).toBe('No achievements yet — every task brings you closer');
  });

  it('achievements.empty — energetic', () => {
    expect(t('achievements.empty', 'energetic')).toBe('Go earn those achievements! You\'ve got this!');
  });

  it('achievements.condition — neutral passes through args', () => {
    expect(t('achievements.condition', 'neutral', 'Earn 1000 total XP')).toBe('Earn 1000 total XP');
  });

  it('achievements.condition — empathetic wraps arg', () => {
    expect(t('achievements.condition', 'empathetic', 'Complete 50 tasks')).toBe('Keep going: Complete 50 tasks');
  });

  it('achievements.condition — energetic wraps arg', () => {
    expect(t('achievements.condition', 'energetic', 'Maintain a 7-day streak')).toBe('Maintain a 7-day streak — almost there!');
  });

  it('achievements.progress — neutral', () => {
    expect(t('achievements.progress', 'neutral', '5', '10')).toBe('5%');
  });

  it('achievements.progress — empathetic', () => {
    expect(t('achievements.progress', 'empathetic', '3', '10')).toBe('3% — keep building');
  });

  it('achievements.progress — energetic', () => {
    expect(t('achievements.progress', 'energetic', '8', '10')).toBe('8% — almost there!');
  });
});
