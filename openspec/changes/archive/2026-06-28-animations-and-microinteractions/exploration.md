## Exploration: Micro-interactions & Animations

### Current State

The app has **minimal animation infrastructure** spread across a few ad-hoc approaches:

#### Svelte transition directives
- **Only `LevelUpModal.svelte`** uses Svelte's built-in transitions: `fade`, `scale`, and `fly` from `svelte/transition`. This is the sole component with proper enter/exit transitions.
- **No page transitions** — the layout renders `{@render children()}` directly with no wrapping transition. Pages snap instantly.
- **No `afterNavigate`/`beforeNavigate`** usage exists.

#### Tailwind animation classes
- `animate-pulse` — used in 3 places: loading emoji (`+layout.svelte`), XP bar on gain (`XpBar.svelte`), legendary streak (`StreakBadge.svelte`)
- `animate-bounce` — used once for the XP toast notification (`+page.svelte`)
- Tailwind `transition-all duration-*` — used broadly for card borders, hover effects, and progress bars

#### CSS `@keyframes`
- **Only `routes/achievements/+page.svelte`** defines a custom `@keyframes unlockPulse` animation for the newly-unlocked achievement glow effect. This is the most sophisticated animation in the app.

#### DaisyUI 5 animation utilities
- Only `loading-spinner` classes are used (`loading loading-spinner loading-lg text-red-500`) across all loading states.
- No daisyUI `animate-*` utilities are used beyond what Tailwind provides.
- The app's daisyUI theme (`third-life`) is custom with dark red tones.

#### No animation library
- Only `chart.js` + `chartjs-plugin-datalabels` in dependencies — for data visualization charts, not UI animation.
- No GSAP, no Framer Motion, no Motion.js, no `svelte/motion`.

#### Summary of animation gaps by component

| Component | Current Animation | Missing |
|-----------|------------------|---------|
| **XpBar** | `animate-pulse` on XP gain via `$effect` | Smooth bar fill, number tick-up, starburst on level threshold |
| **HeartDisplay** | `transition-all duration-300` on heart spans | Heart break/loss (shake + fade), gain (pop-in), breakMode visual indicator |
| **StreakBadge** | `animate-pulse` at legendary level only | Fire growth, streak milestone celebration (7/14/30/84) |
| **LevelUpModal** | `fade` + `scale` + `fly` — works well | Confetti particles, number count-up, no visual "shower" on level-up |
| **TaskCard** | `transition-all duration-300` on card border | Completion checkmark animation, strikethrough animation, timer pulsing |
| **BossBattleWidget** | Nothing | Progress bar animate on fill, boss HP style, win/lose burst |
| **EmptyState** | Nothing | Entrance slide-up/fade on mount |
| **OnboardingModal** | Manual CSS `opacity`/`scale` transitions | Step transition between screens, smoother entrance |
| **CheckInForm** | Nothing | Save success feedback animation, range slider glow on change |
| **XP Toast** | `animate-bounce` (hardcoded, no exit) | Fly-in from right, auto-fade-out, proper exit transition |
| **Achievements page** | `@keyframes unlockPulse` — good | Staggered reveal, card entrance animation |
| **Recovery page** | `steps` daisyUI component only | Step transition animation between wizard steps |

---

### Affected Areas

- `src/lib/components/XpBar.svelte` — bar fill animation, number tick-up, starburst effect
- `src/lib/components/HeartDisplay.svelte` — heart loss/gain animations, break mode shake
- `src/lib/components/StreakBadge.svelte` — streak increment celebration, fire animation
- `src/lib/components/LevelUpModal.svelte` — confetti/burst effect on level-up
- `src/lib/components/TaskCard.svelte` — completion check animation, pulse on timer
- `src/lib/components/BossBattleWidget.svelte` — progress bar animation, win/lose feedback
- `src/lib/components/EmptyState.svelte` — entrance animation
- `src/lib/components/OnboardingModal.svelte` — step transitions
- `src/lib/components/CheckInForm.svelte` — save success feedback
- `src/routes/+layout.svelte` — page transition wrapper
- `src/routes/+page.svelte` — XP toast animation (replace hardcoded animate-bounce)
- `src/routes/achievements/+page.svelte` — staggered card entrance
- `src/routes/recovery/+page.svelte` — step transitions
- `src/app.css` — potential global transition defaults, keyframes library

---

### Approaches

#### 1. Svelte Transitions Only

Use only Svelte's built-in `transition:fade`, `transition:fly`, `transition:scale`, `transition:slide` directives, plus `svelte/motion` for tweened/spring values. No extra CSS keyframes beyond basic Tailwind utilities.

- **Pros:**
  - Zero new dependencies — pure Svelte built-ins
  - Declarative, per-component transitions
  - `svelte/motion` provides tweened/spring stores for numeric animations (XP counter, progress bars)
  - Svelte 5 runes (`$effect`) already provide reactive triggers
- **Cons:**
  - No sequenced/staggered animations for lists
  - No complex effects (confetti, particles, path animations)
  - `svelte/motion` stores require wrapping in runes for Svelte 5 compatibility
  - Achievements grid entrance would need manual staggered logic
- **Effort:** Low
- **Est. files changed:** 10-12

#### 2. Svelte Transitions + CSS `@keyframes` ← **RECOMMENDED**

Svelte transitions for page-level enter/exit and modal mount/unmount. CSS `@keyframes` for micro-interactions (pulse, bounce, shake, glow, confetti-like particle bursts). Centralize reusable keyframes in `app.css`.

- **Pros:**
  - No new runtime dependencies — CSS is free
  - Works perfectly with Svelte 5's `$effect` reactive triggers
  - Custom keyframes give full control over timing, easing, and complexity
  - Can implement: shake (hearts), glow (achievements), confetti rain (level-up), number roll-up (XP)
  - Tailwind v4's `@theme` can define animation presets
  - Achievements page already proves this pattern works
  - Bundle size impact: zero bytes (CSS only)
- **Cons:**
  - CSS keyframes can't sequence across multiple elements without JS orchestration
  - No spring/physics-based motion (only cubic-bezier easings)
  - Staggered list animations need manual delays (but doable with `--animation-delay` custom properties)
- **Effort:** Low-Medium
- **Est. files changed:** 13-16

#### 3. GSAP or Motion Library (e.g., Motion.js, GSAP)

Add a JS animation library for complex sequenced animations, confetti, path morphing, staggered reveals.

- **Pros:**
  - Full timeline control with sequencing, staggering, callbacks
  - Physics-based springs, morphing, scroll-linked animations
  - Confetti, particle effects, complex celebrations (level-up, achievements)
  - GSAP's `ScrollTrigger` if future pages need scroll-based animation
- **Cons:**
  - **Significant bundle weight**: GSAP ~35KB gzipped, Motion.js ~15KB
  - For a PWA, this matters — the app is small and should stay lean
  - Overkill for this app's needs — the animation requirements are simple micro-interactions
  - Adds JS runtime cost to every animation
  - GSAP has a learning curve and doesn't integrate naturally with Svelte's reactive model
  - Confetti can be done with CSS keyframes + a few `<span>` elements
- **Effort:** Medium-High
- **Est. files changed:** 14-18

#### Comparison Table

| Criterion | Svelte Only | Svelte + CSS Keyframes | GSAP/Motion.js |
|-----------|-------------|----------------------|----------------|
| Bundle impact | 0 KB | 0 KB | +15-35 KB |
| Page transitions | ✅ | ✅ | ✅ |
| Modal transitions | ✅ | ✅ | ✅ |
| Shake (hearts) | ❌ | ✅ | ✅ |
| Confetti | ❌ | ✅ (basic) | ✅ (advanced) |
| Sequenced lists | ❌ | ✅ (manual) | ✅ (declarative) |
| Number animations | ✅ (motion) | ✅ (CSS counter) | ✅ |
| Svelte 5 compat | ✅ | ✅ | ⚠️ (wrapping needed) |
| Complexity | Low | Low-Med | Med-High |

---

### Recommendation

**Approach 2: Svelte Transitions + CSS `@keyframes`** — with a specific implementation plan:

1. **Page transitions**: Wrap `{@render children()}` in `+layout.svelte` with a `<div transition:fade={{ duration: 200 }}>` for instant page-level polish.

2. **Centralized keyframes**: Add reusable `@keyframes` to `app.css`: `shake`, `pop-in`, `glow-pulse`, `confetti-fall`, `slide-up`, `number-tick`. These can be referenced via Tailwind's arbitrary values or custom utility classes.

3. **Reactive triggers via `$effect`**: The existing pattern in `XpBar.svelte` (triggering animation when a value changes) should be replicated across components. The codebase already uses `$state` + `$effect` — adding a CSS class toggling via `class:` directives is idiomatic.

4. **Micro-interactions per component**:
   - **XpBar**: Use `$effect` to trigger a CSS animation class when `totalXp` changes. Add a brief `@keyframes glow-pulse` on the bar. Consider a numeric tick-up overlay.
   - **HeartDisplay**: Add `@keyframes shake` + `@keyframes pop-in` triggered when `current` decreases/increases via `$effect`.
   - **StreakBadge**: Add `@keyframes fire-grow` on streak increment. Use the existing `streakLevel` derived state to fire at milestones.
   - **TaskCard**: Add a completion animation (`@keyframes check-pop`) when toggling completed state. The checkbox already changes class — add a brief scale animation.
   - **BossBattleWidget**: Add CSS transition to the progress bar (currently has no animation at all — just static width). Add win/lose badge entrance.
   - **LevelUpModal**: Add CSS confetti (multiple small colored `<span>` elements with staggered `@keyframes confetti-fall`) inside the backdrop. The existing `transition:fade` and `transition:scale` are already solid.
   - **OnboardingModal**: Replace manual `.transition-opacity` with Svelte `transition:fade` and `transition:fly` for each step content area.
   - **XP Toast**: Replace bare `animate-bounce` with Svelte `transition:fly` (enter from right, exit to right) wrapping the conditional block.

5. **What NOT to do**: No need for any npm dependency. No GSAP. No FullPage.js. The app's UX demands are modest — responsive taps, quick feedback, satisfying micro-polish. CSS + Svelte is the right tool for this job.

---

### Risks

- **CSS animation performance at scale**: If the achievements grid grows large (50+ items), staggered entrance keyframes could cause layout thrashing. Mitigate by using `transform`/`opacity` only (GPU-composited properties).
- **Svelte 5 rune compatibility**: `svelte/motion` (tweened/spring) uses stores, which need wrapping for Svelte 5 rune reactivity. Prefer CSS transitions or manual `$effect` + `requestAnimationFrame` for numeric animations.
- **Reduced motion preference**: Must respect `prefers-reduced-motion` at the `:root` level by disabling all decorative animations. Add a global CSS rule: `@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }`.
- **Over-animation**: The app has a dark, serious tone (red/black theme for a study tool). Animations should be subtle and purposeful — never gratuitous. Avoid confetti on every XP gain; save celebration for level-ups and achievements only.

---

### Ready for Proposal

Yes. The exploration is thorough and the recommendation is clear. Proceed to proposal phase with **Approach 2 (Svelte + CSS keyframes)** as the recommended path. The orchestrator should confirm this choice with the user before moving to specification, since it affects the component implementation approach across 13+ files.
