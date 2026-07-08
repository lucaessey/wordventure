## MODIFIED Requirements

### Requirement: Permanent upgrades
Each boss beaten SHALL unlock one permanent purchase/upgrade slot. Spending a slot (plus coins) SHALL buy or upgrade a perk: Perk A grants +`livesPerLevel` (1) life every level beaten for `price` ($60), upgradable to +`upgradedLivesPerLevel` (2) for `upgradePrice` ($80); Perk B grants a free hint credit for every level beaten in ≤`guessThreshold` (3) guesses for $60, upgradable to ≤`upgradedGuessThreshold` (4) for $80. Perks last for the rest of the run and are lost on run end. A difficulty MAY grant a perk at run start (per `adventure.startingPerks`); a starting perk is free, consumes no boss-unlock slot, and upgrades through the normal slot-and-coins path.

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

#### Scenario: A starting perk consumes no slot
- **WHEN** an Easy run begins with its free Perk A
- **THEN** unspent slots remain 0 and the perk pays out on level wins as normal

#### Scenario: Upgrading a starting perk follows normal rules
- **WHEN** an Easy run has beaten a boss (one slot) and has $80
- **THEN** the free Perk A can be upgraded to +2 lives, consuming the slot and the coins
