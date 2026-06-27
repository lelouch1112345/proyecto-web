# Tasks: Third-Life — Gamified Anti-Procrastination PWA

## Review Workload Forecast

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

| Field | Value |
|-------|-------|
| Estimated changed lines | ~6000–8000 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (Foundation) → PR 2 (Engine+Tests) → PR 3 (Core UI) → PR 4 (Ext Features+PWA) → PR 5 (Polish) |

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Project init + DB schema + seed data + types | PR 1 | `main` base; no deps |
| 2 | Gamification engine (pure fns) + all unit tests | PR 2 | Depends on types from PR 1 |
| 3 | Dashboard + task flow + gamification UI + progress page | PR 3 | Depends on engine from PR 2 |
| 4 | Achievements + emergency recovery + settings + PWA | PR 4 | Depends on routes from PR 3 |
| 5 | Error log, data export/import, onboarding, integration tests | PR 5 | Depends on all prior |

## Phase 1: Foundation

- [x] 1.1 Init SvelteKit 5 project with `adapter-static`, Tailwind 4, daisyUI, Dexie.js, Chart.js, `vite-plugin-pwa`
- [x] 1.2 Create `src/lib/types.ts` — all interfaces (Plan, Day, Task, TaskResult, CheckIn, XpEvent, Achievement, Hearts, Calibration)
- [x] 1.3 Create `src/lib/constants.ts` — XP tables, 14 level titles, heart limits, discipline multipliers
- [x] 1.4 Create `src/lib/db/schema.ts` — Dexie schema with 10 tables (plans, days, taskResults, checkIns, xpEvents, achievements, hearts, errorLogs, calibration, streak)
- [x] 1.5 Create `src/lib/db/repositories/` — plans.ts, results.ts, hearts.ts, seed.ts (CRUD + query methods)
- [x] 1.6 Write `scripts/convert-plans.mjs` — parse `Plan_de_Estudio/mes-*.md` → JSON seed files
- [x] 1.7 Create `src/data/seed/` — mes-1.json, mes-2.json, mes-3.json, achievements.json, disciplines.json

## Phase 2: Gamification Engine

- [x] 2.1 Create `src/lib/gamification/xp.ts` — calcXP(difficulty, discipline), getLevel(totalXp), 14 level titles, daily XP cap, streak milestone bonuses
- [x] 2.2 Create `src/lib/gamification/streak.ts` — calcStreak(history), streakFreeze logic, freeze replenishment
- [x] 2.3 Create `src/lib/gamification/hearts.ts` — calcHearts(state, missedDays), graceWindow, breakMode, recovery
- [x] 2.4 Create `src/lib/gamification/achievements.ts` — checkAchievements(events, results), progress pct, initial state
- [x] 2.5 Create `src/lib/gamification/boss-battle.ts` — calcBossBattle(results), 1.5× multiplier, pass threshold
- [x] 2.6 Create `src/lib/gamification/calibration.ts` — calcAccuracy(predicted, actual), trend detection
- [x] 2.7 Write `src/tests/gamification/xp.test.ts` — H1 + E1 scenarios (44 tests)
- [x] 2.8 Write `src/tests/gamification/streak.test.ts`, `hearts.test.ts`, `achievements.test.ts` (plus boss-battle & calibration)
- [x] 2.9 Write `src/tests/db/repository.test.ts` — Dexie with fake-indexeddb (30 tests, 7 repo patterns)

## Phase 3: Core UI

- [x] 3.1 Create `src/app.html` + `src/routes/+layout.svelte` — shell nav, dark theme, offline banner
- [x] 3.2 Create `src/lib/components/TaskCard.svelte` — checkbox, discipline color, timer, difficulty badge
- [x] 3.3 Create `src/lib/components/HeartDisplay.svelte`, `StreakBadge.svelte`, `XpBar.svelte`
- [x] 3.4 Create `src/lib/components/CheckInForm.svelte` — energy/focus/mood/sleep sliders
- [x] 3.5 Create `src/lib/components/LevelUpModal.svelte` — full-screen celebration overlay
- [x] 3.6 Create `src/lib/components/BossBattleWidget.svelte` — Sunday review with multiplier
- [x] 3.7 Create `src/lib/components/EmptyState.svelte` — reusable empty/onboarding placeholder
- [x] 3.8 Create `src/routes/+page.svelte` — Dashboard: today's tasks, streak, XP, hearts, timer, micro-objective, task completion flow, check-in
- [x] 3.9 Create `src/routes/progress/+page.svelte` — Chart.js: XP history, discipline radar, streak calendar, calibration
- [x] 3.10 Create `src/routes/plan/+page.svelte` — Plan calendar: month/week/day grid with colored status per day
- [x] 3.11 Enhance `src/routes/achievements/+page.svelte` — locked/unlocked badges with progress bars
- [x] 3.12 Create `src/lib/utils/id.ts` — genId(), today(), now() utility functions

## Phase 4: Extended Features

- [ ] 4.1 Create `src/routes/achievements/+page.svelte` — gallery with locked/unlocked states, progress bars
- [ ] 4.2 Create `src/routes/recovery/+page.svelte` — 3-step wizard (missed days → protocol → confirm/shift dates)
- [ ] 4.3 Create `src/routes/settings/+page.svelte` — data export, theme toggle, plan info

## Phase 5: PWA

- [ ] 5.1 Configure `vite-plugin-pwa` in vite.config.ts — SW source, manifest, pre-cache strategy
- [ ] 5.2 Create `static/manifest.json` — name, icons, theme_color (#1a0000), display: standalone
- [ ] 5.3 Generate PWA icons (192×192, 512×512) in `static/icons/`
- [ ] 5.4 Create `static/offline.html` — minimal offline fallback with reconnect message
- [ ] 5.5 Implement service worker update flow — skip-waiting + toast prompt to reload

## Phase 6: Polish

- [ ] 6.1 Create error log view with category filtering (L/R/D/C/F) and date sorting
- [ ] 6.2 Implement data export (JSON download) and import in settings
- [ ] 6.3 Add first-visit onboarding flow — highlights dashboard, explains hearts/streak/XP
- [ ] 6.4 Build static site, verify all 5 routes load, confirm PWA install prompt fires
