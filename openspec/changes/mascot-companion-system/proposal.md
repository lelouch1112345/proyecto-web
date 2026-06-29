# Proposal: Companion Mascot System

## Intent

Add personality and emotional connection via a mascot character that reacts to user state — turning a functional dashboard into one with presence and character.

## Problem

The dashboard works but has no soul. All feedback is utilitarian (streak numbers, XP bars, heart counts). There's no character, no voice, no sense that the app "feels" anything about your progress. Cycle 2's adaptive tone made labels tone-aware, but the app still reads like a spreadsheet with emoji.

## Approach

**Emoji character + daisyUI speech bubble**, reusing Cycle 2's `deriveTone()` / `t(key, tone)` for dialog. The mascot renders conditionally based on a priority chain: levelUp > battleWon > breakMode > complete > greet. CSS pulse animation (reuses Cycle 1 keyframes). No images, no audio, no new deps.

| Option | Effort | Verdict |
|--------|--------|---------|
| A) Emoji + bubble | Low | **MVP** — fits emoji-first PWA ethos, zero bundle cost |
| B) CSS-art character | Medium | Deferred — Phase 2, flame-spirit concept |
| C) SVG/Image character | High | Overkill — adds bundle weight, no strong need |

## Capabilities

### New Capabilities

- **companion-mascot**: Mascot character with reactive dialog — emoji display, speech bubble, priority chain, idle animation

### Modified Capabilities

- **daily-dashboard**: Add `MascotCompanion` component to dashboard layout
- **adaptive-tone**: Add `mascot.*` message keys (6-8 keys × 3 tone variants) to tone-registry

## Scope

### In Scope (MVP)

- `MascotCompanion.svelte` — emoji character + daisyUI speech bubble
- 6-8 `mascot.*` keys in tone-registry (greeting, encourage, celebrate, empathize, progress, complete, empty, streak_milestone)
- Dialog priority: `newLevel > battleWon > breakMode > allComplete > greet`
- Placement in gamification bar or floating bottom-right
- CSS pulse idle animation (reuse Cycle 1 keyframes)
- Respects `prefers-reduced-motion`
- 3-4 component tests

### Out of Scope (Future)

- CSS-art character with expressions
- Character evolution per level
- Multiple selectable characters
- Settings toggle
- Audio/voice

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/lib/components/MascotCompanion.svelte` | New | Emoji + speech bubble component |
| `src/lib/i18n/tone-registry.ts` | Modified | Add `mascot.*` dialog keys |
| `src/routes/+page.svelte` | Modified | Import and place mascot component |
| `src/app.css` | Modified | Mascot-specific keyframes if needed |
| `src/tests/components/` | New | Mascot component tests |
| `src/lib/i18n/tone.ts` | Unchanged | Reused as-is from Cycle 2 |
| `src/lib/gamification/` | Unchanged | Read-only dependency |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Mascot fatigue (fires too often) | Med | Priority chain + debounce — never shows on trivial actions |
| Layout shift on mount | Low | Fixed/absolute positioning or reserved placeholder |
| Redundant messaging (repeats widgets) | Low | Dialog adds character voice, not rephrased stats |
| Reduced-motion accessibility | Low | `prefers-reduced-motion` respected for idle animation |

## Rollback Plan

Revert the dashboard layout change (`+page.svelte`), delete `MascotCompanion.svelte`, revert tone-registry additions. No data migration needed — mascot is a pure UI addition with zero state.

## Dependencies

- Cycle 2 adaptive-tone system (`deriveTone`, `t()`) — already in `main`
- Cycle 1 animation keyframes — already in `app.css`

## Success Criteria

- [ ] Mascot renders on dashboard load with correct tone-adaptive greeting
- [ ] Mascot shows celebration dialog on level-up (highest priority event)
- [ ] Mascot shows empathy dialog in break mode / low hearts
- [ ] Mascot shows complete dialog when all tasks done
- [ ] Mascot goes idle (pulse animation) between events
- [ ] 3+ component tests pass
- [ ] No console errors or layout regressions
