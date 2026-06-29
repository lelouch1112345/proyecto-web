# Delta for Daily Dashboard

## MODIFIED Requirements

### Requirement: R2 — MUST show current streak, XP, hearts, level with tone-aware labels

| # | Requirement | Scenarios |
|---|-------------|-----------|
| R2 | MUST show current streak, XP, hearts, and level | H1 |

Display labels (e.g., "Streak", "XP", "Hearts", "Level") MUST be resolved via `t()` and adapt to the current tone. Numeric values are unchanged.
(Previously: uses hardcoded static labels)

#### Scenario: H1 — Happy path, labels adapt to tone

- GIVEN the user has a 7-day streak (tone = 'energetic') and the dashboard loads
- WHEN the dashboard renders
- THEN streak label is resolved via `t("gamification.streak", "energetic")` and displays the energetic variant

### Requirement: R3 — MUST display a tone-aware micro-objective

| # | Requirement | Scenarios |
|---|-------------|-----------|
| R3 | MUST display a micro-objective for the current session | H1 |

Micro-objective text MUST be resolved via `t()` rather than hardcoded.
(Previously: micro-objective was a static string)

#### Scenario: H1 — Micro-objective tone adapts

- GIVEN the current tone is 'empathetic' and a micro-objective is available
- WHEN the dashboard renders the micro-objective
- THEN it is resolved via `t("micro.objective." + objectiveKey, "empathetic")`

### Requirement: R5 — MUST show tone-aware empty state

| # | Requirement | Scenarios |
|---|-------------|-----------|
| R5 | MUST show empty state with a prompt when no tasks exist for today | E1 |

The empty state message MUST be resolved via `t()` to match the current tone.
(Previously: displayed the hardcoded string "No tasks scheduled — enjoy your rest")

#### Scenario: E1 — Empty state adapts to tone

- GIVEN no tasks exist for today and tone is 'energetic'
- WHEN the dashboard loads and shows the empty state
- THEN the message is resolved via `t("empty.day", "energetic")` and displays the energetic variant

### Requirement: R6 — MUST show tone-aware "no plan loaded" fallback

| # | Requirement | Scenarios |
|---|-------------|-----------|
| R6 | MUST show a "no plan loaded" message if seed data is absent | E2 |

Fallback message MUST be resolved via `t()`.
(Previously: displayed hardcoded string "Study plan not loaded. Reinstall the app.")

#### Scenario: E2 — Fallback message adapts to tone

- GIVEN IndexedDB has no seed data and tone is 'neutral'
- WHEN the fallback message is shown
- THEN it is resolved via `t("error.noPlan", "neutral")`

### Requirement: R7 — SHOULD highlight the next uncompleted task with tone-aware label

| # | Requirement | Scenarios |
|---|-------------|-----------|
| R7 | SHOULD highlight the next uncompleted task | H1 |

The highlight label or tooltip SHOULD be resolved via `t()`.
(Previously: highlight label was hardcoded)

#### Scenario: H1 — Task highlight label adapts

- GIVEN uncompleted tasks exist and tone is 'empathetic'
- WHEN the next uncompleted task is highlighted
- THEN its label is resolved via `t("dashboard.nextTask", "empathetic")`
