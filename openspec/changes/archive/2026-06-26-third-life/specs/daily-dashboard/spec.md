# Daily Dashboard Specification

## Purpose

Display today's study plan and gamification status — the app's primary view on every visit.

## Requirements

| # | Requirement | Scenarios |
|---|-------------|-----------|
| R1 | MUST load today's tasks from IndexedDB on mount | H1, E1 |
| R2 | MUST show current streak, XP, hearts, and level | H1 |
| R3 | MUST display a micro-objective for the current session | H1 |
| R4 | SHOULD start a session timer when the dashboard is opened | H1 |
| R5 | MUST show empty state with a prompt when no tasks exist for today | E1 |
| R6 | MUST show a "no plan loaded" message if seed data is absent | E2 |
| R7 | SHOULD highlight the next uncompleted task | H1 |

### Scenarios

#### H1: Happy path — first visit, full plan loaded

- GIVEN the user opens the app for the first time
- WHEN the dashboard loads
- THEN daily tasks from Day 1 appear with micro-objective, streak (0), XP (0), 5/5 hearts, and session timer at 00:00
- AND the first uncompleted task is highlighted

#### E1: Empty day — no tasks scheduled

- GIVEN the current date has no tasks (e.g., scheduled rest day)
- WHEN the dashboard loads
- THEN a message "No tasks scheduled — enjoy your rest" appears
- AND streak, XP, hearts remain visible

#### E2: Missing seed data

- GIVEN IndexedDB has no seed data and conversion failed
- WHEN the dashboard tries to load
- THEN a fallback message "Study plan not loaded. Reinstall the app." is shown
- AND navigation to remaining features is blocked
