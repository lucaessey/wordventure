## Why

The flat $50 boss reward makes Adventure's mid-game economy the same regardless of difficulty, and playtesting showed it runs a large surplus. Scaling the boss reward down and varying it by difficulty gives the three difficulties distinct economic pressure — Easy stays generous, Hard is leaner — matching the rest of the difficulty design (starting lives, free perks) which already differs per difficulty.

## What Changes

- Replace the flat `adventure.rewards.boss` ($50) entirely with a per-difficulty boss reward `adventure.bossReward` — Easy $25, Normal $20, Hard $15 — read by difficulty at the time a boss is beaten. No hardcoded numbers.
- The non-boss level reward stays `adventure.rewards.level` ($10), unchanged and identical across all difficulties.
- Everything else about boss levels is unchanged: they occur at levels 5/10/15/20/25 with word lengths 10–14, cannot be skipped, and each boss beaten still unlocks one permanent-upgrade slot.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `adventure-core`: the "Coin earning" requirement changes so the boss reward is drawn per-difficulty from `adventure.bossReward` instead of the flat `adventure.rewards.boss`.

## Impact

- Modified data: `src/data/balance.json` — remove `adventure.rewards.boss`; add `adventure.bossReward: { easy, normal, hard }`. `adventure.rewards` keeps only `level`.
- Modified code: `src/data/balance.ts` (the `AdventureConfig`/`Balance` type: drop `rewards.boss`, add `bossReward`); `src/engine/adventure.ts` (`submitGuess` boss branch reads `config.bossReward[state.difficulty]` — the run already carries `difficulty`).
- Modified tests: `src/engine/adventure.test.ts` and `src/engine/adventureShop.test.ts` config fixtures and boss-reward assertions; `src/data/balance.test.ts` (the `rewards.boss > rewards.level` assertion is replaced with a per-difficulty boss-reward check).
- No change to the non-boss reward, boss placement/lengths, skip rules, slot unlocks, or any other mode. Scope is boss reward values only.
