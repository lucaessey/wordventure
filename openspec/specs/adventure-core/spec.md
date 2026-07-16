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
A run SHALL start with the chosen difficulty's starting lives (`adventure.startingLives.easy/normal/hard/extraHard/superHard`, initially 6/6/4/4/4). Every valid submitted guess SHALL subtract one life; invalid guesses cost nothing. When lives reach 0 with the level unsolved, the run SHALL end unless an active insurance policy revives it (see the adventure-shop capability) — a run that ends starts over from level 1 with no checkpoints. Solving a level with the last life SHALL beat the level, but a level MUST NOT begin with 0 lives — advancing with 0 lives ends the run (or triggers a covered revive).

On Extra Hard and Super Hard, after a round is completed (a level solved, including boss levels), the player SHALL additionally lose a per-round life tax, charged at the end of the round after the level is completed. The tax amount SHALL be resolved from balance: a difficulty with a non-empty `adventure.lifeTaxRamp[difficulty]` (an ascending list of `{ throughLevel, tax }` brackets) SHALL use the tax of the first bracket whose `throughLevel` is at least the completed level; otherwise the difficulty's flat `adventure.lifeTaxPerRound[difficulty]` SHALL apply. Extra Hard SHALL use a flat tax of 1 (empty ramp). Super Hard SHALL use the ramp initially `[{throughLevel:10,tax:1},{throughLevel:17,tax:2},{throughLevel:25,tax:3}]` — levels 1–10 tax 1 life, 11–17 tax 2, 18–25 tax 3. This per-round tax SHALL floor at 1 — it SHALL NOT reduce a positive life total below 1, and it SHALL NOT itself end a run. A round completed with 0 lives remaining (the last-life solve) SHALL still end the run on advancing, exactly as on Hard; the tax SHALL NOT resurrect a 0-life completion. For Easy, Normal, and Hard the per-round tax SHALL be 0 (no effect).

#### Scenario: A guess costs a life
- **WHEN** a valid guess is submitted and it is not the answer
- **THEN** lives decrease by 1

#### Scenario: Death ends the run with full restart
- **WHEN** lives reach 0 with the level unsolved and no active insurance coverage
- **THEN** the run ends and a new run begins at level 1 with its difficulty's starting lives and no carried-over coins

#### Scenario: Last-life solve beats the level but cannot continue unaided
- **WHEN** the player solves a level with their final life and advances with 0 lives and no active coverage
- **THEN** the level's rewards are granted and the run then ends

#### Scenario: Extra Hard taxes a flat life after each completed round
- **WHEN** an Extra Hard player finishes a round (boss or non-boss) with more than 1 life
- **THEN** they lose 1 life (the flat `adventure.lifeTaxPerRound.extraHard`) at the end of the round

#### Scenario: Super Hard scales the tax up by level bracket
- **WHEN** a Super Hard player finishes a round on level 1–10, then on 11–17, then on 18–25 (each with enough lives to absorb it)
- **THEN** the end-of-round tax is 1 life, then 2 lives, then 3 lives respectively, resolved from `adventure.lifeTaxRamp.superHard`

#### Scenario: The scaling tax still floors at 1 and never ends a run
- **WHEN** a Super Hard player finishes a late-campaign round (tax 3) with 1 life remaining
- **THEN** the tax leaves them at 1 life and the run continues

#### Scenario: The scaling tax preserves the last-life-solve rule
- **WHEN** a Super Hard player solves a level having spent their final life (finishing at 0 lives)
- **THEN** the tax does not restore a life and the run ends on advancing, exactly as on Hard

#### Scenario: Other difficulties are untaxed
- **WHEN** a player on Easy, Normal, or Hard finishes a round
- **THEN** no per-round life tax is applied

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
Adventure SHALL provide two independent save slots. The full run state (difficulty, level, lives, coins, settings, current puzzle including the answer and all guesses) SHALL be snapshotted after every guess to the localStorage key of the slot the run belongs to; the two slots SHALL use distinct keys and never overwrite each other. The first slot SHALL use the original single-save key so a pre-existing run appears as slot 1 without migration. The Adventure setup screen SHALL show both slots: for each occupied slot it SHALL offer Continue — showing that slot's saved difficulty, level, lives, and coins — and restore that run exactly, including a partially guessed puzzle; an empty slot SHALL offer starting a new run. Starting a new run in a slot SHALL replace only that slot's save; run over or victory SHALL clear only the slot the run belongs to. A run SHALL remain bound to its slot for its lifetime, including retry after it ends. A save whose shape is not recognized — including a difficulty outside the set of Adventure difficulties — SHALL be discarded without crashing; the set of valid difficulties SHALL cover every selectable Adventure difficulty.

#### Scenario: Snapshot after every guess
- **WHEN** any guess is accepted
- **THEN** the persisted snapshot for that run's slot reflects the run state including that guess

#### Scenario: Two runs persist independently
- **WHEN** a run is in progress in slot 1 and a different run is started and played in slot 2
- **THEN** both slots hold their own run and continuing either restores that run unchanged

#### Scenario: Resume mid-puzzle
- **WHEN** the app is closed mid-level and reopened
- **THEN** the slot's Continue restores the same difficulty, level, lives, coins, answer, and prior guesses

#### Scenario: A pre-existing single save appears as slot 1
- **WHEN** a save written under the original single-save key exists and the setup screen opens
- **THEN** that run is offered as slot 1's Continue

#### Scenario: Starting a new run replaces only its slot
- **WHEN** the player starts a new run in one slot while the other slot holds a run
- **THEN** only the chosen slot's save is replaced and the other slot's run is untouched

#### Scenario: Death clears only that slot
- **WHEN** a run ends in defeat or victory
- **THEN** that run's slot is cleared and the setup screen no longer offers Continue for it, while the other slot is unaffected

#### Scenario: Every difficulty resumes
- **WHEN** a run on any selectable difficulty (including Extra Hard and Super Hard) is saved and reloaded
- **THEN** the save passes validation and is offered for Continue

#### Scenario: Corrupt save discarded
- **WHEN** a slot's stored snapshot cannot be parsed or fails shape validation
- **THEN** the setup screen behaves as if that slot is empty

### Requirement: Boss presentation with story seam
Boss levels SHALL be visibly marked during play, and SHALL open with an intro moment showing a taunt line from the rival company. Taunt text SHALL live in a dedicated story data module (placeholder lines for now) so the story dressing can be written later without touching game logic.

#### Scenario: Boss level marked
- **WHEN** the run is on a boss level
- **THEN** the play screen shows a boss indicator

#### Scenario: Taunt before the boss
- **WHEN** a boss level begins
- **THEN** an intro overlay shows that boss's taunt line from the story module

### Requirement: Difficulty modes
Starting a new Adventure run SHALL require choosing a difficulty — Easy, Normal, Hard, Extra Hard, or Super Hard — on the new-run screen. Difficulty SHALL vary the starting position, per balance values: starting lives (`adventure.startingLives`, initially Easy 6 / Normal 6 / Hard 4 / Extra Hard 4 / Super Hard 4) and starting perks (`adventure.startingPerks`, initially only Easy starts owning Perk A at base tier for free). Extra Hard and Super Hard SHALL each be identical to Hard in every respect (4 starting lives, no free perks, boss reward equal to Hard's) EXCEPT that they additionally apply a per-round life tax (see the Lives are guesses requirement) — Extra Hard a flat tax, Super Hard a tax that scales up by level. All other Adventure rules — economy, insurance, bosses, skips, shop timing, permanent unlock slots — SHALL be identical across difficulties. Difficulty SHALL be locked for the duration of the run and stored in the save state; resuming a saved run SHALL bypass the picker. Any Adventure completion stats or records SHALL be tracked per difficulty, including Extra Hard and Super Hard as their own difficulties.

#### Scenario: Picking a difficulty
- **WHEN** the player starts a new run on Easy
- **THEN** the run begins with 6 lives and Perk A at base tier, at no cost and consuming no slot

#### Scenario: Normal and Hard starts
- **WHEN** the player starts a new run on Normal or Hard
- **THEN** the run begins with 6 or 4 lives respectively and no starting perks

#### Scenario: Extra Hard start
- **WHEN** the player starts a new run on Extra Hard
- **THEN** the run begins with `adventure.startingLives.extraHard` lives (initially 4) and no starting perks, matching Hard's start

#### Scenario: Super Hard start
- **WHEN** the player starts a new run on Super Hard
- **THEN** the run begins with `adventure.startingLives.superHard` lives (initially 4) and no starting perks, matching Hard's start

#### Scenario: All difficulties are selectable
- **WHEN** the Adventure difficulty picker is shown
- **THEN** Easy, Normal, Hard, Extra Hard, and Super Hard are all selectable

#### Scenario: Locked for the run
- **WHEN** a run is in progress
- **THEN** no mechanism exists to change its difficulty

#### Scenario: Resume bypasses the picker
- **WHEN** the player continues a saved run
- **THEN** the saved difficulty applies without the picker being shown
