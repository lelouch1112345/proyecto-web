# Proposal: Animations and Micro-interactions

## Intent

The PWA feels static and unresponsive. Page changes snap instantly, state transitions (XP gain, heart loss, streak milestones) have no visual feedback, and the dark theme risks feeling lifeless. This change introduces CSS + Svelte animation infrastructure so every interaction feels intentional. Cycle 1 focuses on the animation layer only — Cycles 2 and 3 will add adaptive tone and a mascot companion.

## Scope

### In Scope
- 13 component/route files with CSS keyframe or Svelte transition additions
- Centralized `@keyframes` library and `prefers-reduced-motion` rule in `app.css`
- Page transition wrapper in `+layout.svelte`
- No dependency changes, no `npm install`

### Out of Scope
- Mascot/companion character (Cycle 3)
- Adaptive tone/messaging (Cycle 2)
- Audio/sound effects
- JS animation libraries (GSAP, Motion.js)

## Capabilities

### New Capabilities
- `ui-animations`: Animation and micro-interaction system for the Third-Life PWA. Covers page transitions, reactive CSS keyframe triggers, staggered entrance patterns, and `prefers-reduced-motion` compliance.

### Modified Capabilities
None.

## Approach

**Svelte transitions (enter/exit) + CSS `@keyframes` (micro-interactions).** Zero new dependencies.

1. **`+layout.svelte`**: Wrap `{@render children()}` with `<div transition:fade={{ duration: 200 }}>`
2. **`app.css`**: Add `@keyframes shake`, `pop-in`, `glow-pulse`, `confetti-fall`, `slide-up`. Add `@media (prefers-reduced-motion: reduce)` global disable.
3. **Per-component reactive triggers**: Use existing `$effect` patterns to toggle animation classes on state change.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app.css` | Modified | Centralized keyframes + reduced-motion rule |
| `src/routes/+layout.svelte` | Modified | Wrap children in `transition:fade` |
| `src/routes/+page.svelte` | Modified | Replace `animate-bounce` with `transition:fly` |
| `src/routes/achievements/+page.svelte` | Modified | Staggered card entrance via `--delay` |
| `src/lib/components/XpBar.svelte` | Modified | `glow-pulse` + smooth bar fill on XP change |
| `src/lib/components/HeartDisplay.svelte` | Modified | `shake` on loss, `pop-in` on gain |
| `src/lib/components/StreakBadge.svelte` | Modified | `fire-grow` on increment, milestone glow |
| `src/lib/components/LevelUpModal.svelte` | Modified | CSS confetti with staggered `confetti-fall` |
| `src/lib/components/TaskCard.svelte` | Modified | `check-pop` scale on completion toggle |
| `src/lib/components/BossBattleWidget.svelte` | Modified | Animate bar fill, win/lose badge entrance |
| `src/lib/components/EmptyState.svelte` | Modified | `slide-up` entrance on mount |
| `src/lib/components/OnboardingModal.svelte` | Modified | Svelte transitions for step changes |
| `src/lib/components/CheckInForm.svelte` | Modified | Save success feedback animation |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Over-animation against dark/serious theme | Low | Subtle transitions; confetti only on level-ups |
| CSS perf on large achievements grid (50+) | Low | Use `transform`/`opacity` only (GPU-composited) |
| Confetti particles linger after animation | Low | Use `animation-fill-mode: forwards` + cleanup |

## Rollback Plan

Each component revertible independently via `git revert <file>`. Batch revert: `git revert <proposal-commit>`.

## Dependencies

None.

## Success Criteria

- [ ] All 182 existing tests still pass
- [ ] Build succeeds with 0 errors
- [ ] Each listed component has ≥1 visible animation on state change
- [ ] `prefers-reduced-motion` disables all decorative animations
- [ ] Page transitions work across all 7 routes
