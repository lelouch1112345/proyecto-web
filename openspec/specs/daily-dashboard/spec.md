# Daily Dashboard Specification

## Purpose

Display today's study plan and gamification status — the app's primary view on every visit.

## Requirements

| # | Requirement | Scenarios |
|---|-------------|-----------|
| R1 | MUST load today's tasks from IndexedDB on mount | H1, E1 |
| R2 | MUST show current streak, XP, hearts, and level with tone-aware labels resolved via t() | H1 |
| R3 | MUST display a tone-aware micro-objective for the current session | H1 |
| R4 | SHOULD start a session timer when the dashboard is opened | H1 |
| R5 | MUST show tone-aware empty state with a prompt when no tasks exist for today | E1 |
| R6 | MUST show a tone-aware "no plan loaded" message if seed data is absent | E2 |
| R7 | SHOULD highlight the next uncompleted task with a tone-aware label | H1 |

### Scenarios

#### H1: Happy path — first visit, full plan loaded

- GIVEN the user opens the app for the first time
- WHEN the dashboard loads
- THEN daily tasks from Day 1 appear with micro-objective, streak (0), XP (0), 5/5 hearts, and session timer at 00:00
- AND the first uncompleted task is highlighted

##### H1-tone: Labels adapt to tone

- GIVEN the user has a 7-day streak (tone = 'energetic') and the dashboard loads
- WHEN the dashboard renders
- THEN streak label is resolved via `t("gamification.streak", "energetic")` and displays the energetic variant

##### H1-tone: Micro-objective adapts to tone

- GIVEN the current tone is 'empathetic' and a micro-objective is available
- WHEN the dashboard renders the micro-objective
- THEN it is resolved via `t("micro.objective." + objectiveKey, "empathetic")`

##### H1-tone: Task highlight label adapts to tone

- GIVEN uncompleted tasks exist and tone is 'empathetic'
- WHEN the next uncompleted task is highlighted
- THEN its label is resolved via `t("dashboard.nextTask", "empathetic")`

#### E1: Empty day — no tasks scheduled

- GIVEN the current date has no tasks (e.g., scheduled rest day)
- WHEN the dashboard loads
- THEN a message "No tasks scheduled — enjoy your rest" appears
- AND streak, XP, hearts remain visible

##### E1-tone: Empty state adapts to tone

- GIVEN no tasks exist for today and tone is 'energetic'
- WHEN the dashboard loads and shows the empty state
- THEN the message is resolved via `t("empty.day", "energetic")` and displays the energetic variant

#### E2: Missing seed data

- GIVEN IndexedDB has no seed data and conversion failed
- WHEN the dashboard tries to load
- THEN a fallback message "Study plan not loaded. Reinstall the app." is shown
- AND navigation to remaining features is blocked

##### E2-tone: Fallback message adapts to tone

- GIVEN IndexedDB has no seed data and tone is 'neutral'
- WHEN the fallback message is shown
- THEN it is resolved via `t("error.noPlan", "neutral")`

## Implementation Notes

All display labels (e.g., "Streak", "XP", "Hearts", "Level"), micro-objective text, empty state messages, fallback messages, and task highlight labels MUST be resolved via `t()` and adapt to the current tone. Numeric values are unchanged. Previously all these strings were hardcoded static text.
