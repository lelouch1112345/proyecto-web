# Ui Animations Specification

## Purpose

Animation and micro-interaction layer for the Third-Life PWA. Subtle, purposeful motion via CSS keyframes + Svelte transitions — zero JS animation dependencies.

## Requirements

| # | Requirement | Scenario |
|---|-------------|----------|
| R1 | Page transitions MUST apply 200ms fade; MUST NOT snap between routes | H1 |
| R2 | XpBar MUST `glow-pulse` on `totalXp` change; fill MUST transition smoothly; SHOULD complete ≤500ms | H2 |
| R3 | HeartDisplay MUST shake on loss, pop-in on gain; break mode MAY have distinct indicator | H3, H4 |
| R4 | StreakBadge MUST fire-grow on increment; celebration glow at 7/14/30/84; no animation on freeze | H5 |
| R5 | LevelUpModal MUST enter with fade+scale; confetti MUST play behind modal; MUST auto-stop at 2s | H6 |
| R6 | TaskCard checkbox MUST scale-pop on completion (150ms); card MUST NOT flash or jerk | H7 |
| R7 | BossBattleWidget bar fill MUST transition smoothly; badge MUST scale-enter on battle end | H8 |
| R8 | EmptyState MUST slide-up + fade-in on mount (300ms) | H9 |
| R9 | OnboardingModal steps MUST slide horizontally, not instant-swap | H10 |
| R10 | XP Toast MUST fly in from right; MUST auto-dismiss after 3s with fade+slide exit | H11 |
| R11 | Achievement cards MUST stagger-enter (50ms delay each); full stagger ≤500ms | H12 |
| R12 | CheckInForm MUST show success indicator for 1.5s on save | H13 |
| R13 | `prefers-reduced-motion` MUST disable decorative animations; essential feedback MAY remain | H14 |

### Scenarios

#### H1: Route navigation with fade
- GIVEN the user navigates from `/` to `/progress`
- WHEN the route changes
- THEN outgoing page fades out, incoming fades in over 200ms

#### H2: XP gain triggers bar pulse
- GIVEN XpBar at 45% fill
- WHEN `totalXp` increases to 50%
- THEN bar fill transitions smoothly with glow-pulse

#### H3: Heart shake on loss
- GIVEN 4 of 5 hearts filled
- WHEN a heart is deducted
- THEN the filled heart plays shake animation

#### H4: Heart pop-in on gain
- GIVEN a heart slot is empty
- WHEN a heart is recovered
- THEN the slot plays a pop-in animation

#### H5: Milestone streak celebration
- GIVEN streak counter at 6
- WHEN it increments to 7
- THEN badge shows fire-growth AND celebration glow

#### H6: Level-up confetti auto-stop
- GIVEN the user levels up
- WHEN LevelUpModal appears
- THEN confetti falls for 2 seconds then is removed

#### H7: Checkbox pop on task done
- GIVEN an unchecked TaskCard checkbox
- WHEN the user clicks it
- THEN the checkbox plays a 150ms scale-pop; card body is stable

#### H8: Battle win badge
- GIVEN boss health at 70%
- WHEN damage reaches 100%
- THEN bar fill animates to 100%; badge scales in 0→1

#### H9: Empty state entrance
- GIVEN a page with no data
- WHEN EmptyState renders
- THEN it slides up 20px while fading in over 300ms

#### H10: Onboarding step forward
- GIVEN user on step 1 of 3
- WHEN they click "Next"
- THEN step 1 slides left out, step 2 slides left in

#### H11: XP toast auto-dismiss
- GIVEN the XP toast is visible
- WHEN 3 seconds pass
- THEN toast fades out while sliding right

#### H12: Staggered card reveal
- GIVEN achievements page with 6 cards
- WHEN the page renders
- THEN cards enter with 50ms delays, all visible within 500ms

#### H13: Save success indicator
- GIVEN the user submits CheckInForm
- WHEN the save succeeds
- THEN a success indicator shows for 1.5s then fades out

#### H14: Reduced motion
- GIVEN `prefers-reduced-motion: reduce` is active
- WHEN LevelUpModal appears
- THEN confetti is disabled; modal uses minimal opacity transition only
