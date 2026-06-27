# Design: Third-Life — Gamified Anti-Procrastination PWA

## Technical Approach

SvelteKit 5 static site (adapter-static) deployed to GitHub/Cloudflare Pages. All user data persists in IndexedDB via Dexie.js. Gamification logic lives in pure functions (no DOM/DB coupling), unit-tested with Vitest. Markdown study plans convert to JSON seed files once at build time via a Node script. PWA capabilities via vite-plugin-pwa.

```
┌─────────────────────────────┐
│   SvelteKit Static Site     │
│  ┌──────┐  ┌──────────────┐│
│  │Routes│  │Components (UI)││
│  └──┬───┘  └──────┬───────┘│
│     │              │        │
│  ┌──▼──────────────▼───────┐│
│  │      State (Svelte      ││
│  │    $state / $derived)   ││
│  └─────────┬───────────────┘│
└────────────┼────────────────┘
       ┌─────▼──────┐
       │ Repository │ ← Dexie.js (IndexedDB)
       │  Pattern   │
       └─────┬──────┘
       ┌─────▼──────┐
       │ Gamification│ ← Pure fns (calcXP,
       │  Engine    │   getLevel, etc.)
       └────────────┘
```

## Architecture Decisions

| Decision | Options | Tradeoff | Choice |
|----------|---------|----------|--------|
| State mgmt | Svelte 5 runes $state/$derived vs stores | Runes are idiomatic Svelte 5, simpler for component-local state. Stores add ceremony. | **$state / $derived** — component-local reactivity, no extra deps |
| DB access | Dexie repository vs raw IDB | Repository pattern isolates DB; swap-able for tests. More code but testable. | **Repository pattern** — `src/lib/db/repositories/` for testability |
| Gamification | Pure fns vs class-based | Pure functions are trivially testable, no mock setup. Function composition > inheritance. | **Pure functions** — `calcXP(difficulty, discipline) → number` |
| Build-time conversion | Inline script vs SvelteKit hook | Hook runs at build but couples seed to build lifecycle. Separate script is explicit. | **Separate Node script** — `scripts/convert-plans.mjs` → `src/data/seed/` |
| PWA caching | Pre-cache all (StaleWhileRevalidate) vs NetworkFirst | This app has no dynamic server data — all content is static bundles + IndexedDB. | **Pre-cache all static** — SW serves cached bundles; IndexedDB handles user data |
| Routing | SvelteKit file-based | Flat routes map to capabilities. No nested layouts needed since views are unrelated. | **5 top-level routes** — dashboard, progress, achievements, recovery, settings |

## Data Flow

```
IndexedDB (Dexie)
  ├─ plans, days, tasks         ← seed import (build-time JSON)
  ├─ taskResults, checkIns      ← user completes tasks
  ├─ xpEvents, achievements     ← gamification engine writes
  ├─ errorLogs, calibration     ← user + system logs
  │
  ▼
Repository Layer (src/lib/db/)
  ├─ getTodayTasks() → Task[]
  ├─ saveTaskResult(id, result)
  └─ getXpHistory(days) → XpEvent[]
  │
  ▼
Gamification Engine (pure fns)
  ├─ calcXP(task) → xpAwarded
  ├─ getLevel(totalXp) → Level
  ├─ checkAchievements(events) → Achievement[]
  └─ calcHearts(heartState) → Hearts
  │
  ▼
Svelte Components ($state / $derived)
  ├─ Dashboard → shows today, streak, XP, timer
  ├─ Progress → renders Chart.js with $derived data
  └─ Recovery → wizard state machine
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `svelte.config.js` | Create | SvelteKit config with adapter-static |
| `vite.config.ts` | Create | Vite + vite-plugin-pwa setup |
| `scripts/convert-plans.mjs` | Create | Node script: markdown → JSON seed |
| `src/data/seed/mes-1.json` | Create | Pre-converted Day 1-18 tasks |
| `src/data/seed/mes-2.json` | Create | Pre-converted Day 19-36 tasks |
| `src/data/seed/mes-3.json` | Create | Pre-converted Day 37-54 tasks |
| `src/data/seed/achievements.json` | Create | 15+ achievement definitions |
| `src/data/seed/disciplines.json` | Create | Discipline names, multipliers, colors |
| `src/app.html` | Create | Skeleton HTML with manifest link |
| `src/lib/db/schema.ts` | Create | Dexie schema (7 tables) |
| `src/lib/db/repositories/plans.ts` | Create | Plans CRUD, getTodayTasks |
| `src/lib/db/repositories/results.ts` | Create | TaskResults CRUD, XP history |
| `src/lib/db/repositories/hearts.ts` | Create | Heart state CRUD |
| `src/lib/db/repositories/seed.ts` | Create | Seed data import (first-visit check) |
| `src/lib/gamification/xp.ts` | Create | calcXP, getLevel, 14 level titles |
| `src/lib/gamification/streak.ts` | Create | calcStreak, streakFreeze |
| `src/lib/gamification/hearts.ts` | Create | calcHearts, graceWindow, breakMode |
| `src/lib/gamification/achievements.ts` | Create | checkAchievements, progress pct |
| `src/lib/gamification/boss-battle.ts` | Create | calcBossBattle, multiplier logic |
| `src/lib/gamification/calibration.ts` | Create | calcAccuracy, prediction vs actual |
| `src/lib/types.ts` | Create | All TypeScript interfaces |
| `src/lib/constants.ts` | Create | XP tables, level titles, heart limits |
| `src/routes/+layout.svelte` | Create | Shell nav, offline banner |
| `src/routes/+page.svelte` | Create | Daily Dashboard (default route) |
| `src/routes/progress/+page.svelte` | Create | Stats, charts, radar, calendar |
| `src/routes/achievements/+page.svelte` | Create | Achievement gallery |
| `src/routes/recovery/+page.svelte` | Create | Emergency wizard (3 steps) |
| `src/routes/settings/+page.svelte` | Create | Settings, data export |
| `src/lib/components/HeartDisplay.svelte` | Create | Hearts row (❤❤❤❤❤) |
| `src/lib/components/StreakBadge.svelte` | Create | Streak counter with icon |
| `src/lib/components/XpBar.svelte` | Create | XP progress to next level |
| `src/lib/components/TaskCard.svelte` | Create | Single task: checkbox, timer |
| `src/lib/components/CheckInForm.svelte` | Create | Energy/focus/mood/sleep sliders |
| `src/lib/components/LevelUpModal.svelte` | Create | Full-screen level-up celebration |
| `src/lib/components/BossBattleWidget.svelte` | Create | Sunday review widget |
| `src/lib/components/CalibrationSlider.svelte` | Create | Prediction vs actual slider |
| `src/lib/components/EmptyState.svelte` | Create | Reusable empty state component |
| `src/service-worker.ts` | Create | SW via vite-plugin-pwa inject |
| `static/manifest.json` | Create | Web App Manifest |
| `static/icons/*.png` | Create | 192/512 PWA icons |
| `static/offline.html` | Create | Offline fallback page |
| `src/tests/gamification/xp.test.ts` | Create | Unit tests: calcXP, getLevel |
| `src/tests/gamification/streak.test.ts` | Create | Unit tests: calcStreak |
| `src/tests/gamification/hearts.test.ts` | Create | Unit tests: calcHearts, breakMode |
| `src/tests/gamification/achievements.test.ts` | Create | Unit tests: unlock conditions |
| `src/tests/db/repository.test.ts` | Create | Integration: Dexie w/ fake-indexeddb |

## Interfaces / Contracts

```typescript
// src/lib/types.ts
interface Plan { id: string; name: string; totalDays: number; startDate: string; }
interface Day { id: string; planId: string; day: number; tasks: Task[]; }
interface Task { id: string; discipline: Discipline; difficulty: 'easy'|'medium'|'hard';
  description: string; durationMin: number; order: number; }
interface TaskResult { id: string; taskId: string; completed: boolean; xpAwarded: number;
  timeSpentMin: number; discipline: Discipline; completedAt: string; }
interface CheckIn { id: string; date: string; energy: 1|2|3|4|5; focus: 1|2|3|4|5;
  mood: 1|2|3|4|5; sleepHrs: number; }
interface XpEvent { id: string; date: string; amount: number; source: XpSource;
  discipline: Discipline; }
interface Achievement { id: string; name: string; description: string; icon: string;
  condition: (events: XpEvent[], results: TaskResult[]) => boolean; }
interface Hearts { current: number; max: number; graceUntil: string; breakMode: boolean; }
interface Calibration { id: string; date: string; predictedMin: number; actualMin: number; }
```

## Database Schema

| Dexie Table | Key | Indexes | Purpose |
|-------------|-----|---------|---------|
| `plans` | `planId` | — | Plan metadata |
| `days` | `dayId` | `planId`, `day` | Daily task lists |
| `taskResults` | `+id` | `taskId`, `completedAt` | Completion log |
| `checkIns` | `+id` | `date` | Daily check-in |
| `xpEvents` | `+id` | `date`, `source` | XP ledger (event-sourced) |
| `achievements` | `+id` | `date` | Unlocked achievements |
| `hearts` | `+id` | — | Current heart state (singleton) |
| `errorLogs` | `+id` | `category`, `date` | Error & recovery events |
| `calibration` | `+id` | `date` | Prediction vs actual |
| `streak` | `+id` | — | Current streak state |

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| **Unit** | Gamification fns (xp, level, streak, hearts, achievements, boss-battle) | Vitest — pure fns need no mocks. Test all H + E scenarios from spec. |
| **Integration** | Dexie repositories (CRUD, seeding, query) | Vitest + fake-indexeddb. Mock IDB in memory, test each repo. |
| **Component** | TaskCard, HeartDisplay, LevelUpModal, RecoveryWizard | Vitest + @testing-library/svelte. Render + assert DOM states. |
| **E2E** | Full flow: load app → complete task → see XP → level up | Manual or Playwright on static build. Limited scope for MVP. |

## Migration / Rollout

No migration required — this is a greenfield app with no prior state. **First visit flow:**
1. App loads → `seed.ts` checks `await db.plans.count()`
2. If 0 → import JSON seed files into Dexie
3. If >0 → normal load (subsequent visits)
4. Future plans added by placing JSON in `src/data/seed/` and re-deploying

## Open Questions

- [ ] Confirm whether Chart.js must render SSR-safe (disable for static export — client-side only)
- [ ] Confirm daisyUI theme name and any custom color overrides (default: `dark`?)
- [ ] Confirm hosting target: GitHub Pages vs Cloudflare Pages (affects adapter-static config)
