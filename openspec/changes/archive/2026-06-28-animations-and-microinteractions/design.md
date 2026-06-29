# Design: Animations and Micro-interactions

## Technical Approach

Subtle, purposeful motion via CSS `@keyframes` (centralized in `app.css`) + Svelte `transition:` directives. Zero new dependencies. All decorative animations guarded by `prefers-reduced-motion: reduce`. GPU-composited properties only (`transform`, `opacity`, `box-shadow`) — no layout-triggering properties.

## Architecture Decisions

| Decision | Choice | Alternatives | Rationale |
|----------|--------|-------------|-----------|
| Animation layer | Centralized `@keyframes` in `app.css` + per-component trigger classes in `<style>` | Inline styles, per-component keyframes | DRY keyframes library; per-component triggers keep logic local and testable |
| Trigger mechanism | `$effect` watches reactive value → toggle CSS class | `svelte/motion` tweened stores, JS-driven | CSS animations are GPU-composited; existing `$effect` patterns already proven in XpBar |
| Page transitions | `<div transition:fade>` wrapper around `{@render children()}` | `svelte/viewtransitions`, custom JS | SvelteKit-native, zero dependencies, works with SPA navigation lifecycle |
| Confetti | `<span>` elements with CSS `--delay` for staggered `confetti-fall` | JS canvas, GSAP particles | CSS-only, <30 particles, auto-cleanup via `forwards`, no library |
| Continuous values | CSS `transition` on width/transform | `$effect` per-frame updating | Native browser interpolation; cheaper than per-frame JS |
| Reduced motion | Global `@media (prefers-reduced-motion: reduce)` with `!important` | Per-component checks | Single source of truth catches all animations |

## CSS Keyframes Library (added to `app.css`)

| Name | Duration | Properties | Trigger Context |
|------|----------|------------|----------------|
| `shake` | 400ms | `translateX` ±4px | Heart loss, error feedback |
| `pop-in` | 300ms | `scale` 0→1.2→1, `opacity` | Heart gain, element appear |
| `glow-pulse` | 1.5s | `box-shadow` 4px↔12px | XP bar on change |
| `confetti-fall` | 2s | `translateY` -10px→100vh, `rotate` 0→720deg | Level-up backdrop |
| `slide-up` | 300ms | `translateY` 20px→0, `opacity` 0→1 | EmptyState mount |
| `check-pop` | 150ms | `scale` 1→1.3→1 | Task completion checkbox |
| `fire-grow` | 500ms | `scale` 1→1.2→1 | Streak increment |
| `card-entrance` | 400ms | `translateY` 30px→0, `opacity` 0→1 | Achievement card stagger |

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/app.css` | Modify | Add 8 `@keyframes` + `prefers-reduced-motion: reduce` guard |
| `src/routes/+layout.svelte` | Modify | Wrap `{@render children()}` with `<div transition:fade={{ duration: 200 }}>` |
| `src/routes/+page.svelte` | Modify | Replace `animate-bounce` on XP toast with `transition:fly` |
| `src/routes/achievements/+page.svelte` | Modify | Add `--delay` staggered entrance; deduplicate existing `unlockPulse` into centralized `glow-pulse` |
| `src/lib/components/XpBar.svelte` | Modify | Replace `animate-pulse` with custom `glow-pulse` class; `$effect` unchanged |
| `src/lib/components/HeartDisplay.svelte` | Modify | Add `$effect` tracking `current` deltas → toggle `shake`/`pop-in` classes |
| `src/lib/components/StreakBadge.svelte` | Modify | Add `$effect` on `current` → toggle `fire-grow`; milestone glow at 7/14/30/84 via `streak-celebration` class |
| `src/lib/components/LevelUpModal.svelte` | Modify | Add confetti `<span>` grid with `--delay` staggered `confetti-fall` |
| `src/lib/components/TaskCard.svelte` | Modify | Add `check-pop` class binding on checkbox completion |
| `src/lib/components/BossBattleWidget.svelte` | Modify | Add `scale` transition on result badge; bar fill already uses `transition-all` |
| `src/lib/components/EmptyState.svelte` | Modify | Wrap root div with `transition:fade` + `transition:fly` |
| `src/lib/components/OnboardingModal.svelte` | Modify | Wrap step content with `transition:fly={{ x: ±20 }}` for horizontal slide |
| `src/lib/components/CheckInForm.svelte` | Modify | Add `$effect` on `saved` → toggle fade-out on success badge |

## Data Flow (Animation Trigger)

```
State change ──→ $effect detects delta ──→ toggles CSS class ──→ @keyframes animation plays
                                                                    │
                                                    prefers-reduced-motion ──→ duration=0.01ms
```

## Per-Component Implementation

### 1. XpBar.svelte
- **Trigger**: `$effect` already watches `totalXp !== prevXp` → sets `animating = true` for 600ms
- **Change**: Replace `class:animate-pulse` with custom `class:glow-pulse` using `box-shadow` keyframe
- **Duration**: 1.5s (glow-pulse cycle); bar width uses existing `transition-all duration-500`

### 2. HeartDisplay.svelte
- **Trigger**: Add `$effect { if (current !== prev) ... }` tracking direction
- **Decrease**: Add `.shake` class to container for 400ms
- **Increase**: Add `.pop-in` class to the newly filled heart slot via `--i` index
- **Edge case**: No animation on initial mount (skip when `prev === undefined`)

### 3. StreakBadge.svelte
- **Trigger**: `$effect` on `current` — compare with stored previous value
- **Milestone**: `[7, 14, 30, 84].includes(current) && current > prev` → add `streak-celebration` (glow + scale)
- **Fire-grow**: Any increment toggles `fire-grow` class for 500ms
- **No animation**: On freeze or no change

### 4. LevelUpModal.svelte
- **Confetti**: Render 20 `<span>` particles with `animation: confetti-fall 2s calc(var(--i) * 50ms) ease-out forwards`
- **Position**: Absolute backdrop overlay, particles randomly spread via `--x` custom prop (`left: calc(var(--i) * 5%)`)
- **Cleanup**: `animation-fill-mode: forwards; animation-duration: 2s` — particles self-terminate

### 5. TaskCard.svelte
- **Trigger**: Checkbox `onclick={handleToggle}` → `completed` prop changes
- **Animation**: `<button class="checkbox" class:check-pop={completed}>` — 150ms `scale` bump via `check-pop`
- **No flash**: Card body is stable; only checkbox scales

### 6. OnboardingModal.svelte
- **Change**: Replace instant `step` swap with `{#key step}<div transition:fly={{ x: 20, duration: 200 }}>{@render content()}</div>{/key}`
- **Direction**: Forward (next) slides left; backward uses `x: -20`

### 7. achievements/+page.svelte
- **Stagger**: `style="--delay: {index * 50}ms"` on each card div
- **CSS**: `.achievement-card { animation: card-entrance 400ms calc(var(--delay, 0ms)) ease-out both; }`
- **Deduplicate**: Replace local `unlockPulse` keyframe with reference to centralized `glow-pulse`

### 8. XP Toast (+page.svelte)
- **Replace**: `animate-bounce` → `<div transition:fly={{ x: 100, duration: 300 }}>`
- **Exit**: Svelte's built-in `transition:fly` handles both enter and leave

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Logic | Animation classes applied/removed by `$effect` | Component tests: render with prop changes, assert class presence on container via `container.querySelector` |
| CSS | Keyframes exist and parse | `getComputedStyle` check on animated elements after forcing class |
| a11y | `prefers-reduced-motion` CSS is present | Assert `app.css` contains the `@media (prefers-reduced-motion: reduce)` block |
| Visual | Animations look correct | Manual verification by user on real device |

## Migration / Rollout

No migration required. Each file revertible independently via `git revert <file>`. Centralized keyframes in `app.css` are additive — no existing styles change.

## Open Questions

- [ ] HeartDisplay: animate only the delta heart or the whole container? Decision: container shake on loss (simpler), individual fill slot pop-in on gain (more satisfying).
- [ ] StreakBadge milestone detection: should milestone glow repeat every time the badge renders at that milestone, or only on the increment event? Decision: only on increment (one-shot via `$effect` clearing after animation completes).
