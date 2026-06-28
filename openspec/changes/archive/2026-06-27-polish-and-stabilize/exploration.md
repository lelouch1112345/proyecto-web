# Exploration: Polish and Stabilize

## Current State

Project is a fully-functional gamified PWA for an 84-day study plan. 115 source files, 182 Vitest tests (181 passing, 1 failing), 12 Svelte routes, 9 UI components, 6 gamification modules, 7 repository classes. Deployed to GitHub Pages under `/proyecto-web/`. Works well overall — issues are configuration drift, stale docs, dead code, and edge-case polish.

## Issues Found

### PWA / Manifest Duality
- **`static/manifest.json`**: Has `start_url: "/"` and icon paths without `/proyecto-web/` base — wrong for subpath deployment. This is the pre-PWA-plugin manifest that still gets copied to build.
- **Build output has both**: `build/manifest.webmanifest` (PWA-generated, correct paths) AND `build/manifest.json` (wrong paths). Old `manifest.json` could override PWA manifest if cached.

### Stale openspec/config.yaml
- Lines 6-11: Says "No code yet — pure Markdown study plans" and "No test runner detected". Completely out of date.

### Pre-Existing Test Failure
- **`src/tests/integration/full-flow.test.ts:86`**: Expects `settings!.firstRun` to be `true`, but `Settings` type has no `firstRun` and `settingsRepo.initialize()` never sets it.

### Unused Import
- **`src/routes/+page.svelte:9`**: `import { getLevel }` — imported but never used. Line 10 re-imports it as `getLevelData`.

### Empty $effect
- **`src/lib/components/HeartDisplay.svelte:12-14`**: Empty `$effect(() => { /* comment */ })` — dead code, runs on every prop change.

### Dexie Compound Index Warning
- Test output warns: `query {planId, day} on days needs compound index [planId+day]`.

### No Custom Error Page
- No `+error.svelte` — SvelteKit default white error page appears on errors, jarring against the red-dark theme.

### offline.html Path Issue
- **`static/offline.html`** reconnect script: `fetch('/manifest.webmanifest')` — missing `/proyecto-web/` base. Fails on live deployment.

### Dead Test Index
- **`src/tests/gamification/index.ts`**: Only `export {};` — placeholder never removed.

### Empty Stores Directory
- **`src/lib/stores/`** exists but is empty — no central state management. Everything uses local `$state()`.

### Data Import Lacks Schema Validation
- **`src/routes/settings/+page.svelte:49`**: Import validation only checks `typeof data !== 'object'` — no table name or schema structure verification.

## Recommended Improvements

1. **Fix static/manifest.json** — Update `start_url: "/"` to `"/proyecto-web/"` and fix icon paths. Or remove the old static file entirely since the PWA plugin generates `manifest.webmanifest`. Effort: **Low**
2. **Fix pre-existing test failure** — Either add `firstRun` to `Settings` type and set it in `settingsRepo.initialize()`, or update test to check for a real property like `theme === 'red-dark'`. Effort: **Low**
3. **Update stale openspec/config.yaml** — Replace "No code yet" context with current state (115 files, 182 tests, etc.). Effort: **Low**
4. **Add Dexie compound index** — Add `[planId+day]` compound index in schema version 3. Removes query warning and improves lookup performance. Effort: **Low**
5. **Remove unused import** — Delete `getLevel` import from `+page.svelte`. Effort: **Low**
6. **Remove empty $effect** — Delete the empty `$effect` block from `HeartDisplay.svelte`. Effort: **Low**
7. **Add +error.svelte** — Create custom error page matching the red-dark daisyUI theme, showing status code and message. Effort: **Low**
8. **Fix offline.html reconnect URL** — Change `/manifest.webmanifest` to `/proyecto-web/manifest.webmanifest`. Effort: **Low**
9. **Improve data import validation** — Add schema validation (check for expected table keys, array types) before importing in Settings page. Effort: **Medium**
10. **Clean up dead test file** — Remove `src/tests/gamification/index.ts`. Effort: **Low**
11. **Consider SW auto-update fallback** — Periodic SW check or auto-reload after update detection timeout. Effort: **Medium**

## Risks

- **PWA manifest duplication**: Users with old PWA installs may have wrong `start_url: "/"`. Need to uninstall/reinstall the PWA.
- **Test failure blocks CI**: If `vitest run` is ever added to deploy workflow, the 1 pre-existing failure blocks deployment.
- **offline.html reconnect broken**: Users on offline page can't auto-reconnect because manifest URL is wrong.
- **Default error page breaks theming**: Any unhandled error shows SvelteKit's white default — terrible UX for dark app.

## Ready for Proposal

**Yes** — comprehensive exploration identifies clear, isolated, low-effort fixes.
