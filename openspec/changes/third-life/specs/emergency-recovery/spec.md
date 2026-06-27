# Emergency Recovery Specification

## Purpose

Guided wizard that recalculates dates and adjusts plan after missed days.

## Requirements

| # | Requirement | Scenarios |
|---|-------------|-----------|
| R1 | MUST ask how many days were missed (1-84 integer) | H1 |
| R2 | MUST display the correct recovery protocol per bracket: 1-2d, 3-5d, 1+w, burnout | H1 |
| R3 | MUST recalculate all future dates by shifting them by days missed | H1 |
| R4 | MUST apply heart penalty (1 heart per missed day after 48h grace) | H1 |
| R5 | MUST show a summary before committing the adjustment | H1 |
| R6 | SHOULD log the recovery event to error log with category R (Recovery) | H1 |
| R7 | MUST show a guided step-by-step wizard (not a single form) | H1 |

### Scenarios

#### H1: Happy path — 3 days missed, standard recovery

- GIVEN the user missed 3 consecutive days
- WHEN they navigate to emergency recovery
- THEN step 1 asks "How many days did you miss?" with input for 1-84
- WHEN they enter "3"
- THEN step 2 shows the 3-5d protocol text + heart deduction (3 hearts lost)
- WHEN they confirm
- THEN all future dates shift by +3 days and recovery event logged

#### E1: Edge case — burnout (7+ days missed)

- GIVEN the user missed 10 days
- WHEN protocol is determined
- THEN burnout protocol displays with Fénix achievement hint

#### E2: Edge case — user enters 0 or negative days

- GIVEN the input is 0 or negative
- WHEN submitted
- THEN the wizard shows validation error "Must be at least 1 day"
