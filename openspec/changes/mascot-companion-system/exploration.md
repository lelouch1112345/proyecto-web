## Exploration: Companion Mascot System (Cycle 3)

### Current State

The Third-Life PWA has a functional but purely utilitarian dashboard. All feedback is text/emoji-based through existing components (HeartDisplay, StreakBadge, XpBar, etc.). There is no character or companion that gives the app personality. The adaptive tone system (Cycle 2) provides tone-aware messaging (`deriveTone` → `t(key, tone)`), but this is used for tooltips and labels — not for a conversational character.

The app is deliberately image-free: all icons are emoji, no SVGs, no images. This keeps bundle size small for PWA purposes.

### Affected Areas

- `src/routes/+page.svelte` — Dashboard layout where mascot renders (367 lines)
- `src/lib/components/` — New `Mascot.svelte` component (to be created)
- `src/lib/i18n/tone-registry.ts` — Add `mascot.*` message keys for dialog strings
- `src/lib/i18n/tone.ts` — Already consumed; no changes needed
- `src/app.css` — May add mascot-specific keyframes (bounce, wobble, idle)
- `src/lib/gamification/` — Already consumed (read-only); no changes needed
- `src/tests/components/` — New test file for mascot
- `src/lib/types.ts` — May add mascot personality type if multi-character

### Dashboard Layout Analysis

Current dashboard flow (when `currentDay` exists):
```
┌─ space-y-4 ─────────────────────────────┐
│ XP Animation Toast (fixed top-right)     │
│ Header (day label + title)               │
│ Gamification Bar (hearts | streak | XP)  │
│ Boss Battle (Sunday only)                │
│ Tasks by Discipline (list)               │
│ Check-In Form                            │
│ Micro-Objective card                     │
└──────────────────────────────────────────┘
```

**Potential mascot placements**:

| Location | Pros | Cons |
|----------|------|------|
| **A) In gamification bar** | Always visible, compact, part of state summary | Limited space, may crowd existing widgets |
| **B) Above tasks (after boss battle)** | Natural position above action items, has room for dialog | Adds vertical scroll, might feel disconnected from state |
| **C) Floating bottom-right** | Persistent like a game assistant, doesn't affect layout | Fixed positioning can be annoying, needs z-index management |
| **D) Between header and gamification bar** | High visibility, can show dialog + character side-by-side | Pushes content down, takes space |

### Approaches

1. **Option A: Emoji Character + Text Bubble** — Use a single emoji as the character (e.g., 🦉, 🔥, 👻, 🐱) with a daisyUI-styled speech bubble below/next to it. Dialog text changes via tone and user state.
   - **Pros**: Simplest to implement (~50 lines Svelte), zero visual complexity, fits existing emoji-first pattern, trivial to test
   - **Cons**: No unique character identity, everyone has emoji, limited expressiveness
   - **Effort**: Low

2. **Option B: CSS-Art Character** — Build a small "flame spirit" / "ember buddy" using CSS border-radius, gradients, pseudo-elements, and transforms. Dark theme with red/gold palette matches the Third-Life brand. Character changes expression/size based on tone.
   - **Pros**: Unique visual identity, no external deps, fully animatable (CSS keyframes), thematic fit with fire/streak motifs
   - **Cons**: ~150-250 lines of CSS, visual quality depends on CSS skill, browser rendering variance
   - **Effort**: Medium

3. **Option C: Inline SVG Character** — Create an inline SVG `<svg>` component with multiple states (different paths/colors per tone). Animatable with CSS or SMIL.
   - **Pros**: Scalable, can be detailed, precise control, reusable across app
   - **Cons**: More code to maintain, harder to animate than CSS, heavier than pure CSS
   - **Effort**: Medium-High

### Recommendation

**Phase 1 (MVP): Option A** — Start with an emoji-based character. The app already uses emoji everywhere (heart emojis, discipline emojis, badge emojis in achievements). A single well-chosen emoji as the mascot with a speech bubble and tone-adaptive dialog is the fastest path to value. Tests are trivial (check emoji renders, check dialog text matches tone).

**Phase 2: Option B** — If the emoji mascot proves valuable, evolve to a CSS-art character. The "ember/flame spirit" concept thematically connects to the existing fire emoji 🔥 used for streaks and the red/gold dark theme. This can be a gradual enhancement without breaking the component interface.

### Dialog System Design

The mascot dialog system should leverage the existing `t(key, tone)` infrastructure:

```
New message keys in tone-registry.ts:
  'mascot.greeting'        — On page load, time-aware
  'mascot.encourage'       — During task completion
  'mascot.celebrate'       — Level up, achievement, battle win
  'mascot.empathize'       — Low hearts, break mode, missed days
  'mascot.progress'        — Approaching milestone
  'mascot.streak_milestone'— Hitting streak goals
  'mascot.complete'        — All tasks done
  'mascot.empty'           — No tasks / rest day
```

Each key has 3 tone variants (neutral / empathetic / energetic) with different text and optionally a different emoji expression.

Example dialog selection logic:
```
if (newLevel) → 'mascot.celebrate' (energetic tone)
if (hearts.breakMode) → 'mascot.empathize' (empathetic tone)
if (all tasks done) → 'mascot.complete' (tone-dependent)
else → 'mascot.greeting' (tone-dependent)
```

### Data Dependencies

The mascot component needs the following props (all already available on the dashboard):

| Prop | Source | Used For |
|------|--------|----------|
| `tone` | Already `$derived` in +page.svelte | Dialog variant selection |
| `streak` | `streakRepo.getState()` | Streak-based reactions |
| `hearts` | `heartRepo.getState()` | Health-based reactions |
| `totalXp` | `resultRepo.getTotalXp()` | XP milestone reactions |
| `level` | `getLevelData(totalXp)` | Level-up celebration |
| `completionRatio` | `completedTaskIds.size / tasks.length` | Progress encouragement |
| `newLevel` | Local state | Level-up celebration |
| `xpAnimation` | Local state | XP-earned reaction |
| `bossBattle` | `calcBossBattle()` | Boss battle context |
| `todayCheckIn` | `resultRepo.getCheckInByDate()` | Check-in awareness |
| `currentDay` | `planRepo.getDay()` | Day label for greetings |

### Music/Audio Integration

**No audio system exists** in the codebase. No sound effects, notification sounds, or audio APIs are used. Adding audio would require:
- A sound effect system (AudioContext or HTMLAudioElement)
- Sound files or programmatic audio generation
- User preference toggles in settings

**Recommendation**: Skip audio for MVP. It's a separate initiative that can be added as an enhancement layer on top of the mascot system later.

### Scope Estimate

**First Slice (MVP) — ~1-2 days**:
- Emoji character component (Mascot.svelte) with daisyUI-styled speech bubble
- 6-8 dialog messages in tone-registry.ts leveraging tone system
- Placement in gamification bar (Option A)
- Reactivity to tone + basic state (streak, hearts, completion)
- CSS idle animation (gentle bob/bounce)
- 3-4 component tests

**Full Scope — ~4-6 days**:
- CSS-art character with 3 expression states (happy/neutral/concerned)
- 15+ dialog messages across all scenarios
- Entrance/exit animations (slide-in, pop-in)
- Multiple character selection (settings page)
- Character evolution (changes appearance at higher levels)
- Time-of-day greetings
- Sound effects (requires audio system first)

### Risks

- **Mascot fatigue**: If the mascot speaks too often, users will ignore it. Dialog must be spaced and contextual (not every action).
- **Layout shift**: Fixed or absolute positioning avoids layout shift, but gamification bar placement might need flexbox adjustments.
- **Tone duplication**: The mascot shouldn't just repeat what the existing gamification widgets already show. Dialog should add VALUE, not redundancy.
- **Accessibility**: Speech bubbles must have appropriate aria-labels, animations must respect prefers-reduced-motion.

### Ready for Proposal

**Yes** — The exploration is complete. Sufficient understanding of all affected systems. Key architectural decision is character type (start with emoji, evolve to CSS-art). Recommend proceeding to proposal phase.
