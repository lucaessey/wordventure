# adventure-core Specification

## Purpose
TBD - created by syncing change add-adventure-core. Update Purpose after review.

## Requirements

### Requirement: Campaign structure
An Adventure run SHALL be a campaign of `adventure.levelCount` levels (initially 25). Levels 5, 10, 15, 20, and 25 SHALL be boss levels with word lengths 10, 11, 12, 13, and 14 respectively, defined by the balance value `adventure.bossLevels`. Non-boss word lengths SHALL follow the `adventure.nonBossRamp` balance values, ramping upward across the campaign (provisional — tune in playtesting). Beating level 25 SHALL end the run as a campaign victory.

#### Scenario: Boss lengths are fixed
- **WHEN** the run reaches level 10
- **THEN** the puzzle word has 11 letters

#### Scenario: Non-boss lengths follow the ramp
- **WHEN** the run is on a non-boss level
- **THEN** the word length is the corresponding `adventure.nonBossRamp` entry

#### Scenario: Final showdown wins the campaign
- **WHEN** the player solves the level-25 word
- **THEN** the run ends as a victory

### Requirement: Lives are guesses
A run SHALL start with the chosen difficulty's starting lives (`adventure.startingLives.easy/normal/hard`, initially 6/6/4). Every valid submitted guess SHALL subtract one life; invalid guesses cost nothing. When lives reach 0 with the level unsolved, the run SHALL end unless an active insurance policy revives it (see the adventure-shop capability) — a run that ends starts over from level 1 with no checkpoints. Solving a level with the last life SHALL beat the level, but a level MUST NOT begin with 0 lives — advancing with 0 lives ends the run (or triggers a covered revive).

#### Scenario: A guess costs a life
- **WHEN** a valid guess is submitted and it is not the answer
- **THEN** lives decrease by 1

#### Scenario: Death ends the run with full restart
- **WHEN** lives reach 0 with the level unsolved and no active insurance coverage
- **THEN** the run ends and a new run begins at level 1 with its difficulty's starting lives and no carried-over coins

#### Scenario: Last-life solve beats the level but cannot continue unaided
- **WHEN** the player solves a level with their final life and advances with 0 lives and no active coverage
- **THEN** the level's rewards are granted and the run then ends

### Requirement: Coin earning
Beating a non-boss level SHALL award `adventure.rewards.level` coins (initially $10), identical across all difficulties. Beating a boss SHALL award coins from `adventure.bossReward` keyed by the run's difficulty (initially Easy $25, Normal $20, Hard $15); there SHALL be no flat difficulty-independent boss reward. Coins SHALL accumulate across the run, be displayed during play, and be lost when the run ends. Spending is out of scope for this capability (see the shop change).

#### Scenario: Level reward
- **WHEN** a non-boss level is beaten
- **THEN** the run's coins increase by `adventure.rewards.level` and the amount is shown in the win moment

#### Scenario: Boss reward by difficulty
- **WHEN** a boss level is beaten
- **THEN** the run's coins increase by `adventure.bossReward` for the run's difficulty (Easy, Normal, or Hard)

#### Scenario: Boss reward differs across difficulties
- **WHEN** the same boss level is beaten on Easy versus on Hard
- **THEN** the Easy run gains `adventure.bossReward.easy` and the Hard run gains `adventure.bossReward.hard`, which are different values

### Requirement: Category options
Starting a run SHALL offer: all categories mixed, one fixed category, or a custom subset. Each level's category SHALL follow the chosen option restricted to categories supporting the level's word length, falling back to Original when none qualify — the same eligibility rule as Infinite. The current category SHALL be visible during play.

#### Scenario: All-mixed picks per level
- **WHEN** the run uses all categories mixed
- **THEN** each level's category is drawn from those supporting that level's length

#### Scenario: Fallback at boss lengths
- **WHEN** the chosen categories cannot support a boss-level word length
- **THEN** the boss level's answer is drawn from Original

### Requirement: Save and resume
The full run state (difficulty, level, lives, coins, settings, current puzzle including the answer and all guesses) SHALL be snapshotted to localStorage after every guess. When a save exists, the Adventure setup screen SHALL offer Continue — showing the saved difficulty — and restore the run exactly, including a partially guessed puzzle. Starting a new run SHALL replace the save; run over or victory SHALL clear it. A corrupt or unrecognizable save SHALL be discarded without crashing.

#### Scenario: Snapshot after every guess
- **WHEN** any guess is accepted
- **THEN** the persisted snapshot reflects the run state including that guess

#### Scenario: Resume mid-puzzle
- **WHEN** the app is closed mid-level and reopened
- **THEN** Continue restores the same difficulty, level, lives, coins, answer, and prior guesses

#### Scenario: Death clears the save
- **WHEN** the run ends in defeat or victory
- **THEN** the save is cleared and the setup screen no longer offers Continue

#### Scenario: Corrupt save discarded
- **WHEN** the stored snapshot cannot be parsed or fails shape validation
- **THEN** the setup screen behaves as if no save exists

### Requirement: Boss presentation with story seam
Boss levels SHALL be visibly marked during play, and SHALL open with an intro moment showing a taunt line from the rival company. Taunt text SHALL live in a dedicated story data module (placeholder lines for now) so the story dressing can be written later without touching game logic.

#### Scenario: Boss level marked
- **WHEN** the run is on a boss level
- **THEN** the play screen shows a boss indicator

#### Scenario: Taunt before the boss
- **WHEN** a boss level begins
- **THEN** an intro overlay shows that boss's taunt line from the story module

### Requirement: Difficulty modes
Starting a new Adventure run SHALL require choosing a difficulty — Easy, Normal, or Hard — on the new-run screen. Difficulty SHALL only vary the starting position, per balance values: starting lives (`adventure.startingLives`, initially Easy 6 / Normal 6 / Hard 4) and starting perks (`adventure.startingPerks`, initially Easy starts owning Perk A at base tier for free). All other Adventure rules — economy, insurance, bosses, skips, shop timing, permanent unlock slots — SHALL be identical across difficulties. Difficulty SHALL be locked for the duration of the run and stored in the save state; resuming a saved run SHALL bypass the picker. Any Adventure completion stats or records added in the future SHALL be tracked per difficulty.

#### Scenario: Picking a difficulty
- **WHEN** the player starts a new run on Easy
- **THEN** the run begins with 6 lives and Perk A at base tier, at no cost and consuming no slot

#### Scenario: Normal and Hard starts
- **WHEN** the player starts a new run on Normal or Hard
- **THEN** the run begins with 6 or 4 lives respectively and no starting perks

#### Scenario: Locked for the run
- **WHEN** a run is in progress
- **THEN** no mechanism exists to change its difficulty

#### Scenario: Resume bypasses the picker
- **WHEN** the player continues a saved run
- **THEN** the saved difficulty applies without the picker being shown
