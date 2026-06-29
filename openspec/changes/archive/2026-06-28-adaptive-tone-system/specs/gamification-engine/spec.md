# Delta for Gamification Engine

## ADDED Requirements

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
