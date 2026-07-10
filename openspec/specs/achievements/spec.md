# achievements Specification

## Purpose
TBD - created by syncing change add-achievements. Update Purpose after review.

## Requirements

### Requirement: Event-driven tracking and persistence
Achievements SHALL be tracked in localStorage, driven only by events the game already produces (game won/lost, guesses used, level reached, boss beaten, coins earned, run finished, category played/solved). The pure game engines SHALL NOT be modified — the view layer emits achievement events at existing outcome points, and a pure evaluator folds each event into persisted progress and returns any newly-unlocked badges. Corrupt or missing stored progress SHALL be treated as empty without crashing.

#### Scenario: An existing event unlocks a badge
- **WHEN** the game emits an outcome event (e.g. a Normal win in one guess) that satisfies a badge's criteria
- **THEN** that badge is marked earned in localStorage and reported as newly unlocked

#### Scenario: No engine change
- **WHEN** the achievements system is inspected
- **THEN** the pure engine modules (`round`, `infinite`, `adventure`, and the guess engine) contain no achievement logic; achievements are evaluated from events in a separate module

#### Scenario: Corrupt storage is safe
- **WHEN** the stored achievement progress cannot be parsed
- **THEN** the system behaves as if no achievements are earned and does not crash

### Requirement: Achievement kinds and tier rules
Each achievement SHALL be single-tier, difficulty-tiered (I/II/III), or volume-tiered (I/II/III). For difficulty-tiered achievements (Infinite and Adventure), Tier I SHALL be earned only on the mode's easiest difficulty, Tier II only on its middle difficulty, and Tier III only on its hardest — Infinite maps to Easy/Medium/Hard and Adventure to Easy/Normal/Hard. Difficulty tiers SHALL NOT stack: accomplishing the feat on the hardest difficulty earns Tier III only. Volume-tiered achievements SHALL award tiers by cumulative amount. An achievement locked to a single difficulty SHALL be single-tier with no tiers.

#### Scenario: Difficulty tier is exact
- **WHEN** a difficulty-tiered feat is accomplished on the middle difficulty (Infinite Medium or Adventure Normal)
- **THEN** only Tier II is earned, not Tier I or III

#### Scenario: Hard does not grant lower tiers
- **WHEN** a difficulty-tiered feat is accomplished only on the hardest difficulty
- **THEN** only Tier III is earned; Tiers I and II remain locked

#### Scenario: Volume tier by amount
- **WHEN** a cumulative counter crosses a volume threshold (e.g. 50 games played)
- **THEN** the corresponding tier (and any lower already-crossed tiers) is earned

### Requirement: Mode restrictions
Onboarding and Skill achievements SHALL be earnable only in Normal mode; outcome events from other modes SHALL NOT count toward them. Winning in every mode SHALL be a separate single-tier "Explorer" achievement rather than part of Onboarding.

#### Scenario: Skill badge ignores non-Normal wins
- **WHEN** a one-guess win happens in Infinite or Adventure
- **THEN** the Normal-only "Ace" achievement is not earned

#### Scenario: Explorer across modes
- **WHEN** the player has won at least once in each of Normal, Infinite, and Adventure
- **THEN** the "Explorer" achievement is earned

### Requirement: Starter achievement set
The system SHALL ship the following achievements. Onboarding (Normal only, single-tier): First win; Play every category once; Solve a word in each flagship category. Skill (Normal only, single-tier): Ace (win in 1 guess); Clutch (win on the final guess); Purist (win with no yellow tiles); Wordsmith (win a word of the balance-defined length or longer). Explorer (single-tier): Win in every mode. Infinite (difficulty-tiered): Ascender (reach a balance-defined level); Summiteer (reach a balance-defined higher level); Perfect Climb (clear all levels); Hoarder (hold the balance-defined banked-guess amount at once). Adventure (difficulty-tiered): First Blood (beat the first boss); Savior (finish the campaign); Ironman (finish a run without ever buying insurance); Phoenix (revive from insurance and win the run); Tycoon (own every permanent upgrade at once). Collection (volume-tiered): Regular (games played); Champion (total wins); Rich (lifetime Adventure coins). Fun (single-tier, hidden): Oof (lose with the answer one letter away on the last guess); Loyal (play on the balance-defined number of distinct days).

#### Scenario: Catalog is complete
- **WHEN** the achievements catalog is enumerated
- **THEN** every listed achievement is present with its group, kind, mode restriction, and hidden flag

#### Scenario: A skill badge earns from Normal play
- **WHEN** the player wins a Normal game with no yellow tiles
- **THEN** the "Purist" achievement is earned

### Requirement: Hidden achievements
Hidden achievements (the Fun group) SHALL display as "???" for both name and criteria in the Trophy Room until earned, and SHALL reveal their name and description once unlocked.

#### Scenario: Hidden until earned
- **WHEN** a hidden achievement has not been earned
- **THEN** the Trophy Room shows it as "???" without revealing its name or how to earn it

#### Scenario: Revealed on unlock
- **WHEN** a hidden achievement is earned
- **THEN** the Trophy Room shows its real name and description

### Requirement: Balance-defined thresholds
All achievement thresholds and amounts (word length, guess counts, level targets, banked-guess amount, volume tiers, distinct days, flagship category list) SHALL come from `balance.json` — reusing existing balance values where they already exist (e.g. Normal guess count, Infinite/Adventure level counts) — and SHALL NOT be hardcoded in achievement logic.

#### Scenario: Tuning without code change
- **WHEN** an achievement threshold in `balance.json` is edited
- **THEN** the unlock condition reflects the new value with no source-code change

### Requirement: Unlock notification
When an achievement (or tier) is unlocked, the app SHALL show a small toast/notification regardless of which screen the player is on. Multiple simultaneous unlocks SHALL each be surfaced.

#### Scenario: Toast on any screen
- **WHEN** an achievement unlocks mid-game on a mode screen
- **THEN** a toast announcing it appears without leaving the current screen

### Requirement: Trophy Room contents
The Trophy Room SHALL list all achievements, earned and locked. Earned achievements SHALL be highlighted; locked ones SHALL show their name and how to earn them; tiered achievements SHALL show which of Tiers I/II/III are earned versus locked; hidden achievements SHALL show "???" until unlocked.

#### Scenario: Locked shows how to earn
- **WHEN** the player opens the Trophy Room with a badge unlocked
- **THEN** earned badges are highlighted and locked non-hidden badges show their name and how-to-earn text

#### Scenario: Tier progress shown
- **WHEN** a difficulty-tiered achievement has Tier I earned but II and III locked
- **THEN** the Trophy Room shows Tier I as earned and Tiers II and III as still locked
