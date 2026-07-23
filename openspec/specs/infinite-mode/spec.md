# infinite-mode Specification

## Purpose
TBD - created by syncing change add-infinite-mode. Update Purpose after review.

## Requirements

### Requirement: Run setup
Starting an Infinite run SHALL require choosing a difficulty (Easy, Medium, or Hard) and a theme: one fixed category, a random category each level, or a custom subset of categories. The setup screen SHALL display current high scores.

#### Scenario: Difficulty and theme chosen
- **WHEN** the player picks a difficulty and a theme and starts the run
- **THEN** a run begins at level 1 using those settings

#### Scenario: Custom subset theme
- **WHEN** the player chooses the custom theme and selects a subset of categories
- **THEN** level categories are drawn only from that subset (subject to length eligibility)

### Requirement: Level progression
An Infinite run SHALL consist of `infinite.levelCount` levels (initially 12). The word length at level N SHALL be `infinite.startLength + N - 1` (initially 3 at level 1, ending at 14). Solving a level's word SHALL beat the level; beating the final level SHALL end the run as a victory.

#### Scenario: Length grows per level
- **WHEN** the player beats level N and advances
- **THEN** level N+1 uses a word one letter longer

#### Scenario: Victory on final level
- **WHEN** the player beats level `infinite.levelCount`
- **THEN** the run ends as a victory

### Requirement: Banked guess pool
A run SHALL start with a pool of guesses seeded from the chosen difficulty's `infinite.startingPool` value (initially Easy 6, Medium 4, Hard 4). Every valid submitted guess, on any level, SHALL drain the pool by 1; invalid guesses cost nothing. Beating a level SHALL add guesses by difficulty from balance values `infinite.rewards` (Easy +4, Medium +3, Hard +2), applied after the winning guess's drain, and the reward SHALL be presented as a "+N guesses!" moment. The run SHALL end when the pool reaches 0 without the level being solved. The pool SHALL be displayed prominently at all times during a run.

#### Scenario: Easy starts with a larger pool
- **WHEN** a run is started on Easy
- **THEN** the pool begins at `infinite.startingPool.easy` (initially 6)

#### Scenario: Medium and Hard starting pool
- **WHEN** a run is started on Medium or Hard
- **THEN** the pool begins at `infinite.startingPool.medium` or `infinite.startingPool.hard` respectively (initially 4)

#### Scenario: Guess drains the pool
- **WHEN** a valid guess is submitted and it is not the answer
- **THEN** the pool decreases by 1

#### Scenario: Reward on level completion
- **WHEN** the player solves a level on Easy difficulty
- **THEN** the pool gains `infinite.rewards.easy` guesses and a "+4 guesses!" moment is shown

#### Scenario: Winning on the last pooled guess
- **WHEN** the pool is at 1 and the submitted guess is the answer
- **THEN** the level is beaten and the run continues with the reward added (the run does not end)

#### Scenario: Pool exhausted
- **WHEN** the pool reaches 0 and the level is not solved
- **THEN** the run ends, showing the level reached

### Requirement: Level category eligibility
Each level's category SHALL follow the chosen theme, restricted to categories whose word lists support that level's word length. When no themed category supports the length, the level SHALL use Original. The current category SHALL always be shown at the top of the screen during play.

#### Scenario: Ineligible categories excluded
- **WHEN** the run reaches a word length beyond a themed category's range
- **THEN** that category is not used for the level

#### Scenario: Fallback to Original
- **WHEN** no category in the theme supports the level's word length
- **THEN** the level's answer is drawn from Original

### Requirement: High scores
The app SHALL persist to localStorage the best level reached per difficulty and the lifetime total of levels beaten across all runs. Scores SHALL update when a run ends (pool exhausted or victory), and a new best SHALL be called out on the run-end screen.

#### Scenario: Best level per difficulty
- **WHEN** a run on Medium ends at a higher level than the stored Medium best
- **THEN** the stored Medium best is updated and the run-end screen notes the new record

#### Scenario: Lifetime levels accumulate
- **WHEN** any run ends after beating 3 levels
- **THEN** the lifetime total of levels beaten increases by 3

#### Scenario: Storage unavailable
- **WHEN** localStorage cannot be read or contains corrupt data
- **THEN** the app behaves as if no high scores exist, without crashing

### Requirement: Save and resume
Infinite SHALL provide two independent save slots. The full run state (difficulty, theme, level, pool, levels beaten, current puzzle including the answer and all guesses) SHALL be snapshotted after every guess to the localStorage key of the slot the run belongs to; the two slots SHALL use distinct keys and never overwrite each other. The Infinite setup screen SHALL show both slots: for each occupied slot it SHALL offer Continue — showing that slot's saved difficulty, level, and pool — and restore that run exactly, including a partially guessed level; an empty slot SHALL offer starting a new run. Starting a new run in a slot SHALL replace only that slot's save; the run ending (pool exhausted or victory) SHALL clear only the slot the run belongs to. A run SHALL remain bound to its slot for its lifetime, including retry after it ends. A save whose shape is not recognized — including a difficulty outside the set of Infinite difficulties — SHALL be discarded without crashing.

#### Scenario: Snapshot after every guess
- **WHEN** any guess is accepted
- **THEN** the persisted snapshot for that run's slot reflects the run state including that guess

#### Scenario: Two runs persist independently
- **WHEN** a run is in progress in one slot and a different run is started and played in the other slot
- **THEN** both slots hold their own run and continuing either restores that run unchanged

#### Scenario: Resume mid-level
- **WHEN** the app is closed mid-level and reopened
- **THEN** the slot's Continue restores the same difficulty, level, pool, answer, and prior guesses, and play resumes

#### Scenario: Starting a new run replaces only its slot
- **WHEN** the player starts a new run in one slot while the other slot holds a run
- **THEN** only the chosen slot's save is replaced and the other slot's run is untouched

#### Scenario: Run end clears only that slot
- **WHEN** a run ends (pool exhausted or victory)
- **THEN** that run's slot is cleared and the setup screen no longer offers Continue for it, while the other slot is unaffected

#### Scenario: Corrupt save discarded
- **WHEN** a slot's stored snapshot cannot be parsed or fails shape validation
- **THEN** the setup screen behaves as if that slot is empty
