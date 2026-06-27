import Dexie, { type EntityTable } from 'dexie';
import type {
  Plan,
  Day,
  TaskResult,
  CheckIn,
  XpEvent,
  Achievement,
  Hearts,
  ErrorLog,
  Calibration,
  Streak,
  Settings
} from '$lib/types';

export class ThirdLifeDB extends Dexie {
  plans!: EntityTable<Plan, 'id'>;
  days!: EntityTable<Day, 'id'>;
  taskResults!: EntityTable<TaskResult, 'id'>;
  checkIns!: EntityTable<CheckIn, 'id'>;
  xpEvents!: EntityTable<XpEvent, 'id'>;
  achievements!: EntityTable<Achievement, 'id'>;
  hearts!: EntityTable<Hearts, 'id'>;
  errorLogs!: EntityTable<ErrorLog, 'id'>;
  calibration!: EntityTable<Calibration, 'id'>;
  streak!: EntityTable<Streak, 'id'>;
  settings!: EntityTable<Settings, 'id'>;

  constructor() {
    super('ThirdLife');

    this.version(1).stores({
      plans: 'id',
      days: 'id, planId, day',
      taskResults: '++id, taskId, completedAt, discipline',
      checkIns: '++id, date',
      xpEvents: '++id, date, source, discipline',
      achievements: '++id, unlockedAt',
      hearts: 'id',
      errorLogs: '++id, category, date',
      calibration: '++id, date',
      streak: 'id',
      settings: 'id'
    });

    this.version(2).stores({
      plans: 'id',
      days: 'id, planId, day',
      taskResults: '++id, dayId, taskId, completedAt, discipline',
      checkIns: '++id, date',
      xpEvents: '++id, date, source, discipline',
      achievements: '++id, unlockedAt',
      hearts: 'id',
      errorLogs: '++id, category, date',
      calibration: '++id, date',
      streak: 'id',
      settings: 'id'
    });
  }
}

export const db = new ThirdLifeDB();
