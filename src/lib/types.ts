// ──────────────────────────── Disciplines ────────────────────────────

export type Discipline = 'english' | 'spanish' | 'japanese' | 'music';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface DisciplineConfig {
  id: Discipline;
  name: string;
  nameEn: string;
  emoji: string;
  color: string;
  xpMultiplier: number;
}

// ──────────────────────────── Plan Structure ──────────────────────────

export interface Plan {
  id: string;
  name: string;
  totalDays: number;
  totalWeeks: number;
  startDate: string; // ISO date — set on first visit
  description?: string;
}

export interface Day {
  id: string;
  planId: string;
  day: number; // 1-indexed day number in the plan
  week: number; // 1-indexed week number
  phase?: string; // e.g. "Foundation", "Expansion", "Consolidation"
  label?: string; // e.g. "Day 1 — Thursday 18"
  title?: string;
  tasks: Task[];
}

export interface Task {
  id: string;
  dayId: string;
  discipline: Discipline;
  difficulty: Difficulty;
  description: string;
  durationMin: number;
  order: number;
  category: string; // "reading", "speaking", "listening", "writing", "vocab", "grammar", "theory", "practice", "ear-training"
  detail?: string; // Extended instructions or notes
  links?: string[]; // Resource URLs
  ankiDeck?: string;
  ankiCount?: number;
}

// ──────────────────────────── User Data ──────────────────────────────

export type XpSource =
  | 'task_completion'
  | 'boss_battle'
  | 'streak_bonus'
  | 'perfect_week'
  | 'achievement'
  | 'check_in'
  | 'recovery';

export interface TaskResult {
  id: string;
  taskId: string;
  dayId: string;
  completed: boolean;
  xpAwarded: number;
  timeSpentMin: number;
  discipline: Discipline;
  difficulty: Difficulty;
  completedAt: string; // ISO datetime
  skipped: boolean;
  note?: string;
}

export interface CheckIn {
  id: string;
  date: string; // ISO date
  energy: 1 | 2 | 3 | 4 | 5;
  focus: 1 | 2 | 3 | 4 | 5;
  mood: 1 | 2 | 3 | 4 | 5;
  sleepHrs: number;
  createdAt: string; // ISO datetime
}

export interface XpEvent {
  id: string;
  date: string; // ISO date
  amount: number;
  source: XpSource;
  discipline: Discipline;
  description?: string;
  createdAt: string; // ISO datetime
}

// ──────────────────────────── Gamification State ─────────────────────

export interface Streak {
  id: string;
  current: number; // Current consecutive days with tasks
  longest: number;
  lastDate: string; // ISO date of last activity
  freezeAvailable: number; // Number of streak freezes available
}

export interface Level {
  level: number;
  title: string;
  xpRequired: number; // Total XP needed for this level
  xpRequiredCumulative: number; // Cumulative XP threshold
}

export interface Hearts {
  id: string;
  current: number;
  max: number;
  graceUntil: string; // ISO datetime — 48h window extends each daily activity
  breakMode: boolean; // true when hearts === 0
  lastMissedDate?: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string; // Emoji or icon name
  condition: AchievementCondition;
  progress?: number; // 0–100 percentage
  unlocked: boolean;
  unlockedAt?: string;
  category: AchievementCategory;
}

export interface AchievementCondition {
  type: AchievementConditionType;
  target: number;
  discipline?: Discipline;
  xpSource?: XpSource;
}

export type AchievementConditionType =
  | 'total_xp'
  | 'streak_days'
  | 'tasks_completed'
  | 'discipline_tasks'
  | 'perfect_weeks'
  | 'check_ins'
  | 'hearts_saved'
  | 'recoveries';

export type AchievementCategory =
  | 'consistency'
  | 'discipline'
  | 'milestone'
  | 'recovery'
  | 'hidden';

// ──────────────────────────── Error Log ──────────────────────────────

export type ErrorCategory = 'L' | 'R' | 'D' | 'C' | 'F';

export interface ErrorLog {
  id: string;
  date: string; // ISO date
  category: ErrorCategory;
  description: string;
  details?: string;
  resolved: boolean;
  createdAt: string; // ISO datetime
}

// ──────────────────────────── Calibration ────────────────────────────

export interface Calibration {
  id: string;
  date: string; // ISO date
  taskId?: string;
  predictedMin: number;
  actualMin: number;
  discipline: Discipline;
  note?: string;
  createdAt: string;
}

// ──────────────────────────── Micro-Objective ────────────────────────

export interface MicroObjective {
  id: string;
  date: string; // ISO date
  text: string;
  completed: boolean;
  completedAt?: string;
}

// ──────────────────────────── Boss Battle ────────────────────────────

export interface BossBattle {
  id: string;
  week: number;
  completed: boolean;
  tasksCompleted: number;
  totalTasks: number;
  xpMultiplier: number; // 1.0 or 1.5
  bonusXpAwarded: number;
  completedAt?: string;
}

// ──────────────────────────── Settings ───────────────────────────────

export interface Settings {
  id: string;
  theme: 'dark' | 'red-dark';
  sessionTimerDefault: number; // minutes
  microObjectiveEnabled: boolean;
  dailyReminder: boolean;
  dataExportVersion: number;
  lastSyncedAt?: string;
}

// ──────────────────────────── Seed Data ──────────────────────────────

export interface SeedData {
  plans: SeedPlanEntry[];
  disciplines: DisciplineConfig[];
  achievements: AchievementDefinition[];
}

export interface SeedPlanEntry {
  plan: Plan;
  weeks: SeedWeekEntry[];
}

export interface SeedWeekEntry {
  week: number;
  phase: string;
  label: string;
  days: SeedDayEntry[];
}

export interface SeedDayEntry {
  day: number;
  label: string;
  title?: string;
  tasks: Omit<Task, 'id' | 'dayId'>[];
}

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  condition: AchievementCondition;
}
