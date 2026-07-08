## Why

Playtesting starts now that the shop is in, and one difficulty won't fit both players: Adventure's original 4-life start is brutal for a kid and right for a veteran. Per the updated DESIGN.md, Adventure gains Easy/Normal/Hard difficulty modes chosen at new-run time, adjusting only the starting position — every other rule stays identical across difficulties.

## What Changes

- Adventure runs begin with a difficulty choice on the new-run screen:
  - **Easy**: 6 starting lives, and the run begins already owning Perk A at base tier (+1 life per level beaten) for free. The free perk consumes no boss-unlock slot and upgrades to +2 for $80 as normal once a slot is available.
  - **Normal**: 6 starting lives, no free perks.
  - **Hard**: the original design — 4 starting lives, no free perks.
- Difficulty is locked for the run, stored in the save state, and shown when resuming; resuming bypasses the picker.
- Balance restructure: `adventure.startingLives` becomes per-difficulty (`easy/normal/hard`: 6/6/4) and `adventure.startingPerks` defines Easy's free perk — no hardcoded difficulty numbers.
- All other Adventure rules (economy, insurance, bosses, skips, shop timing, permanent unlock slots) are identical across difficulties.
- Any future Adventure completion stats/records will be tracked per difficulty (like Infinite's high scores); no stats are added in this change.
- **BREAKING** (internal only, pre-release): the save shape and `adventure.startingLives` balance shape change; existing saves are discarded by validation as usual.

## Capabilities

### New Capabilities

None — difficulty is a modification of existing Adventure behavior.

### Modified Capabilities

- `adventure-core`: "Lives are guesses" (starting lives become per-difficulty) and "Save and resume" (difficulty is part of the snapshot and shown on Continue); a new "Difficulty modes" requirement is ADDED to this spec (picker, lock, Easy's free perk, per-difficulty stats rule).
- `adventure-shop`: "Permanent upgrades" gains the Easy starting-perk clauses (free, no slot consumed, upgradable normally).

## Impact

- Modified code: `balance.json`/`balance.ts` (startingLives per difficulty, startingPerks), `src/engine/adventure.ts` (`AdventureDifficulty` type, `startRun(difficulty, …)` seeding lives and Easy's perk), `adventureSave.ts` validation, `AdventureSetupScreen` (difficulty picker; Continue card shows difficulty), run screen header (difficulty label).
- Tests: engine tests for per-difficulty starts and the free-perk interactions; save round-trip with difficulty.
- **Sequencing**: this change's spec deltas are written against `add-adventure-shop`'s deltas — archive/sync `add-adventure-shop` first.
- Normal and Infinite modes untouched (Adventure's difficulty type is its own `easy | normal | hard`, distinct from Infinite's `easy | medium | hard`).
