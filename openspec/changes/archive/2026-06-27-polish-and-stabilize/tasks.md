# Tasks: Polish and Stabilize

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~40-60 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | force-chained |
| Chain strategy | size-exception |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | All 8 cleanup items | Single PR | All independent; ~40-60 lines total; no chaining needed |

## Phase 1: Dead Code Removal

- [x] 1.1 Delete `static/manifest.json` — pre-PWA-plugin manifest with wrong subpath URLs
- [x] 1.2 Delete `src/tests/gamification/index.ts` — placeholder file with no tests
- [x] 1.3 Remove unused `getLevel` import at `src/routes/+page.svelte:9`
- [x] 1.4 Remove empty `$effect` block at `src/lib/components/HeartDisplay.svelte:12-14`

## Phase 2: Configuration Fixes

- [x] 2.1 Update `openspec/config.yaml` — replace stale project description with current state (115 source files, 182 Vitest tests, SvelteKit 5 + Dexie + Tailwind 4)
- [x] 2.2 Fix `static/offline.html` reconnect URL — add `/proyecto-web/` base path to `fetch('/manifest.webmanifest')`

## Phase 3: Bug Fixes

- [x] 3.1 Fix `src/tests/integration/full-flow.test.ts:86` — add `firstRun` property to `Settings` type and set it in `initialize()`, or adjust the assertion
- [x] 3.2 Add Dexie compound index `[planId+day]` — update schema version in `src/lib/db/schema.ts` so `db.days.where({ planId, day })` uses the index

## Phase 4: Verification

- [x] 4.1 Run full test suite — confirm all 182 tests pass (including the previously-failing one)
- [x] 4.2 Run `npm run build` — confirm build succeeds with no warnings
