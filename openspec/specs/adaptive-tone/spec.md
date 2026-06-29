# Adaptive Tone Specification

## Purpose

Centralized tone derivation and message resolution system that adapts user-facing text to the user's current state — empathetic when struggling, energetic when on fire, neutral by default.

## Requirements

| # | Requirement | Scenarios |
|---|-------------|-----------|
| R1 | MUST derive tone from user state via `deriveTone(userState)` — returns `'neutral'`, `'empathetic'`, or `'energetic'` | H1, H2, H3, E1 |
| R2 | MUST provide a message registry mapping keys to 3-variant (neutral/empathetic/energetic) strings | H4, E2 |
| R3 | MUST resolve messages via `t(key, tone?)` — defaults to `'neutral'`, falls back to neutral on missing variant | H4, E2 |
| R4 | MUST expose tone as reactive `$derived` or `$state` value in consuming components | H5 |
| R5 | MUST be pure functions — no side effects, no storage, no DOM dependency | H1, H4 |
| R6 | MUST NOT interact with CSS animations or reduced-motion settings | E3 |

### Scenarios

#### H1: deriveTone returns 'energetic' for high-streak, full-hearts user

- GIVEN userState has streak >= 7, hearts === 5, breakMode === false, taskCompletionRatio >= 0.8
- WHEN `deriveTone(userState)` is called
- THEN it returns `'energetic'`

#### H2: deriveTone returns 'empathetic' for zero-hearts break mode

- GIVEN userState has hearts === 0, breakMode === true, recentMood <= 2
- WHEN `deriveTone(userState)` is called
- THEN it returns `'empathetic'`

#### H3: deriveTone returns 'neutral' when no strong signal

- GIVEN userState has streak === 1, hearts >= 3, no level-up, no boss result available
- WHEN `deriveTone(userState)` is called
- THEN it returns `'neutral'`

#### H4: t() resolves to correct variant

- GIVEN `toneRegistry` has key `"empty.day"` with neutral="No tasks — enjoy your rest", empathetic="Rest up — you've earned it", energetic="Rest day! Recharge for tomorrow!"
- WHEN `t("empty.day", "energetic")` is called
- THEN it returns `"Rest day! Recharge for tomorrow!"`

#### H5: Components read tone from reactive source

- GIVEN a Svelte component with deriveTone result assigned to `$state` or `$derived`
- WHEN the component renders
- THEN it calls `t(key, tone)` and displays the matching variant

#### E1: deriveTone with empty state defaults to neutral

- GIVEN userState is empty object `{}`
- WHEN `deriveTone({})` is called
- THEN it returns `'neutral'`

#### E2: t() falls back to neutral on missing variant

- GIVEN `toneRegistry` has key `"greeting"` with only neutral="Hello, keep going!" (no empathetic/energetic)
- WHEN `t("greeting", "energetic")` is called
- THEN it returns `"Hello, keep going!"` (the neutral fallback)

#### E3: Tone never affects reduced-motion

- GIVEN the user has reduced-motion enabled and tone is `'energetic'`
- WHEN any component renders with tone
- THEN no animation change occurs — tone only affects text strings
