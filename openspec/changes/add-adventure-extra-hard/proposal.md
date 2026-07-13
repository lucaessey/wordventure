## Why

Hard is currently the ceiling for Adventure, and experienced players want a sterner test. "Extra Hard" adds a fourth difficulty that keeps Hard's brutal start but layers on a steady attrition mechanic — a per-round life tax — so a run can't coast even after a clean level. It reuses everything Hard already does; the only new mechanic is the tax.

## What Changes

- Add a fourth Adventure difficulty, **Extra Hard**, selectable on the difficulty picker alongside Easy / Normal / Hard.
- Extra Hard is identical to Hard (start with 4 lives, guesses subtract lives, no free perks, boss reward $15) **except** for a **per-round life tax**: after finishing each round (every level, including bosses), the player loses `adventure.lifeTaxPerRound.extraHard` (1) life.
- The tax is charged at the **end** of the round, after the level is completed. It **floors at 1** — it can never drop the player below 1 life, and the tax by itself can never end a run. The existing last-life-solve rule (finishing a round having spent your last life ends the run on advancing) is unchanged.
- All values live in `balance.json` (`adventure.startingLives.extraHard`, `adventure.lifeTaxPerRound` per difficulty with Extra Hard = 1 and the others 0, `adventure.bossReward.extraHard` = 15, `adventure.startingPerks.extraHard` = none) — nothing hardcoded, so the tax is tunable.
- Difficulty is locked for the run and stored in save state; completion stats are tracked separately for Extra Hard, exactly like the other difficulties.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `adventure-core`: the "Difficulty modes" requirement adds Extra Hard as a fourth difficulty and notes it varies more than the starting position (it adds the per-round tax); the "Lives are guesses" requirement adds the Extra Hard per-round life tax (end-of-round, floor-at-1, never run-ending on its own).

## Impact

- Modified data: `src/data/balance.json` — add `startingLives.extraHard` (4), `startingPerks.extraHard` ({}), `bossReward.extraHard` (15), and a new `lifeTaxPerRound` per-difficulty record (`easy/normal/hard` 0, `extraHard` 1).
- Modified code: `src/data/balance.ts` (types); `src/engine/adventure.ts` (`AdventureDifficulty` gains `'extraHard'`; `submitGuess` applies the end-of-round life tax from `config.lifeTaxPerRound[difficulty]` when a level is completed); `AdventureSetupScreen` (a fourth difficulty chip, blurb derived from balance); the achievements `Difficulty` type gains `'extraHard'` for event typing only.
- **Achievements deliberately unchanged**: the difficulty-tier mapping stays Tier I = Easy, II = Normal, III = Hard. Extra Hard maps to no tier, so it earns **no** difficulty-tiered Adventure badges (no auto Tier IV, and it does not earn Hard's Tier III); non-tiered badges (Explorer, Champion, Rich, Regular) still count. Extra-Hard-specific achievements are a possible future change.
- No changes to the economy (beyond the identical-to-Hard boss reward), insurance, bosses, skips, shop, or the other modes. Scope is this difficulty only.

## Open Questions (please confirm during review)

1. **Last-life solve interaction**: Extra Hard preserves Hard's rule — solving a level with your final life (finishing the round at 0 lives) still ends the run on advancing. The tax's floor-at-1 does **not** resurrect a 0-life completion; it only floors life totals that were already ≥1 before the tax. Confirm this reading of "the tax by itself can never end a run."
2. **Skipped levels**: a purchased level skip counts as "beaten" but the player never played the round. Proposed default: the tax **does not** apply to a skipped level (no round was finished). Say if you'd rather every beaten level — skips included — be taxed.
