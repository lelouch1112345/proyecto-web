# Gamification Engine Specification

## Purpose

Pure functions implementing all game mechanics — zero DOM or storage coupling. Testable via Vitest.

## Requirements

| # | Requirement | Scenarios |
|---|-------------|-----------|
| R1 | MUST compute XP from task difficulty + discipline multipliers | H1, E1 |
| R2 | MUST determine level from cumulative XP (14 titles, 0→6000+ XP) | H1 |
| R3 | MUST check achievement unlock conditions from event history | H2 |
| R4 | MUST manage heart state (5 max, -1 per missed day, +1 per perfect week) | H3, E2 |
| R5 | MUST compute boss battle outcome (Sunday review, 1.5× XP if streaks held) | H4 |
| R6 | MUST reject negative XP or level values | E1 |
| R7 | MUST be pure — no side effects, no storage reads | H1 |
| R8 | Boss battle result message MUST be tone-aware via t() | H5, E3 |
| R9 | Streak notification message MUST be tone-aware via t() | H6, E4 |
| R10 | Achievement unlock message MUST be tone-aware via t() | H7 |

### Scenarios

#### H1: Task completion awards XP

- GIVEN a task of medium difficulty in English discipline
- WHEN `calcXP({ difficulty: "medium", discipline: "english" })` is called
- THEN it returns a positive integer with discipline multiplier applied

#### H2: Achievement unlock

- GIVEN a user with 7 consecutive perfect weeks of data
- WHEN `checkAchievements(eventHistory)` is called
- THEN it returns the "Fénix" achievement as newly unlocked

#### H3: Heart deduction on missed day

- GIVEN a user with 5 hearts who missed yesterday (outside 48h grace)
- WHEN `calcHearts({ current: 5, missedDays: 1 })` is called
- THEN it returns 4 hearts

#### E1: Edge case — negative XP guard

- GIVEN difficulty value is invalid (e.g., negative)
- WHEN `calcXP(...)` is called
- THEN it throws `RangeError` with message "Invalid difficulty"

#### E2: Edge case — zero hearts triggers break mode

- GIVEN `calcHearts` returns 0
- WHEN the function returns
- THEN it includes flag `{ breakMode: true }`

### Requirement: R8 — Boss battle result message MUST be tone-aware

The system MUST provide a format function that resolves boss battle outcome text via `t()` with the current tone.

#### Scenario: H5 — Boss win message adapts to tone

- GIVEN the user won the boss battle and tone is 'energetic'
- WHEN the result message is formatted
- THEN it resolves via `t("bossBattle.win", "energetic")` and returns the energetic variant

#### Scenario: E3 — Boss loss message adapts to tone

- GIVEN the user lost the boss battle and tone is 'empathetic'
- WHEN the result message is formatted
- THEN it resolves via `t("bossBattle.lose", "empathetic")` and returns the empathetic variant

### Requirement: R9 — Streak notification message MUST be tone-aware

The system MUST resolve streak milestone and notification text via `t()`.

#### Scenario: H6 — Streak milestone text adapts to tone

- GIVEN the user reaches a 7-day streak and tone is 'energetic'
- WHEN the streak notification is displayed
- THEN it resolves via `t("streak.milestone.7", "energetic")`

#### Scenario: E4 — Streak broken notification adapts to tone

- GIVEN the user loses a streak and tone is 'empathetic'
- WHEN the streak-broken notification is displayed
- THEN it resolves via `t("streak.broken", "empathetic")`

### Requirement: R10 — Achievement unlock message MUST be tone-aware

The system MUST resolve achievement unlock text via `t()`, using the achievement key and current tone.

#### Scenario: H7 — Achievement unlock text adapts to tone

- GIVEN an achievement unlocks and tone is 'energetic'
- WHEN the unlock message is displayed
- THEN it resolves via `t("achievement.unlock." + achievementKey, "energetic")`
