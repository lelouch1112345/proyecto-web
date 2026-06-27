# Proposal: Third-Life

## Intent

Convert the existing 84-day markdown study plan into an interactive, gamified single-user PWA that eliminates procrastination by making daily compliance visible, rewarding consistency, and guiding recovery when the user falls off.

## Scope

### In Scope
- Daily dashboard showing today's tasks from the seeded plan
- Task completion with XP, 14 level titles, streak tracking
- 15+ achievements/badges with unlock conditions and progress
- Daily check-in (energy/focus/mood/sleep)
- Heart system (5 ❤, 48h grace window, break mode at 0)
- Weekly boss battle (Sunday review, 1.5× XP multiplier)
- Error logging with root cause categorization (L/R/D/C/F)
- Metacognitive calibration tracking (prediction vs actual gap)
- Emergency recovery protocols (1-2d, 3-5d, 1+w, burnout)
- Full PWA offline (installable via service worker)
- Pre-loaded with the full 84-day plan from existing markdown
- Plan viewer (month/week/day grid with color status)
- Stats & progress (XP history, discipline radar, streak heatmap)
- Achievement gallery with progress toward locked badges
- Extensibility for custom future plans (beyond the 84-day default)

### Out of Scope
- Multi-user or backend/server
- Real-time sync or cloud save
- Social features, leaderboards, or sharing
- Push notifications (deferred to post-MVP)
- Custom plan builder UI (deferred to post-MVP)

## Assumptions (from user questions)

- **Start**: Day 1 — full 84-day plan pre-loaded
- **Plans**: App supports future custom plans (not just the default)
- **Data**: Markdown plans converted to JSON seed data once at build time
- **Offline**: Full PWA — no internet required after install

## Capabilities

### New Capabilities
- `daily-dashboard`: Today's view with tasks, streak, XP, hearts, micro-objective, and session timer
- `progress-tracking`: Stats dashboard with XP history, discipline radar, streak calendar, and calibration accuracy
- `gamification-engine`: Pure-function XP calc, level thresholds, achievement checks, heart system, boss battles
- `emergency-recovery`: Guided wizard — days-missed input, protocol display, auto date adjustment
- `pwa-offline`: Service worker registration, install prompt, manifest, offline fallback

### Modified Capabilities
None — no existing specs to modify.

## Approach

**SvelteKit 5** (static adapter) + **Dexie.js** (IndexedDB wrapper) + **Chart.js**. Markdown plans → JSON seed at build time. **Gamification as pure functions** (no DOM/storage coupling) for unit-testability with Vitest. **Repository pattern** for DB access. **Event-sourced XP** (every transaction stored, level computed from sum). **PWA** via `vite-plugin-pwa`. **Mobile-first** UI with Tailwind 4 + daisyUI. No backend — fully local.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `Plan_de_Estudio/*.md` | Source | Seed data extraction (one-time conversion) |
| `src/lib/db/` | New | Dexie schema, repositories, seed import |
| `src/lib/gamification/` | New | XP, levels, streak, hearts, achievements (pure fns) |
| `src/routes/` | New | Dashboard, stats, achievements, error-log, plan, settings |
| `src/lib/components/` | New | Reusable gamification UI components |
| `src/data/seed/` | New | Pre-converted JSON: mes-1, achievements, disciplines |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Gamification overdose | Low | XP rewards completion, not grinding. No re-do XP |
| Abandonment guilt | Low | 48h grace window, heart recovery, Fénix achievement |
| Svelte learning curve | Low-Med | Shallow learning curve; prototype first |

## Rollback Plan

Static site deployment — rollback = redeploy previous build. All data lives in IndexedDB (isolated per browser, no server state). Data export available in Settings before any destructive migration.

## Dependencies

- SvelteKit 5 + `vite-plugin-pwa`
- Dexie.js + `fake-indexeddb` (test mock)
- Chart.js + `chartjs-plugin-datalabels`
- Tailwind CSS 4 + daisyUI
- Vitest + `@testing-library/svelte`

## Success Criteria

- [ ] App loads Day 1 plan with all tasks on first visit
- [ ] Completing a task awards XP and updates streak
- [ ] Level-up triggers full-screen celebration
- [ ] PWA installs via browser prompt and works fully offline
- [ ] Day calendar shows green/yellow/red for past days
- [ ] Emergency protocol guides recovery and adjusts dates
- [ ] Data survives page reload (persisted in IndexedDB)
