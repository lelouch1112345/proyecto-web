// ────────────────────────────────────────────────────────────────
// Adaptive Tone System — Message Registry
// Pure data: no side effects, no Svelte imports
// ────────────────────────────────────────────────────────────────

import type { Tone } from './tone';

export const messages = {
  'xp.toast': {
    neutral: '+{0} XP',
    empathetic: '+{0} XP — every bit counts',
    energetic: '+{0} XP! 🔥',
  },
  'streak.tooltip': {
    neutral: 'Streak: {0} days',
    empathetic: 'Start fresh today — you\'ve got this',
    energetic: '{0}-day streak! UNSTOPPABLE! 🔥',
  },
  'hearts.tooltip': {
    neutral: '{0}/{1} hearts',
    empathetic: '{0}/{1} hearts — rest if you need to',
    energetic: 'Full hearts! Ready for anything!',
  },
  'xpbar.level': {
    neutral: 'Lv.{0} {1}',
    empathetic: 'Lv.{0} — keep going, you\'re making progress',
    energetic: 'Lv.{0} — you\'re on FIRE!',
  },
  'dashboard.empty': {
    neutral: 'No tasks scheduled — enjoy your rest',
    empathetic: 'No pressure today — rest is part of the journey',
    energetic: 'No tasks? Time for bonus challenges!',
  },
  'dashboard.greeting': {
    neutral: 'Good {0}',
    empathetic: 'Take it easy today',
    energetic: 'Ready to CRUSH today?',
  },
  'boss.keep_going': {
    neutral: 'Keep going!',
    empathetic: 'You\'re still in this — keep pushing',
    energetic: 'ALMOST THERE!',
  },
  'boss.passed': {
    neutral: 'Passed!',
    empathetic: 'You did it! Proud of you',
    energetic: 'VICTORY! BOSS DEFEATED!',
  },
  'boss.waiting': {
    neutral: 'Not yet',
    empathetic: 'No rush — you\'ll get there',
    energetic: 'Waiting for you to dominate!',
  },
  'achievements.empty': {
    neutral: 'Complete your first tasks to earn achievements!',
    empathetic: 'No achievements yet — every task brings you closer',
    energetic: 'Go earn those achievements! You\'ve got this!',
  },
  'achievements.condition': {
    neutral: '{0}',
    empathetic: 'Keep going: {0}',
    energetic: '{0} — almost there!',
  },
  'achievements.progress': {
    neutral: '{0}%',
    empathetic: '{0}% — keep building',
    energetic: '{0}% — almost there!',
  },
} as const satisfies Record<string, Record<Tone, string>>;

export type MessageKey = keyof typeof messages;
