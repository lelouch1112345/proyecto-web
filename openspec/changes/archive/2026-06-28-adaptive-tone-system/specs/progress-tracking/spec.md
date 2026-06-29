# Delta for Progress Tracking

## MODIFIED Requirements

### Requirement: R6 — MUST show tone-aware empty state with onboarding prompt on first visit

| # | Requirement | Scenarios |
|---|-------------|-----------|
| R6 | MUST show empty state with onboarding prompt on first visit | E1 |

The onboarding prompt text MUST be resolved via `t()` and adapt to the current tone.
(Previously: displayed a hardcoded prompt text)

#### Scenario: E1 — Empty state adapts to tone

- GIVEN the user has never completed any task and tone is 'empathetic'
- WHEN the progress page loads
- THEN the empty state message is resolved via `t("progress.empty", "empathetic")` and displays the empathetic variant
- AND the prompt to visit the daily dashboard is also resolved via `t()`

### Requirement: R7 — MUST show tone-aware "no data yet" placeholders

| # | Requirement | Scenarios |
|---|-------------|-----------|
| R7 | MUST show "no data yet" placeholder for each chart when data is absent | E1 |

Placeholder text for absent chart data MUST be resolved via `t()`.
(Previously: displayed hardcoded placeholder string "Complete your first tasks to see progress here")

#### Scenario: E1 — Placeholder adapts to tone

- GIVEN no chart data exists and tone is 'energetic'
- WHEN each chart area renders the placeholder
- THEN the placeholder text is resolved via `t("progress.noData", "energetic")`
