## MODIFIED Requirements

### Requirement: Lives are guesses
A run SHALL start with `adventure.startingLives` lives (initially 4). Every valid submitted guess SHALL subtract one life; invalid guesses cost nothing. When lives reach 0 with the level unsolved, the run SHALL end unless an active insurance policy revives it (see the adventure-shop capability) — a run that ends starts over from level 1 with no checkpoints. Solving a level with the last life SHALL beat the level, but a level MUST NOT begin with 0 lives — advancing with 0 lives ends the run (or triggers a covered revive).

#### Scenario: A guess costs a life
- **WHEN** a valid guess is submitted and it is not the answer
- **THEN** lives decrease by 1

#### Scenario: Death ends the run with full restart
- **WHEN** lives reach 0 with the level unsolved and no active insurance coverage
- **THEN** the run ends and a new run begins at level 1 with starting lives and no carried-over coins

#### Scenario: Last-life solve beats the level but cannot continue unaided
- **WHEN** the player solves a level with their final life and advances with 0 lives and no active coverage
- **THEN** the level's rewards are granted and the run then ends
