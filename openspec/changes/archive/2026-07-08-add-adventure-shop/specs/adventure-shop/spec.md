## ADDED Requirements

### Requirement: Shop timing
Hints SHALL be purchasable mid-puzzle. All other purchases — lives, level skips, insurance, and permanent upgrades — SHALL be available only between levels (on the level-won screen). All prices SHALL come from `adventure.shop` balance values.

#### Scenario: Between-levels shop
- **WHEN** a level is beaten
- **THEN** the shop offers lives, skip, insurance, and permanent upgrades before advancing

#### Scenario: Mid-puzzle offers hints only
- **WHEN** a puzzle is in progress
- **THEN** hints can be bought, and no other purchase is available

### Requirement: Life purchase
The shop SHALL sell +1 life for `adventure.shop.lifePrice` (initially $3), repeatable while coins last.

#### Scenario: Buying a life
- **WHEN** the player buys a life with at least $3
- **THEN** lives increase by 1 and coins decrease by $3

#### Scenario: Cannot overspend
- **WHEN** the player has fewer coins than the price
- **THEN** the purchase is unavailable

### Requirement: Hints
A hint SHALL cost `adventure.shop.hintPrice` (initially $6), with the type chosen at time of use: (a) reveal a correct letter in its position, (b) reveal a letter that is in the word, (c) remove wrong letters from the keyboard. Hint effects SHALL only reveal information not already known from guesses or prior hints, SHALL be displayed for the rest of the level, and SHALL NOT consume a guess or life. Free hint credits (from Perk B) SHALL be spent before coins.

#### Scenario: Reveal a position
- **WHEN** the player buys a reveal-position hint
- **THEN** a not-yet-known answer position and its letter are shown, and lives are unchanged

#### Scenario: Remove wrong letters
- **WHEN** the player buys a remove-wrong-letters hint
- **THEN** all keyboard letters not in the answer are marked eliminated

#### Scenario: Credits spend first
- **WHEN** the player has a free hint credit and buys a hint
- **THEN** the credit is consumed and coins are unchanged

### Requirement: Level skip
The shop SHALL sell a skip of the next level for `adventure.shop.skipPrice` (initially $50). Boss levels SHALL NOT be skippable. A skipped level SHALL pay no coin reward but SHALL count as beaten for permanent-upgrade triggers.

#### Scenario: Skipping a level
- **WHEN** the player buys a skip after beating level 2
- **THEN** level 3 is passed without play, no coins are awarded for it, and perk triggers fire as if it were beaten

#### Scenario: Bosses cannot be skipped
- **WHEN** the next level is a boss level
- **THEN** the skip purchase is unavailable

### Requirement: Insurance
The first insurance purchase in a run SHALL cost `adventure.shop.insurance.firstPrice` ($10); after a policy has been consumed, repurchase SHALL cost `rebuyPrice` ($20). While a policy is owned, a `premium` ($2) SHALL be charged as each level begins; if it cannot be paid, coverage lapses for that level only (death is final that level). Dying with active coverage SHALL revive the player with `reviveLives` (4) lives on the same puzzle, consuming the policy.

#### Scenario: Premium each level
- **WHEN** a new level begins with a policy owned and at least $2
- **THEN** $2 is charged and the level is covered

#### Scenario: Unpaid premium lapses coverage
- **WHEN** a new level begins with a policy owned and less than $2
- **THEN** no premium is charged and that level is not covered

#### Scenario: Revive on death
- **WHEN** lives reach 0 unsolved with active coverage
- **THEN** the run continues on the same puzzle with 4 lives, the policy is consumed, and repurchase now costs $20

#### Scenario: Lapsed coverage means death
- **WHEN** lives reach 0 unsolved during a lapsed level
- **THEN** the run ends

### Requirement: Permanent upgrades
Each boss beaten SHALL unlock one permanent purchase/upgrade slot. Spending a slot (plus coins) SHALL buy or upgrade a perk: Perk A grants +`livesPerLevel` (1) life every level beaten for `price` ($60), upgradable to +`upgradedLivesPerLevel` (2) for `upgradePrice` ($80); Perk B grants a free hint credit for every level beaten in ≤`guessThreshold` (3) guesses for $60, upgradable to ≤`upgradedGuessThreshold` (4) for $80. Perks last for the rest of the run and are lost on run end.

#### Scenario: Boss unlocks a slot
- **WHEN** a boss is beaten
- **THEN** one permanent purchase/upgrade slot becomes available

#### Scenario: No slot, no purchase
- **WHEN** no unspent slot is available
- **THEN** perk purchases and upgrades are unavailable regardless of coins

#### Scenario: Perk A pays out
- **WHEN** Perk A is owned and a level is beaten
- **THEN** lives increase by the perk's per-level amount in addition to any coin reward

#### Scenario: Perk B earns a credit
- **WHEN** Perk B is owned and a level is beaten within the guess threshold
- **THEN** a free hint credit is granted

### Requirement: Shop state persists
All shop state — insurance status, unspent slots, perk levels, hint credits, and the current level's hint effects — SHALL be part of the run state included in the after-every-guess save snapshot, restoring exactly on resume.

#### Scenario: Resume restores the shop
- **WHEN** a run with insurance, a perk, and revealed hints is resumed from a save
- **THEN** all of it is restored exactly as it was
