# Progress Tracking Specification

## Purpose

Visualize historical progress across disciplines to reinforce consistency.

## Requirements

| # | Requirement | Scenarios |
|---|-------------|-----------|
| R1 | MUST render an XP history chart (last 30 days) on load | H1 |
| R2 | MUST display a discipline radar chart showing time per discipline | H1 |
| R3 | MUST render a streak calendar (current month, color-coded days) | H1 |
| R4 | MUST show calibration accuracy (% of correct predictions vs actual) | H1 |
| R5 | SHOULD allow switching between month/week/all time views | H1 |
| R6 | MUST show empty state with onboarding prompt on first visit | E1 |
| R7 | MUST show "no data yet" placeholder for each chart when data is absent | E1 |

### Scenarios

#### H1: Happy path — returning user with 2+ weeks of data

- GIVEN the user has completed tasks for 14+ days
- WHEN the progress page loads
- THEN XP history chart shows a rising line, radar shows discipline balance, streak calendar shows green/yellow/red cells, and calibration accuracy shows a percentage

#### E1: First visit — no progress data

- GIVEN the user has never completed any task
- WHEN the progress page loads
- THEN each chart area shows "Complete your first tasks to see progress here"
- AND the page prompts the user to visit the daily dashboard
