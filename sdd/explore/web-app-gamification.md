# Exploration: Web App Gamificada Anti-Procrastinación

> Basada en el plan de estudio existente (3 meses, 3 idiomas + música)
> Fecha: 26 Junio 2026
> Proyecto: proyecto-web

---

## Current State

El plan de estudio existe como **archivos markdown** en `Plan_de_Estudio/` con:
- `mes-1-completo.md` (2764 líneas): Plan completo del Mes 1 con 4 semanas, cada día con actividades detalladas, checklists, métricas, error logs y streak trackers embebidos
- `micro-objetivos.md`: Framework SMART de objetivos diarios con predicción y autoevaluación
- `seguimiento.md`: Sistema de tracking — streak tracker global, error log global, check-ins diarios (energía, foco, ánimo), calibración metacognitiva semanal, implementación de intenciones, reflexión semanal, resumen final
- `hitos-reales.md`: Hitos de progreso por nivel CEFR (lectura, escucha, japonés, música)
- `emergencia.md`: Protocolo de recuperación para 1-2 días, 3-5 días, 1+ semana perdidos, burnout
- `protocolo-dopamina.md`: Sistema de recompensas con puntos semanales, rutina diaria de dopamina
- `growth-deep-dive.md`: Reporte de mejora con 18 skills, micro-hábitos, y upgrades recomendados
- `mes-2.md`, `mes-3.md`, `mes-2-diseno.md`, `mes-3-diseno.md`: Planes extendidos para meses 2 y 3
- `recursos.md`: Todos los links de recursos organizados
- `motor-aprendizaje.md`: Base científica del plan

**Problema actual**: Todo es manual. No hay tracking automático, no hay visualización de progreso, no hay gamificación. El estudiante debe tildar checklists en papel/markdown, calcular streaks manualmente, mantener error logs por su cuenta.

---

## Affected Areas

### Datos a extraer del markdown:

| Archivo | Datos que contiene |
|---------|-------------------|
| `mes-1-completo.md` | Estructura completa: 4 semanas × 7 días, actividades por día (Reading, Speaking, Listening, Grammar, Anki vocab, Minimal Pairs, Music Note ID, Rhythm), checklists, métricas semanales, streak trackers, error logs |
| `micro-objetivos.md` | Objetivos SMART con verbo observable, criterio de éxito, autoevaluación, predicción vs resultado, brechas |
| `seguimiento.md` | Daily check-in template (energía/foco/ánimo 1-5), streak tracker (12 semanas), error log global con categorías, calibración metacognitiva semanal, implementación de intenciones semanal, reflexión semanal |
| `hitos-reales.md` | 12 milestones con pruebas de verificación, tabla resumen semanal, hitos emocionales por semana |
| `emergencia.md` | Protocolos de recuperación por días perdidos, checklist de retorno, micro-hábitos anti-ruptura |
| `protocolo-dopamina.md` | Sistema de puntos (1 punto por checklist completo), recompensas semanales (7/7 → especial, 5-6/7 → normal, 3-4/7 → neutro, 0-2/7 → nada) |
| `growth-deep-dive.md` | Anki interval tuning, error log con root cause, upgrade de hábitos |

---

## Domain Model Extraction

### Core Entities

```
Plan
├── id: string (e.g. "3-meses")
├── name: string
├── total_days: number (84)
├── start_date: date
└── months: Month[]

Month
├── number: 1 | 2 | 3
├── name: string
├── start_week: number
└── weeks: Week[]

Week
├── number: 1..12
├── theme: string
├── objectives: Objective[]
├── focus_disciplines: Discipline[]
└── days: Day[]

Day
├── number: 1..84
├── date: date
├── day_type: "study" | "rest" | "evaluation" | "course"
├── blocks: Block[] (time-ordered)
└── disciplines: Discipline[]

Block
├── discipline: Discipline
├── activity_type: ActivityType
├── duration_min: number
├── resources: Resource[]
├── tasks: Task[]
└── order: number

Discipline: "english" | "japanese" | "music"

ActivityType
├── english: "reading" | "speaking" | "listening" | "grammar" | "vocabulary" | "minimal_pair" | "self_recording" | "review"
├── japanese: "hiragana" | "katakana" | "kanji" | "vocabulary" | "dictation" | "reading" | "writing"
└── music: "note_id" | "rhythm" | "sight_reading" | "theory" | "ear_training"

Task
├── id: string
├── description: string
├── micro_objective: MicroObjective
├── estimated_min: number
├── resources: ResourceLink[]
└── order: number

MicroObjective (SMART)
├── verb: ObservableVerb (read | write | introduce | ask_answer | catch | clap | name | find | summarize | ...)
├── what: string
├── context: string
├── success_criteria: SuccessCriteria
├── prediction: number | null
├── result: number | null
└── gaps: string | null

SuccessCriteria
├── metric: string (e.g. "18/20", "4/5", "<60s")
├── condition: string (e.g. "en <2s cada uno", "sin pausas >3s")
└── min_score: number (percentage 0-100)

ResourceLink
├── title: string
├── url: string
└── type: "reading" | "listening" | "practice" | "reference"
```

### Progress & Tracking Entities

```
DailyCheckIn
├── date: date
├── day_id: number
├── energy: 1..5
├── focus: 1..5
├── mood: 1..5
├── completed: { discipline: boolean }[]
├── sleep_hours: number
├── anki_reviewed: boolean
├── notes: string
└── completed_tasks: TaskResult[]

TaskResult
├── task_id: string
├── status: "done" | "partial" | "skipped" | "failed"
├── calibration_prediction: number | null
├── calibration_result: number | null
├── notes: string
└── timestamp: datetime

Streak
├── current: number (consecutive days with all required disciplines)
├── longest: number
├── history: { start: date, end: date, length: number }[]
├── last_checkin_date: date
└── grace_remaining: number (48h grace window)

ErrorLog
├── id: string
├── date: date
├── discipline: Discipline
├── error: string
├── correction: string
├── category: "grammar" | "pronunciation" | "visual" | "rhythm" | "consistencia" | "horario" | "calidad" | "entorno" | "salud" | "motivacion" | "planificacion"
├── root_cause: "L" | "R" | "D" | "C" | "F" (Lack of knowledge, Rush, Distraction, Confusion, Fatigue)
└── notes: string

CalibrationEntry
├── week: number
├── discipline: Discipline
├── test_name: string
├── prediction: number
├── actual: number
├── max_score: number
└── gap: number (|prediction - actual|)

ImplementationIntention
├── week: number
├── discipline: Discipline
├── time: string
├── location: string
├── fulfilled: boolean | null
└── day_of_week: DayOfWeek
```

### Gamification Entities

```
XPTransaction
├── date: datetime
├── amount: number
├── source: XPSource
├── discipline: Discipline | null
└── multiplier: number (streak bonus, etc.)

XPSource
├── "task_complete" (base: 10 XP per task)
├── "day_complete" (bonus: 25 XP for full day)
├── "week_complete" (bonus: 50 XP for full week)
├── "streak_day" (bonus: streak_length * 5 XP)
├── "calibration_accuracy" (bonus: 10 XP if gap < 2)
├── "error_logged" (5 XP per entry)
├── "self_recording" (15 XP)
├── "evaluation_passed" (100 XP)
├── "month_complete" (200 XP)
├── "achievement_unlocked" (varies)
└── "recovery_completed" (50 XP)

Level
├── level: number (1..50+)
├── title: string
├── xp_required: number
├── xp_current: number
└── rewards_unlocked: Reward[]

LevelTitles: [
  { level: 1, title: "Novato" },
  { level: 3, title: "Estudiante" },
  { level: 5, title: "Aprendiz" },
  { level: 8, title: "Dedicado" },
  { level: 10, title: "Persistente" },
  { level: 13, title: "Disciplinado" },
  { level: 15, title: "Hiragana Master" },  // after completing hiragana
  { level: 18, title: "Grammarian" },
  { level: 20, title: "Sin Pausa" },  // streak-based
  { level: 25, title: "Políglota en Progreso" },
  { level: 30, title: "Ritmo Interior" },
  { level: 35, title: "Imparable" },
  { level: 42, title: "Hábito Vivo" },
  { level: 50, title: "Maestro del Plan" },
]

Achievement (minimum 15)
├── id: string
├── name: string
├── description: string
├── icon: string
├── condition: AchievementCondition
├── xp_reward: number
├── unlocked_at: datetime | null
└── progress: number (0-100%)

Achievements: [
  // First steps
  { id: "first_day", name: "Primer Día", desc: "Completaste tu primer día de estudio", condition: { type: "days_completed", count: 1 }, xp: 25 },
  { id: "first_week", name: "Semana 1", desc: "Completaste tu primera semana completa", condition: { type: "weeks_completed", count: 1 }, xp: 50 },
  { id: "first_recording", name: "Tu Voz", desc: "Hiciste tu primera self-recording", condition: { type: "recordings", count: 1 }, xp: 30 },
  
  // Streak achievements
  { id: "streak_3", name: "Racha de 3", desc: "3 días consecutivos", condition: { type: "streak", days: 3 }, xp: 40 },
  { id: "streak_7", name: "Semana Perfecta", desc: "7 días consecutivos", condition: { type: "streak", days: 7 }, xp: 100 },
  { id: "streak_14", name: "Dos Semanas", desc: "14 días consecutivos", condition: { type: "streak", days: 14 }, xp: 150 },
  { id: "streak_30", name: "Mes Imparable", desc: "30 días consecutivos", condition: { type: "streak", days: 30 }, xp: 300 },
  { id: "streak_60", name: "Dos Meses", desc: "60 días consecutivos (con grace)", condition: { type: "streak", days: 60 }, xp: 500 },
  { id: "streak_84", name: "Plan Completado", desc: "84 días — completaste el plan completo", condition: { type: "streak", days: 84 }, xp: 1000 },
  
  // Discipline milestones
  { id: "hiragana_20", name: "Hiragana Iniciado", desc: "20 hiragana reconocidos", condition: { type: "kana", count: 20 }, xp: 100 },
  { id: "hiragana_46", name: "Hiragana Completo", desc: "46 hiragana básicos dominados", condition: { type: "kana", count: 46 }, xp: 250 },
  { id: "hiragana_61", name: "Dakuon Master", desc: "61 caracteres de hiragana dominados", condition: { type: "kana", count: 61 }, xp: 300 },
  { id: "vocab_100", name: "100 Palabras", desc: "100 palabras de vocabulario en Anki", condition: { type: "vocabulary", count: 100 }, xp: 150 },
  { id: "vocab_500", name: "Medio Millar", desc: "500 palabras acumuladas", condition: { type: "vocabulary", count: 500 }, xp: 400 },
  
  // Recovery achievements
  { id: "comeback", name: "Fénix", desc: "Volviste después de perder 3+ días usando el protocolo de emergencia", condition: { type: "recovery", count: 1 }, xp: 50 },
  { id: "perfect_recovery", name: "Resiliencia", desc: "Regresaste y completaste la semana después de una pausa", condition: { type: "recovery_week", count: 1 }, xp: 100 },
  
  // Evaluation achievements
  { id: "month1_pass", name: "Mes 1 Completado", desc: "Aprobaste la evaluación del Mes 1", condition: { type: "month_passed", month: 1 }, xp: 200 },
  { id: "month2_pass", name: "Mes 2 Completado", desc: "Aprobaste la evaluación del Mes 2", condition: { type: "month_passed", month: 2 }, xp: 300 },
  { id: "month3_pass", name: "Plan Completado 🎉", desc: "COMPLETASTE LOS 3 MESES", condition: { type: "month_passed", month: 3 }, xp: 500 },

  // Quality achievements
  { id: "calibration_expert", name: "Metacognitivo", desc: "Gap de calibración <2 en 4 tests seguidos", condition: { type: "calibration_streak", count: 4 }, xp: 100 },
  { id: "error_logger", name: "Detective", desc: "30 errores registrados en el error log", condition: { type: "errors_logged", count: 30 }, xp: 75 },
  { id: "perfect_week", name: "Semana Dorada", desc: "Checklist completo 7/7 días en una semana", condition: { type: "perfect_week", count: 1 }, xp: 200 },
  { id: "shadowing_pro", name: "Shadowing Pro", desc: "Completaste 20 ejercicios de shadowing", condition: { type: "shadowing", count: 20 }, xp: 100 },
]

HP / Hearts
├── max_hearts: 5
├── current_hearts: number
├── lost_per_missed_day: 1
├── recovery_per_study_day: 0.5 (rounded up)
├── break_condition: all_hearts_lost → "break mode" (emergency protocol triggered)
└── grace_period: 48h (no heart loss within 48h of last study)

RewardSystem
├── daily_reward: "recompensa normal" (30 min de algo que guste)
├── weekly_score: number (points from checklists)
├── weekly_brackets: [
    { min: 7, reward: "especial" },
    { min: 5, max: 6, reward: "normal" },
    { min: 3, max: 4, reward: "neutro" },
    { max: 2, reward: "nada" }
  ]
└── custom_rewards: UserDefinedReward[]
```

---

## Tech Stack Recommendation

### Approach A: SvelteKit + Dexie.js + Chart.js (RECOMMENDED)

| Layer | Technology | Why |
|-------|-----------|-----|
| **Framework** | Svelte 5 (with runes) | Reactive, compile-time, minimal boilerplate, excellent for data-heavy UIs |
| **Meta-framework** | SvelteKit (static adapter) | File-based routing, SSR for PWA shell, static export for GitHub Pages |
| **Local DB** | Dexie.js (IndexedDB wrapper) | Reactive queries, versioned schema, simple API for complex data |
| **Charts** | Chart.js + chartjs-plugin-datalabels | Lightweight, great for streak heatmaps, XP progression, discipline radar |
| **PWA** | vite-plugin-pwa | Service worker, offline support, install prompt |
| **State** | Svelte stores (writable) + Dexie live queries | No need for extra state management; Dexie reactively syncs with IndexedDB |
| **CSS** | Tailwind CSS 4 + daisyUI | Rapid UI, gamified aesthetic, dark mode built-in |
| **Testing** | Vitest + Playwright | Fast unit tests, component testing, E2E for critical flows |

**Effort**: Medium (2-3 weeks for MVP)
**Pros**:
- Reactive by default — UI updates when IndexedDB changes
- Tiny bundle size (Svelte is ~2KB gzipped)
- Excellent offline support
- TypeScript-first
- Svelte stores + Dexie live queries = reactive data layer with zero boilerplate

**Cons**:
- Smaller ecosystem than React
- Fewer gamification-specific libraries
- Team may need to learn Svelte

### Approach B: React + localStorage + Zustand

| Layer | Technology | Why |
|-------|-----------|-----|
| **Framework** | React 19 | Ubiquitous, huge ecosystem |
| **Vite** | Vite (PWA plugin) | Fast builds, PWA support |
| **State** | Zustand 5 | Simple, TypeScript-first, persist middleware |
| **Storage** | localStorage via Zustand persist | Dead simple, no async complexity |
| **Charts** | Recharts | React-native charting, composable |
| **PWA** | vite-plugin-pwa | Same as above |
| **CSS** | Tailwind CSS 4 | Same |
| **Testing** | Vitest + Testing Library | Standard React testing |

**Effort**: Medium-High (3-4 weeks for MVP)
**Pros**:
- Huge ecosystem, many gamification examples
- Zustand persist is trivial to set up
- Recharts integrates naturally with React

**Cons**:
- localStorage has 5MB limit (may be tight with error logs + check-ins + XP history)
- No reactive queries — manual state management for computed data
- More boilerplate than Svelte
- Bundle size larger

### Approach C: Vanilla JS + IndexedDB (direct)

Not recommended. The data model is complex enough that a framework provides real value in reactivity and maintainability.

---

## Data Model Design

### Storage Schema (Dexie.js / IndexedDB)

```
Database: StudyPlanDB v1

stores:
  + days: "++id, date, month, week, dayOfWeek"
  + tasks: "++id, dayId, discipline, activityType, status"
  + checkins: "++id, date, dayId"  // daily energy/focus/mood
  + streaks: "++id, type"  // singleton for current, history array
  + xp: "++id, date, source"
  + achievements: "++id, conditionId"  // singleton per achievement
  + errorLog: "++id, date, discipline"
  + calibration: "++id, week, discipline"
  + intentions: "++id, week, discipline"
  + settings: "++id"  // singleton

Computed (not stored — calculated on read):
  - Current level from total XP
  - Streak length from consecutive day completions
  - Weekly/monthly completion rates
  - Calibration accuracy over time
```

### How markdown becomes JSON

The markdown study plan is **imported as seed data**, not parsed at runtime. A build-time script converts `mes-1-completo.md` → `src/data/mes-1.json`. This is a one-time conversion because the plan is static (it doesn't change day-to-day — only the user's progress through it changes).

The JSON structure:
```json
{
  "months": [
    {
      "number": 1,
      "weeks": [
        {
          "number": 1,
          "days": [
            {
              "number": 1,
              "disciplines": ["english", "music"],
              "blocks": [
                {
                  "discipline": "english",
                  "activity": "reading",
                  "duration": 15,
                  "tasks": [
                    { "description": "Leer 'My town' en British Council A2", "microObjective": { "verb": "find", ... } }
                  ]
                }
              ],
              "checklist": [
                "Leí 'My town'...",
                "5 palabras nuevas en Anki...",
                ...
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

### XP and Level Calculation

```
Level threshold formula:
  xp_required(level) = 100 * level * (1 + level * 0.1)
  
  Level 1: 110 XP
  Level 2: 240 XP
  Level 5: 750 XP
  Level 10: 2000 XP
  Level 20: 6000 XP
  Level 50: 30000 XP (approx total for 84 days of full compliance)

Daily XP potential (full day): ~150-200 XP
  - 4-5 tasks × 10 XP = 40-50
  - Day completion bonus = 25
  - Streak bonus (day 7) = 35
  - Self-recording = 15
  - Error log = 5-10
  - Total daily: ~85-135

Monthly XP potential: ~2500-4000 XP (enough for level ~15 after month 1)

Weekly Boss Battle: 
  - Sunday review session treated as a "boss"
  - XP multiplier: 1.5× for all tasks completed that day
  - Bonus 50 XP if ALL week tasks are complete
```

---

## Gamification System Design

### XP Calculation

| Action | Base XP | Multiplier |
|--------|---------|-----------|
| Complete a task | 10 | Streak: +1× per 7 days |
| Complete all tasks in a day | 25 | — |
| Complete all days in a week | 50 | — |
| Maintain streak (per day) | streak_length × 5 | — |
| Self-recording | 15 | — |
| Error log entry | 5 | — |
| Calibration gap < 2 | 10 | — |
| Pass evaluation | 100 | Month multiplier: ×2 for month 2, ×3 for month 3 |
| Complete month | 200 | — |
| Recovery protocol | 50 | — |

### Level Titles (English in UI, since the app is about studying English)

```
Niveles temáticos de videojuego:
1-2:  Novato (Newbie)
3-4:  Estudiante (Student)
5-7:  Aprendiz (Learner)
8-9:  Dedicado (Dedicated)
10-12: Persistente (Persistent)
13-14: Disciplinado (Disciplined)
15-17: Hiragana Master
18-19: Grammarian
20-24: Sin Pausa (Unstoppable)
25-29: Políglota en Progreso
30-34: Ritmo Interior
35-41: Imparable 
42-49: Hábito Vivo
50:    Maestro del Plan
```

### Streak Mechanics

- **Streak grows**: Each day with all required disciplines completed
- **Streak grace**: 48h window — missing a day within 48h doesn't break streak (matches existing plan's "recuperación en 48h sin penalización")
- **Heart system**: 5 hearts. Lose 1 per missed day (after grace). Recover 0.5 per study day (rounds up). At 0 hearts → "Break Mode" (emergency protocol auto-triggered)
- **Visual**: Fire emoji that grows with streak length (🔥 → 🔥🔥 → 🔥🔥🔥 + different colors)
- **Streak milestones**: 3, 7, 14, 30, 60, 84 days — each with achievement unlock

### Boss Battles (Weekly Reviews)

Every Sunday (review day) becomes a **Boss Battle**:
- The "boss" is the weekly evaluation
- Must complete the weekly review/test to "defeat" the boss
- Weekly metrics become boss HP
- XP multiplier: 1.5× for defeating the boss
- Special animation/feedback on completion

### Visual Feedback Patterns

- **Task completion**: Smooth checkmark animation + micro XP float (+10)
- **Level up**: Full screen celebration with level title reveal
- **Streak fire**: Progressive fire emoji based on streak length
- **Heart loss**: Heartbreak animation with gentle (not punishing) feedback
- **Boss battle**: Progress bar showing weekly completion vs. HP
- **Recovery**: Warm, encouraging colors when using emergency protocol (no punishment)
- **Achievement unlock**: Badge reveal with sound/vibration on mobile

---

## UX Architecture

### Screens / Views

```
1. DASHBOARD (Today's View)
   ├── Current day's disciplines and tasks
   ├── Quick-action checklist with checkboxes
   ├── Streak counter + hearts (top)
   ├── XP bar + level (top)
   ├── Today's micro-objective (if set)
   ├── Timer for current block
   └── "Start Session" button

2. PLAN VIEWER
   ├── Month selector (1/2/3)
   ├── Week selector (1-12)
   ├── Day grid (calendar view)
   ├── Color legend: green=done, yellow=partial, red=missed, gray=future
   └── Click day → expand tasks

3. STATS & PROGRESS
   ├── XP history chart (last 7/30/84 days)
   ├── Discipline radar (completion % per discipline)
   ├── Streak history (calendar heatmap)
   ├── Calibration accuracy over time
   └── Weekly completion % bars

4. ACHIEVEMENTS GALLERY
   ├── Grid of badges (locked/unlocked)
   ├── Progress toward next achievements
   ├── Total XP / level display
   └── Sound/vibration on unlock

5. ERROR LOG
   ├── Table view with filters (discipline, category, date)
   ├── Root cause analysis (pie chart)
   ├── "Log error" quick-add button
   └── Weekly pattern detection

6. CHECK-IN
   ├── Energy/Focus/Mood sliders (1-5)
   ├── Sleep hours input
   ├── Daily notes (optional text area)
   └── Appears automatically at end of day

7. EMERGENCY / RECOVERY
   ├── Protocol wizard: "How many days did you miss?"
   ├── Guided recovery steps
   ├── Auto-adjust dates
   └── Encouraging copy throughout

8. SETTINGS
   ├── Custom study time preferences
   ├── Reward configuration
   ├── Notification settings
   ├── Data export (JSON)
   └── Reset progress

9. IMPLEMENTATION INTENTIONS
   ├── Weekly schedule grid (time + location per discipline)
   ├── "Fulfilled?" checkbox
   └── Auto-suggest based on patterns
```

### Information Architecture

```
┌─────────────────────────────────────────────┐
│  Bottom Tab Navigation:                      │
│  📅 Today  📊 Stats  🏆 Achievements  ⚙️     │
├─────────────────────────────────────────────┤
│  Today is the PRIMARY view.                  │
│  Stats is the SECONDARY view (rewards).      │
│  Achievements = dopamine hits.               │
│  Error log accessible from Stats or Today.   │
│  Emergency accessed from error states.       │
│  Check-in = modal at end of day.             │
└─────────────────────────────────────────────┘
```

### Wireframe (text)

```
DASHBOARD VIEW (Mobile-first):

┌─────────────────────────┐
│  🔥🔥 Racha 7  ❤❤❤❤❤  │  ← top bar
│  Nivel 8: Dedicado      │
│  ████████░░░ 820/1100 XP│
├─────────────────────────┤
│ HOY — Jueves 18 Jun     │
│ 🇬🇧 Inglés + 🎵 Música   │
│                         │
│ ⏱️ 40 min estimados      │
│                         │
│ [▶ Iniciar Sesión]      │
│                         │
│ Tareas de hoy:          │
│ ☐ Reading: "My town" 15'│
│ ☐ Speaking: 5x intro 10'│
│ ☐ Listening: 10'        │
│ ☐ Minimal pair: 3'      │
│ ☐ Anki vocab: 5'        │
│ ☐ Music Note ID: 5'     │
│ ☐ Rhythm Kodály: 5-10'  │
│ ☐ Implementation intent  │
│ ☐ Pre-sleep review      │
│ ☐ 💤 7-8h               │
│                         │
│ 🎯 Micro-objetivo:       │
│ "Find 3 facts from text" │
│ Predicción: _/3         │
├─────────────────────────┤
│ [📝 Error del día]       │
│ [💤 Check-in nocturno]   │
│ [📱 Siguiente día →]     │
└─────────────────────────┘
```

---

## Testing & Quality Strategy

### Framework Selection

| Layer | Tool | Why |
|-------|------|-----|
| Unit tests | Vitest | Fast, TypeScript-native, compatible with Svelte |
| Component tests | @testing-library/svelte | User-centric testing approach |
| E2E tests | Playwright | Industry standard, great PWA support |
| Storage tests | fake-indexeddb | Mock IndexedDB for unit tests without browser |
| Gamification logic | Vitest (pure functions) | XP calc, streak math, level thresholds are pure functions |

### What to Test

**Unit tests (critical path)**:
- `calculateXP(taskType, streakLength, multipliers)` → correct XP
- `updateStreak(lastCheckinDate, currentDate, gracePeriod)` → correct streak
- `calculateLevel(totalXP)` → correct level and progress
- `checkAchievementUnlocks(state, achievements)` → correct triggers
- `heartSystem(missedDays, graceUsed)` → correct heart count
- `calibrationGap(prediction, actual)` → correct gap

**Component tests**:
- Dashboard renders today's tasks correctly
- Checklist updates completion status
- XP bar animates correctly
- Streak counter display

**Storage tests**:
- Dexie schema migrations work
- Data persists across page reloads (in test env)
- Export/import cycle preserves data

### Patterns

- Separate gamification logic into **pure functions** (no DOM, no storage dependencies)
- Use **repository pattern** for storage access (easy to swap localStorage ↔ IndexedDB)
- **State machine** pattern for daily flow (idle → studying → check-in → done)
- **Event sourcing** for XP (each transaction stored, level = computed)

---

## Recommendation

**Approach A (SvelteKit + Dexie.js + Chart.js)** is the clear winner for this project.

**Rationale**:
1. **Reactive data model**: Dexie's live queries mean the UI automatically reflects any IndexedDB change — perfect for a local-first app where all state is in the browser
2. **Small bundle**: Svelte's compile-time approach produces tiny bundles, critical for a PWA that needs to load fast even on slow connections
3. **Svelte 5 runes**: `$state`, `$derived`, `$effect` make reactive programming intuitive without hooks or dependency arrays
4. **SvelteKit static adapter**: Deploy to GitHub Pages or Cloudflare Pages with zero server cost
5. **Ecosystem maturity**: Dexie is battle-tested (used in production by many PWAs); Chart.js is the gold standard for web charts

### Architecture Blueprint

```
proyecto-web/
├── src/
│   ├── routes/           (SvelteKit pages)
│   │   ├── +page.svelte  (Dashboard)
│   │   ├── stats/
│   │   ├── achievements/
│   │   ├── error-log/
│   │   ├── plan/
│   │   └── settings/
│   ├── lib/
│   │   ├── db/
│   │   │   ├── schema.ts      (Dexie schema definition)
│   │   │   ├── seed.ts        (Import markdown → JSON)
│   │   │   └── repositories/  (CRUD operations)
│   │   ├── gamification/
│   │   │   ├── xp.ts          (Pure XP calculation)
│   │   │   ├── levels.ts      (Level thresholds)
│   │   │   ├── streak.ts      (Streak logic)
│   │   │   ├── hearts.ts      (Heart system)
│   │   │   └── achievements.ts (Achievement checks)
│   │   ├── components/
│   │   │   ├── StreakDisplay.svelte
│   │   │   ├── LevelBar.svelte
│   │   │   ├── TaskChecklist.svelte
│   │   │   ├── AchievementCard.svelte
│   │   │   ├── CalibrationForm.svelte
│   │   │   ├── ErrorLogForm.svelte
│   │   │   └── HeartDisplay.svelte
│   │   ├── stores/
│   │   │   ├── session.ts     (Current day state)
│   │   │   └── ui.ts          (Theme, modals, etc.)
│   │   └── types/
│   │       └── index.ts       (TypeScript interfaces)
│   ├── data/
│   │   ├── seed/
│   │   │   ├── mes-1.json     (Pre-converted study plan)
│   │   │   └── achievements.json (Achievement definitions)
│   │   └── disciplines.json   (Discipline definitions)
│   └── app.html
├── static/
│   ├── manifest.json
│   ├── icons/
│   └── sw.js                 (Generated by vite-plugin-pwa)
├── svelte.config.js
├── vite.config.ts
├── tailwind.config.ts
└── package.json
```

---

## Risks

| Risk | Impact | Mitigation |
|------|--------|-----------|
| **Svelte learning curve** | Slower initial development | Start with simple TodoList prototype to learn; Svelte has shallow learning curve |
| **IndexedDB limits exceeded** | Data loss or performance degradation with 84 days of detailed logs | Estimate total data: ~50KB for plan + ~500KB for 84 days of check-ins + ~200KB for error logs. Well under IndexedDB limits (typically 50MB+ depending on browser) |
| **Offline-first complexity** | Race conditions with service worker | Keep it simple: no sync, no server. Read-only plan + local-only progress = no conflict |
| **Gamification overdose** | User plays the game instead of studying | Design XP to reward COMPLETION, not grinding. No XP for re-doing tasks. Focus on streaks over points. |
| **Abandonment compulsion** | User feels bad about lost streak and abandons entirely | Grace period (48h), heart system, "Fénix" achievement for returning — design for recovery, not perfection |
| **Data portability** | User can't export their progress | Add JSON export in settings from day one. Plain JSON = always portable. |

---

## Ready for Proposal

**Yes**. The analysis is exhaustive enough to move to the proposal phase. The orchestrator should:

1. Confirm the tech stack choice (SvelteKit + Dexie.js) with the user
2. Start the seed data conversion script (markdown → JSON)
3. Begin implementation with the data layer (Dexie schema + types first)
4. Build the gamification logic as pure functions (testable before UI)
5. Then build UI screens in order: Dashboard → Stats → Achievements → Error Log → Settings

### Key Decisions the Proposal Should Cover

- SvelteKit vs pure Svelte (do we need routing? Yes — 5+ screens)
- Dexie schema versioning strategy for future plan extensions (Mes 2, Mes 3)
- Whether to build the seed data converter as a script or manually hand-craft the JSON
- Heart system forgiveness: 48h grace or absolute count?
- Notification strategy: daily reminders via service worker?
- Dark mode by default? (teenager, evening study sessions)
