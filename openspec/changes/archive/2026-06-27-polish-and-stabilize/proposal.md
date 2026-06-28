# Proposal: Polish and Stabilize

## Intent

Clean up configuration drift, stale code, dead files, and edge-case bugs across the proyecto-web PWA — all low-effort items that improve correctness, maintainability, and deployment hygiene without behavioral changes.

## Scope

### In Scope

1. **Delete `static/manifest.json`** — Pre-PWA-plugin manifest with wrong subpath URLs. PWA plugin already generates correct `manifest.webmanifest` at `/proyecto-web/manifest.webmanifest`.
2. **Fix pre-existing test failure** — `src/tests/integration/full-flow.test.ts:86` asserts `settings!.firstRun === true`, but `Settings` type has no `firstRun` property. Add `firstRun` to type and set in `initialize()`, or adjust assertion.
3. **Update stale `openspec/config.yaml`** — Replace `"No code yet"` and `"No test runner detected"` with accurate project state (115 source files, 182 Vitest tests, SvelteKit 5 + Dexie + Tailwind 4).
4. **Add Dexie compound index `[planId+day]`** — `db.days.where({ planId, day }).first()` warns about missing index. Add in schema version update.
5. **Remove unused import in `+page.svelte`** — Line 9 imports `getLevel` shadowed by re-import on line 10 as `getLevelData`. Remove line 9.
6. **Remove empty `$effect` in `HeartDisplay.svelte`** — Lines 12–14: empty `$effect(() => { /* comment */ })` — dead code.
7. **Fix `offline.html` reconnect URL** — `fetch('/manifest.webmanifest')` missing `/proyecto-web/` base path.
8. **Delete `src/tests/gamification/index.ts`** — Placeholder with only `export {};`.

### Out of Scope

- Custom `+error.svelte` (deferred)
- Data import schema validation (deferred)
- SW auto-update improvements (deferred)
- Any medium/high-effort items from exploration

## Capabilities

### New Capabilities

None — this change introduces no new spec-level behavior.

### Modified Capabilities

None — no existing spec requirements are changing.

## Approach

Eight independent, individually-revertible edits. Each is a single-file change with no cross-cutting concerns:

1. Delete `static/manifest.json`
2. Edit `src/tests/integration/full-flow.test.ts` (or `src/lib/db/schema.ts` + repository)
3. Edit `openspec/config.yaml` context and testing blocks
4. Edit Dexie schema version in `src/lib/db/`
5. Edit `src/routes/+page.svelte` — remove line 9
6. Edit `src/lib/components/HeartDisplay.svelte` — remove empty `$effect`
7. Edit `static/offline.html` — prefix URL with `/proyecto-web/`
8. Delete `src/tests/gamification/index.ts`

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `static/manifest.json` | Removed | Delete wrong-baseline PWA manifest |
| `src/tests/integration/full-flow.test.ts` | Modified | Fix `firstRun` assertion |
| `src/lib/db/schema.ts` | Modified | Add `[planId+day]` compound index |
| `openspec/config.yaml` | Modified | Update stale project description |
| `src/routes/+page.svelte` | Modified | Remove unused `getLevel` import |
| `src/lib/components/HeartDisplay.svelte` | Modified | Remove empty `$effect` |
| `static/offline.html` | Modified | Fix reconnect URL base path |
| `src/tests/gamification/index.ts` | Removed | Delete placeholder file |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Existing users with cached old `manifest.json` | Low | PWA plugin manifest takes precedence; service worker cache policy limits impact |
| Test failure fix incompatible with downstream specs | Low | Change is additive (add field) or assertion-only; no API contract affected |
| Dexie schema version change breaks IndexedDB for users | Low | Adding an index is backward-compatible; existing data is preserved |

## Rollback Plan

Each item is independently revertible via `git revert <commit>` for that item. No rollback coordination needed — they can be rolled back individually without affecting others.

## Dependencies

None — all items are self-contained.

## Success Criteria

- [ ] All 182 tests pass (including the previously-failing test)
- [ ] `npm run build` succeeds with no warnings
- [ ] `static/manifest.json` no longer exists in repo or build output
- [ ] No unused imports or empty `$effect` blocks remain in source
- [ ] `offline.html` reconnect script resolves correctly on `/proyecto-web/manifest.webmanifest`
- [ ] `openspec/config.yaml` reflects current project state
- [ ] `src/tests/gamification/index.ts` is removed
