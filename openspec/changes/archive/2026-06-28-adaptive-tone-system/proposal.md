# Proposal: Adaptive Tone System

## Intent

Make messaging adapt to user state — empathetic when struggling, energetic when on fire, neutral by default. ~20 locations speak identically whether a user is on a 50-day streak or just lost all hearts.

## Problem

Static text for every user state. "Great job!" shows to a user who lost all hearts the same as to someone on a 7th perfect week. Hurts emotional connection.

## Approach

### Approach A: Centralized tone system (recommended)

Pure functions in `src/lib/i18n/`: `deriveTone()` maps user state → tone; `t(key, tone)` resolves messages from a 3-variant map.

**Pros**: Single source of truth, testable, trivial to add keys. **Cons**: Slight indirection vs inline strings.

### Approach B: Per-component logic

Each component checks state inline and picks strings.

**Pros**: No abstraction. **Cons**: Duplicated mapping, inconsistent, hard to audit.

### Recommendation

**Approach A**. ~20 locations benefit from centralization. Pure functions stay testable.

## Capabilities

### New Capabilities

- **adaptive-tone** — tone derivation + message resolution
  - `tone.ts`: pure `deriveTone()` → `neutral | empathetic | energetic`
  - `tone-registry.ts`: message map, 3 variants per key, neutral default
  - `t.ts`: `t(key, tone)` lookup

### Modified Capabilities

- **daily-dashboard** — Dashboard components use `t()` for greetings, empty states, tooltips, toasts, micro-objectives
- **gamification-engine** — Boss battle, streak, achievement format functions become tone-aware
- **progress-tracking** — Achievements page uses tone variants

## Scope

| In Scope (First Slice) | Out of Scope (Deferred) |
|------------------------|------------------------|
| `src/lib/i18n/` core (4 files) | Recovery page text |
| Dashboard: greeting, XpBar, StreakBadge, HeartDisplay, boss battle, empty state | Onboarding modals |
| Achievements: empty state, condition text, progress labels | Settings, error log, offline banner |
| ~8 new/modified files | Progress page empty states |

## Affected Areas

| Area | Impact |
|------|--------|
| `src/lib/i18n/` | New — tone + registry + lookup |
| `src/routes/+page.svelte` | Modified — dashboard components |
| `src/routes/achievements/` | Modified — tone variants |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Tone overrides mask feedback | Low | Neutral default; explicit per key |
| Missing variant breaks UI | Low | Neutral fallback on missing key |
| Scope creep to 20 locations | Med | Clear first-slice boundary in spec |

## Rollback Plan

Revert all `t()` calls to original hardcoded strings. Remove `src/lib/i18n/`. No data migration needed.

## Dependencies

None. Pure functions + existing component props.

## Success Criteria

- [ ] `deriveTone()` returns correct tone for struggling, neutral, on-fire archetypes
- [ ] All hardcoded strings in Dashboard + Achievements route through `t()`
- [ ] `t('missing.key', tone)` falls back to neutral without error
- [ ] All existing Vitest tests pass
