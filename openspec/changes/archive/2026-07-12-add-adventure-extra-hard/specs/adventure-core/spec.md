## MODIFIED Requirements

### Requirement: Difficulty modes
Starting a new Adventure run SHALL require choosing a difficulty — Easy, Normal, Hard, or Extra Hard — on the new-run screen. Difficulty SHALL vary the starting position, per balance values: starting lives (`adventure.startingLives`, initially Easy 6 / Normal 6 / Hard 4 / Extra Hard 4) and starting perks (`adventure.startingPerks`, initially only Easy starts owning Perk A at base tier for free). Extra Hard SHALL be identical to Hard in every respect (4 starting lives, no free perks, boss reward equal to Hard's) EXCEPT that it additionally applies a per-round life tax (see the Lives are guesses requirement). All other Adventure rules — economy, insurance, bosses, skips, shop timing, permanent unlock slots — SHALL be identical across difficulties. Difficulty SHALL be locked for the duration of the run and stored in the save state; resuming a saved run SHALL bypass the picker. Any Adventure completion stats or records SHALL be tracked per difficulty, including Extra Hard as its own difficulty.

#### Scenario: Picking a difficulty
- **WHEN** the player starts a new run on Easy
- **THEN** the run begins with 6 lives and Perk A at base tier, at no cost and consuming no slot

#### Scenario: Normal and Hard starts
- **WHEN** the player starts a new run on Normal or Hard
- **THEN** the run begins with 6 or 4 lives respectively and no starting perks

#### Scenario: Extra Hard start
- **WHEN** the player starts a new run on Extra Hard
- **THEN** the run begins with `adventure.startingLives.extraHard` lives (initially 4) and no starting perks, matching Hard's start

#### Scenario: Extra Hard is selectable alongside the others
- **WHEN** the Adventure difficulty picker is shown
- **THEN** Easy, Normal, Hard, and Extra Hard are all selectable

#### Scenario: Locked for the run
- **WHEN** a run is in progress
- **THEN** no mechanism exists to change its difficulty

#### Scenario: Resume bypasses the picker
- **WHEN** the player continues a saved run
- **THEN** the saved difficulty applies without the picker being shown

### Requirement: Lives are guesses
A run SHALL start with the chosen difficulty's starting lives (`adventure.startingLives.easy/normal/hard/extraHard`, initially 6/6/4/4). Every valid submitted guess SHALL subtract one life; invalid guesses cost nothing. When lives reach 0 with the level unsolved, the run SHALL end unless an active insurance policy revives it (see the adventure-shop capability) — a run that ends starts over from level 1 with no checkpoints. Solving a level with the last life SHALL beat the level, but a level MUST NOT begin with 0 lives — advancing with 0 lives ends the run (or triggers a covered revive).

On Extra Hard only, after a round is completed (a level solved, including boss levels), the player SHALL additionally lose `adventure.lifeTaxPerRound.extraHard` (initially 1) life, charged at the end of the round after the level is completed. This per-round tax SHALL floor at 1 — it SHALL NOT reduce a positive life total below 1, and it SHALL NOT itself end a run. A round completed with 0 lives remaining (the last-life solve) SHALL still end the run on advancing, exactly as on Hard; the tax SHALL NOT resurrect a 0-life completion. For the other difficulties the per-round tax SHALL be 0 (no effect).

#### Scenario: A guess costs a life
- **WHEN** a valid guess is submitted and it is not the answer
- **THEN** lives decrease by 1

#### Scenario: Death ends the run with full restart
- **WHEN** lives reach 0 with the level unsolved and no active insurance coverage
- **THEN** the run ends and a new run begins at level 1 with its difficulty's starting lives and no carried-over coins

#### Scenario: Last-life solve beats the level but cannot continue unaided
- **WHEN** the player solves a level with their final life and advances with 0 lives and no active coverage
- **THEN** the level's rewards are granted and the run then ends

#### Scenario: Extra Hard taxes a life after each completed round
- **WHEN** an Extra Hard player finishes a round (boss or non-boss) with more than 1 life
- **THEN** they lose `adventure.lifeTaxPerRound.extraHard` life at the end of the round

#### Scenario: Extra Hard tax floors at 1 and never ends a run
- **WHEN** an Extra Hard player finishes a round with exactly 1 life
- **THEN** the tax leaves them at 1 life and the run continues

#### Scenario: Extra Hard preserves the last-life-solve rule
- **WHEN** an Extra Hard player solves a level having spent their final life (finishing at 0 lives)
- **THEN** the tax does not restore a life and the run ends on advancing, exactly as on Hard

#### Scenario: Other difficulties are untaxed
- **WHEN** a player on Easy, Normal, or Hard finishes a round
- **THEN** no per-round life tax is applied
