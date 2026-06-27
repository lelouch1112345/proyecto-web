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
