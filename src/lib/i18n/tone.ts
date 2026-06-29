// ────────────────────────────────────────────────────────────────
// Adaptive Tone System — Tone derivation
// Pure function: no side effects, no Svelte imports
// ────────────────────────────────────────────────────────────────

export type Tone = 'neutral' | 'empathetic' | 'energetic';

export interface UserSignals {
  streak: number;
  hearts: { current: number; breakMode: boolean };
  totalXp: number;
  level: number;
  checkIn?: { mood: number; energy: number; focus: number };
  completionRatio: number;
  battleCompleted?: boolean;
  battleWon?: boolean;
  levelUpAchievements?: string[];
  missedDays: number;
}

/**
 * Derive a tone from user signals.
 *
 * Rules:
 * - **Energetic**: high streak + full hearts + high completion,
 *   or battle won, or level up
 * - **Empathetic**: break mode, low hearts, zero streak, or 3+ missed days
 * - **Neutral**: default — no strong signal
 */
export function deriveTone(signals: UserSignals): Tone {
  const {
    streak,
    hearts,
    completionRatio,
    battleWon,
    levelUpAchievements,
    missedDays,
  } = signals;

  // Energetic: on fire or just celebrated
  if (
    (streak >= 14 && hearts.current >= 4 && completionRatio >= 0.8) ||
    battleWon === true ||
    (levelUpAchievements && levelUpAchievements.length > 0)
  ) {
    return 'energetic';
  }

  // Empathetic: struggling
  if (
    hearts.breakMode ||
    hearts.current <= 2 ||
    streak === 0 ||
    missedDays >= 3
  ) {
    return 'empathetic';
  }

  // Default
  return 'neutral';
}
