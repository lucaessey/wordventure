# balance-config Specification

## Purpose
TBD - created by syncing change add-normal-mode. Update Purpose after review.

## Requirements

### Requirement: Central balance file
All tunable gameplay numbers (guess counts, and later prices, payouts, pool sizes, boss lengths, level counts) SHALL live in the single file `src/data/balance.json`, read through a typed accessor. Game code SHALL NOT hard-code tunable numbers, and specs SHALL reference balance values by name. All values are provisional — tune in playtesting.

#### Scenario: Normal guess count is a balance value
- **WHEN** Normal mode determines its guess limit
- **THEN** it reads `normal.guessCount` from `src/data/balance.json` (initially 6)

#### Scenario: Tuning requires no code change
- **WHEN** a balance value in `balance.json` is edited
- **THEN** gameplay reflects the new value with no source-code changes
