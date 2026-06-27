import type { DisciplineConfig, Level } from './types';

// ──────────────────────────── Disciplines ────────────────────────────

export const DISCIPLINES: DisciplineConfig[] = [
  {
    id: 'english',
    name: 'Inglés',
    nameEn: 'English',
    emoji: '🇬🇧',
    color: '#3b82f6',
    xpMultiplier: 1.0
  },
  {
    id: 'spanish',
    name: 'Español',
    nameEn: 'Spanish',
    emoji: '🇪🇸',
    color: '#eab308',
    xpMultiplier: 1.0
  },
  {
    id: 'japanese',
    name: '日本語',
    nameEn: 'Japanese',
    emoji: '🇯🇵',
    color: '#ef4444',
    xpMultiplier: 1.2
  },
  {
    id: 'music',
    name: 'Música',
    nameEn: 'Music',
    emoji: '🎵',
    color: '#a855f7',
    xpMultiplier: 1.1
  }
] as const;

// ──────────────────────────── Difficulty XP ──────────────────────────

export const DIFFICULTY_XP: Record<string, number> = {
  easy: 10,
  medium: 25,
  hard: 50
} as const;

// ──────────────────────────── Level System ────────────────────────────

export const LEVEL_TITLES: Level[] = [
  { level: 1, title: 'Novato', xpRequired: 0, xpRequiredCumulative: 0 },
  { level: 2, title: 'Aprendiz', xpRequired: 100, xpRequiredCumulative: 100 },
  { level: 3, title: 'Estudiante', xpRequired: 150, xpRequiredCumulative: 250 },
  { level: 4, title: 'Dedicado', xpRequired: 250, xpRequiredCumulative: 500 },
  { level: 5, title: 'Constante', xpRequired: 400, xpRequiredCumulative: 900 },
  { level: 6, title: 'Disciplinado', xpRequired: 600, xpRequiredCumulative: 1500 },
  { level: 7, title: 'Persistente', xpRequired: 900, xpRequiredCumulative: 2400 },
  { level: 8, title: 'Resiliente', xpRequired: 1200, xpRequiredCumulative: 3600 },
  { level: 9, title: 'Inquebrantable', xpRequired: 1600, xpRequiredCumulative: 5200 },
  { level: 10, title: 'Maestro', xpRequired: 2000, xpRequiredCumulative: 7200 },
  { level: 11, title: 'Sabio', xpRequired: 2800, xpRequiredCumulative: 10000 },
  { level: 12, title: 'Leyenda', xpRequired: 3600, xpRequiredCumulative: 13600 },
  { level: 13, title: 'Inmortal', xpRequired: 5000, xpRequiredCumulative: 18600 },
  { level: 14, title: 'Third-Life', xpRequired: 6400, xpRequiredCumulative: 25000 }
] as const;

export const MAX_LEVEL = 14;
export const MAX_XP = 25000;

// ──────────────────────────── Hearts System ──────────────────────────

export const MAX_HEARTS = 5;
export const GRACE_WINDOW_HOURS = 48;
export const HEART_RECOVERY_PERFECT_WEEKS = 1; // Perfect weeks to recover 1 heart
export const BREAK_MODE_MESSAGE =
  '❤️‍🩹 Break mode active. Focus on recovery — do what you can today.';

// ──────────────────────────── Streaks ────────────────────────────────

export const STREAK_FREEZE_LIMIT = 3;
export const STREAK_BOSS_BATTLE_DAY = 7; // Sunday (day 7 of week)
export const BOSS_BATTLE_MULTIPLIER = 1.5;

// ──────────────────────────── XP Sources ────────────────────────────

export const XP_SOURCES = {
  task_completion: 'Task Completion',
  boss_battle: 'Weekly Boss Battle',
  streak_bonus: 'Streak Bonus',
  perfect_week: 'Perfect Week',
  achievement: 'Achievement Unlock',
  check_in: 'Daily Check-In',
  recovery: 'Recovery Bonus'
} as const;

// ──────────────────────────── Achievements ────────────────────────────

export const ACHIEVEMENT_DEFINITIONS = [
  {
    id: 'first-steps',
    name: 'First Steps',
    description: 'Complete your first task',
    icon: '👶',
    category: 'milestone' as const,
    condition: { type: 'tasks_completed' as const, target: 1 }
  },
  {
    id: 'week-1',
    name: 'First Week Done',
    description: 'Complete all tasks for one full week',
    icon: '📅',
    category: 'milestone' as const,
    condition: { type: 'streak_days' as const, target: 7 }
  },
  {
    id: 'streak-7',
    name: 'One Week Streak',
    description: 'Maintain a 7-day streak',
    icon: '🔥',
    category: 'consistency' as const,
    condition: { type: 'streak_days' as const, target: 7 }
  },
  {
    id: 'streak-14',
    name: 'Fortnight Warrior',
    description: 'Maintain a 14-day streak',
    icon: '⚔️',
    category: 'consistency' as const,
    condition: { type: 'streak_days' as const, target: 14 }
  },
  {
    id: 'streak-30',
    name: 'Monthly Mastery',
    description: 'Maintain a 30-day streak',
    icon: '🏆',
    category: 'consistency' as const,
    condition: { type: 'streak_days' as const, target: 30 }
  },
  {
    id: 'xp-1000',
    name: 'Century',
    description: 'Earn 1,000 total XP',
    icon: '💯',
    category: 'milestone' as const,
    condition: { type: 'total_xp' as const, target: 1000 }
  },
  {
    id: 'xp-5000',
    name: 'Powerhouse',
    description: 'Earn 5,000 total XP',
    icon: '💪',
    category: 'milestone' as const,
    condition: { type: 'total_xp' as const, target: 5000 }
  },
  {
    id: 'xp-10000',
    name: 'XP Champion',
    description: 'Earn 10,000 total XP',
    icon: '🏅',
    category: 'milestone' as const,
    condition: { type: 'total_xp' as const, target: 10000 }
  },
  {
    id: 'english-dedication',
    name: 'English Enthusiast',
    description: 'Complete 30 English tasks',
    icon: '🇬🇧',
    category: 'discipline' as const,
    condition: { type: 'discipline_tasks' as const, target: 30, discipline: 'english' }
  },
  {
    id: 'music-dedication',
    name: 'Music Lover',
    description: 'Complete 30 Music tasks',
    icon: '🎵',
    category: 'discipline' as const,
    condition: { type: 'discipline_tasks' as const, target: 30, discipline: 'music' }
  },
  {
    id: 'japanese-dedication',
    name: '日本語愛好家',
    description: 'Complete 30 Japanese tasks',
    icon: '🗾',
    category: 'discipline' as const,
    condition: { type: 'discipline_tasks' as const, target: 30, discipline: 'japanese' }
  },
  {
    id: 'perfect-week',
    name: 'Perfect Week',
    description: 'Complete all tasks for an entire week',
    icon: '⭐',
    category: 'consistency' as const,
    condition: { type: 'perfect_weeks' as const, target: 1 }
  },
  {
    id: 'perfect-month',
    name: 'Perfect Month',
    description: 'Complete all tasks for 4 weeks in a row',
    icon: '🌙',
    category: 'consistency' as const,
    condition: { type: 'perfect_weeks' as const, target: 4 }
  },
  {
    id: 'fenix',
    name: 'Fénix',
    description: 'Recover from a burnout (7+ days missed)',
    icon: '🦅',
    category: 'recovery' as const,
    condition: { type: 'recoveries' as const, target: 1 }
  },
  {
    id: 'checkin-master',
    name: 'Self-Aware',
    description: 'Complete 30 daily check-ins',
    icon: '🧠',
    category: 'consistency' as const,
    condition: { type: 'check_ins' as const, target: 30 }
  },
  {
    id: 'heart-saver',
    name: 'Heart Saver',
    description: 'Never lose a heart for 14 days',
    icon: '❤️',
    category: 'consistency' as const,
    condition: { type: 'hearts_saved' as const, target: 14 }
  }
] as const;

// ──────────────────────────── Error Categories ───────────────────────

export const ERROR_CATEGORIES = {
  L: 'Language (idioma)',
  R: 'Recovery (recuperación)',
  D: 'Discipline (disciplina)',
  C: 'Calibration (calibración)',
  F: 'Focus (enfoque)',
  pronunciation: 'Pronunciation',
  grammar: 'Grammar',
  vocabulary: 'Vocabulary',
  kanji: 'Kanji',
  rhythm: 'Rhythm',
  other: 'Other'
} as const;

export const STUDY_ERROR_CATEGORIES = ['pronunciation', 'grammar', 'vocabulary', 'kanji', 'rhythm', 'other'] as const;

// ──────────────────────────── Recovery Protocols ──────────────────────

export const RECOVERY_PROTOCOLS = {
  '1-2': {
    label: '1–2 days missed',
    description: 'Light catch-up',
    instructions: [
      'No stress — you are still on track.',
      'Do today\'s tasks as normal. Skip the missed days entirely.',
      'Log the missed days in error log with category R.',
      'Resume the plan from today\'s scheduled day.'
    ]
  },
  '3-5': {
    label: '3–5 days missed',
    description: 'Standard recovery',
    instructions: [
      'Acknowledge the gap — this happens to everyone.',
      'Do NOT try to catch up on all missed tasks.',
      'Select the top 3 most important tasks from the missed days and do them today.',
      'Log the recovery with category R.',
      'Resume from today\'s scheduled day. No date shifting needed.',
      'Heart penalty: -1 per missed day after 48h grace.'
    ]
  },
  '6-13': {
    label: '6–13 days missed (1+ week)',
    description: 'Extended recovery — date shift',
    instructions: [
      'Date shift mode: push all future dates forward by days missed.',
      'Do today\'s tasks at minimum — rebuild the habit.',
      'Review the missed week\'s objectives but do not do every task.',
      'Heart penalty: -1 per missed day after 48h grace.',
      'Log recovery with category R and details.',
      'Reset micro-objective to something achievable.'
    ]
  },
  burnout: {
    label: '14+ days missed (Burnout)',
    description: 'Full reset protocol',
    instructions: [
      'This is NOT failure — this is data. You lasted this long.',
      'Full reset: restart from Day 1 with a new start date.',
      'Keep your XP, achievements, and streak history.',
      'Heart penalty: reset to 3 hearts (not 0 — grace matters).',
      'Log recovery with category R — record what caused the gap.',
      'The Fénix achievement awaits: rise from the ashes.',
      'You have already proven you can do this. One more time.'
    ]
  }
} as const;
