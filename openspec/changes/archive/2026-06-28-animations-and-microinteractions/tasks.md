# Tasks: Animations and Micro-interactions

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 200–300 |
| 400-line budget risk | Low |
| Chained PRs recommended | Yes |
| Suggested split | PR #1 (foundation + simple) → PR #2 (gamification) → PR #3 (UI polish) |
| Delivery strategy | auto-chain |
| Chain strategy | feature-branch-chain |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Foundation + simple component animations | PR #1 → feature branch | Keyframes in `app.css`, XpBar, HeartDisplay, TaskCard, EmptyState, page transitions, XP toast. |
| 2 | Gamification animations | PR #2 → PR #1 branch | StreakBadge, LevelUpModal confetti, BossBattleWidget, achievements stagger. |
| 3 | UI polish animations | PR #3 → PR #2 branch | OnboardingModal step transitions, CheckInForm success indicator. |

## Phase 1: Foundation (PR #1)

- [x] 1.1 Add 8 `@keyframes` blocks in `src/app.css` (shake, pop-in, glow-pulse, confetti-fall, slide-up, check-pop, fire-grow, success-fade) plus `@media (prefers-reduced-motion: reduce)` blanket disable
- [x] 1.2 Add transition wrapper `<div transition:fade={{ duration: 200 }}>` in `src/routes/+layout.svelte` around `{@render children()}`
- [x] 1.3 Add animation utility classes in `src/app.css` (.animate-shake, .animate-pop-in, .animate-glow, .animate-check, .animate-fire-grow) with animation-name, duration, and timing function

## Phase 2: Simple Component Animations (PR #1)

- [x] 2.1 Modify `XpBar.svelte`: replace `animate-pulse` with custom `.animate-glow` class triggered by existing $effect on `totalXp` change
- [x] 2.2 Modify `HeartDisplay.svelte`: add `$effect` tracking `current` delta, apply `.animate-shake` on decrease, `.animate-pop-in` on increase
- [x] 2.3 Modify `TaskCard.svelte`: bind `.animate-check` class to checkbox button on completion toggle
- [x] 2.4 Modify `EmptyState.svelte`: wrap root with `transition:fly={{ y: 20, duration: 300 }}` for mount entrance
- [x] 2.5 Modify `+page.svelte`: replace `animate-bounce` on XP toast with `transition:fly={{ x: 100, duration: 300 }}`

## Phase 3: Gamification Animations (PR #2)

- [x] 3.1 Modify `StreakBadge.svelte`: add `$effect` on `current` → toggle `.animate-fire-grow` on increment; milestone glow at 7/14/30/84 via `.animate-glow` + `.streak-celebration` wrapper glow
- [x] 3.2 Modify `LevelUpModal.svelte`: render 30 confetti `<span>` particles with staggered `animation-delay` via `confetti-fall` keyframe; auto-remove after 2s; added `open` prop
- [x] 3.3 Modify `BossBattleWidget.svelte`: bar fill uses `transition-all`; result badge scales 0→1 via `.animate-pop-in` on battle end
- [x] 3.4 Modify `achievements/+page.svelte`: add `--i` CSS custom prop on each card (index × 50ms) with `.card-enter` entrance class using centralized `slide-up` keyframe; replaced local `unlockPulse` with centralized `glow-pulse`

## Phase 4: UI Polish (PR #3)

- [x] 4.1 Modify `OnboardingModal.svelte`: wrap step content with `{#key step}` and `transition:fly` (x=20 forward, x=-20 backward) for horizontal slide
- [x] 4.2 Modify `CheckInForm.svelte`: add `$effect` on `saved` → show success indicator for 1.5s then auto-fade-out
- [x] 4.3 Manual visual pass: run app, verify all animations play and `prefers-reduced-motion` disables decorative ones

## Phase 5: Testing

- [x] 5.1 Write component logic tests: render XpBar/HeartDisplay/TaskCard/EmptyState with props → assert animation class presence/rendering via `container.querySelector`
- [x] 5.2 Verify 197 existing tests still pass and build produces 0 errors
