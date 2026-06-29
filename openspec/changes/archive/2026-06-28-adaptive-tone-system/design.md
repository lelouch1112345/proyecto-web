# Design: Adaptive Tone System

## Technical Approach

Pure-function i18n layer in `src/lib/i18n/` — `deriveTone()` maps user state to `neutral | empathetic | energetic`; `t(key, tone)` resolves 3-variant strings from a typed registry. Components receive tone as a prop (Option B) so derivation lives in ONE place per route. First slice covers Dashboard + Achievements (~8 locations).

## Architecture Decisions

### Decision: Pure function layer over Svelte reactivity

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Inline `$derived` in every component | Duplicates derivation logic, needs all signals per component | ❌ Rejected |
| Pure `deriveTone()` + parent-passed prop | Single derivation point, testable, components only need `tone` prop | ✅ **Chosen** |
| Svelte store with auto-derivation | Adds runtime dependency, no benefit over runes for this | ❌ Rejected |

### Decision: Parent-passed tone prop (Option B)

| Option | Tradeoff | Decision |
|--------|----------|----------|
| A — Each component derives its own tone | Needs all signals passed everywhere, easy to get inconsistent tone | ❌ Rejected |
| B — Parent derives once, passes as prop | One derivation, all children consistent, minimal prop change | ✅ **Chosen** |

### Decision: Simple string interpolation over ICU

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Positional `{0}` replacement | Zero dependencies, fits ~20 keys, 4 lines of code | ✅ **Chosen** |
| Named parameters (`{streak}`) | Need regex with named groups, overkill for current volume | ❌ Deferred |
| ICU/MesageFormat | Dependency + build step, not warranted for first slice | ❌ Deferred |

## Data Flow

```
+page.svelte
  │  deriveTone({streak, hearts, totalXp, level, …}) → tone
  │
  ├── XpBar          ← tone prop
  │     t('xp.level', tone, lvl)
  │
  ├── HeartDisplay   ← tone prop
  │     t('hearts.tooltip', tone, current, max)
  │
  ├── StreakBadge    ← tone prop
  │     t('streak.tooltip', tone, current)
  │
  ├── EmptyState     ← tone prop (title/desc from parent via t())
  │
  └─ BossBattleWidget ← tone prop
        t('bossBattle.win', tone) | t('bossBattle.lose', tone)

achievements/+page.svelte
  │  deriveTone({…}) → tone
  │
  ├── getConditionText() → t('achievement.condition.' + type, tone, target)
  └── Empty state        → t('progress.empty', tone)
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/lib/i18n/tone.ts` | **Create** | `deriveTone()` pure function + `Tone`/`UserSignals` types |
| `src/lib/i18n/tone-registry.ts` | **Create** | Typed message map with 3 variants per key |
| `src/lib/i18n/t.ts` | **Create** | `t(key, tone?, ...args)` resolver with neutral fallback |
| `src/lib/i18n/index.ts` | **Create** | Barrel re-export |
| `src/routes/+page.svelte` | **Modify** | Derive tone at page level, pass to gamification children; replace hardcoded strings |
| `src/lib/components/XpBar.svelte` | **Modify** | Accept `tone` prop, replace tooltip/label with `t()` |
| `src/lib/components/HeartDisplay.svelte` | **Modify** | Accept `tone` prop, replace `title` attr with `t()` |
| `src/lib/components/StreakBadge.svelte` | **Modify** | Accept `tone` prop, replace `title` attr with `t()` |
| `src/lib/components/EmptyState.svelte` | **Modify** | Accept optional `tone` prop for future use (caller already passes strings) |
| `src/routes/achievements/+page.svelte` | **Modify** | Derive tone, replace condition text + empty state with `t()` |
| `src/lib/gamification/boss-battle.ts` | **Modify** | Format functions become tone-aware via `t()` |
| `src/lib/gamification/streak.ts` | **Modify** | Streak notification text via `t()` |
| `src/lib/gamification/achievements.ts` | **Modify** | Achievement unlock format via `t()` |

## Interfaces / Contracts

```typescript
// src/lib/i18n/tone.ts
export type Tone = 'neutral' | 'empathetic' | 'energetic';

export interface UserSignals {
  streak: number;
  hearts: { current: number; breakMode: boolean };
  totalXp: number;
  level: number;
  checkIn?: { mood: number; energy: number; focus: number };
  completionRatio: number;
  battleCompleted?: boolean;
  battleWon?: boolean;
  levelUpAchievements?: string[];
  missedDays: number;
}

export function deriveTone(signals: UserSignals): Tone;

// src/lib/i18n/t.ts
export function t(key: MessageKey, tone?: Tone, ...args: string[]): string;
```

### Derivation Rules

| Tone | Condition |
|------|-----------|
| **Energetic** | `(streak >= 14 && hearts.current >= 4 && completionRatio >= 0.8) \|\| battleWon \|\| levelUpAchievements.length > 0` |
| **Empathetic** | `hearts.breakMode \|\| hearts.current <= 2 \|\| streak === 0 \|\| missedDays >= 3` |
| **Neutral** | Default — no strong signal |

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit — `deriveTone()` | Energetic path (H1), Empathetic path (H2), Neutral default (H3), empty state (E1) | Pure function, no mock needed, same pattern as `src/tests/gamification/xp.test.ts` |
| Unit — `t()` | Correct variant (H4), neutral fallback on missing variant (E2), unknown key returns key | Pure function tests |
| Component | Tone prop accepted and used in rendering | Vitest + svelte testing library |
| Integration | Dashboard renders with energetic tone, achievements page renders empty state with empathetic tone | Existing integration tests extended |

## Migration / Rollout

No migration or feature flag required. All new files, no data schema change. Revert: remove `src/lib/i18n/`, revert `t()` calls to original strings in touched components.

## Open Questions

None. Design resolves all decisions from proposal and specs.
