# Tasks: Adaptive Tone System

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~220 |
| 400-line budget risk | Low |
| Chained PRs recommended | Yes (2 PRs) |
| Suggested split | PR #1: Core + Dashboard + tests → PR #2: Achievements + remaining gamification |
| Delivery strategy | force-chained |
| Chain strategy | feature-branch-chain |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Core i18n layer + Dashboard integration + unit tests | PR 1 | Base: feature/tracker branch |
| 2 | Achievements page + streak/achievement format via t() | PR 2 | Base: PR #1 branch |

## Phase 1: Core Tone System (PR #1)

- [x] 1.1 Create `src/lib/i18n/tone.ts` — `deriveTone()` pure function + `Tone` type + `UserSignals` interface
- [x] 1.2 Create `src/lib/i18n/tone-registry.ts` — typed message map with neutral/empathetic/energetic variants per key
- [x] 1.3 Create `src/lib/i18n/t.ts` — `t(key, tone?, ...args)` resolver with neutral fallback on missing variant
- [x] 1.4 Create `src/lib/i18n/index.ts` — barrel re-export
- [x] 1.5 Write unit tests: deriveTone() covers H1, H2, H3, E1; t() covers H4, E2

## Phase 2: Dashboard Integration (PR #1)

- [x] 2.1 Modify `+page.svelte` — derive tone once with deriveTone(), pass tone as prop to gamification children
- [x] 2.2 Modify `XpBar.svelte` — accept tone prop, replace tooltip/label with t()
- [x] 2.3 Modify `HeartDisplay.svelte` — accept tone prop, replace title attr with t()
- [x] 2.4 Modify `StreakBadge.svelte` — accept tone prop, replace title attr with t()
- [x] 2.5 Modify `EmptyState.svelte` — accept optional tone prop (caller passes tone-derived strings)
- [x] 2.6 Modify `BossBattleWidget.svelte` — win/loss/pending text resolved via t()

## Phase 3: Achievements Integration (PR #2)

- [x] 3.1 Modify `achievements/+page.svelte` — derive tone, replace condition text + empty state with t()
- [x] 3.2 Modify `streak.ts` — notification text resolved via t()
- [x] 3.3 Modify `achievements.ts` — unlock format strings resolved via t()
- [x] 3.4 Write/update tests for achievements page tone integration

## Phase 4: Verify

- [x] 4.1 Run full Vitest suite — confirm zero regressions
- [ ] 4.2 Manual check: tone shifts correctly across neutral/empathetic/energetic user states

### PR #2 Implementation Notes

**Deviation: Tasks 3.2 and 3.3 had no human-readable strings to modify.**

- `streak.ts` contains only pure computation functions (`calcStreak`, `applyStreakFreeze`, `shouldUseFreeze`, `replenishFreezes`) — no format/notification text. All streak display text lives in `StreakBadge.svelte` which was already made tone-aware in PR #1.
- `achievements.ts` contains only pure logic functions (`checkAchievements`, `getNewlyUnlocked`, `calcDisciplineCounts`, `createInitialAchievements`) — no user-facing strings. The `getConditionText()` function referenced in the task spec lives in `+page.svelte` and was handled in task 3.1.

These files have no hardcoded text to replace, so no changes were needed.
