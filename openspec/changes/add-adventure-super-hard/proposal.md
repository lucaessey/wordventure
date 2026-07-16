## Why

Extra Hard added a flat per-round life tax, but the pressure is constant from level 1 to 25. "Super Hard" is for players who want the difficulty to *escalate*: the same brutal Hard start, but a per-round life tax that climbs as the campaign goes on. Early levels sting like Extra Hard; the back half bleeds you faster. It reuses everything Hard/Extra Hard already do — the only new mechanic is a level-scaled tax.

## What Changes

- Add a fifth Adventure difficulty, **Super Hard**, selectable on the difficulty picker alongside Easy / Normal / Hard / Extra Hard.
- Super Hard is identical to Hard (start with 4 lives, guesses subtract lives, no free perks, boss reward $15) **except** for a **scaling per-round life tax**: after finishing each round (every level, including bosses), the player loses lives according to the level just completed — levels 1–10 tax 1, levels 11–17 tax 2, levels 18–25 tax 3.
- The tax is charged at the **end** of the round, after the level is completed. It **floors at 1** — it can never drop the player below 1 life, and the tax by itself can never end a run. The existing last-life-solve rule (finishing a round having spent your last life ends the run on advancing) is unchanged.
- The scaling is expressed as a tunable per-difficulty **ramp** of level brackets in `balance.json` (`adventure.lifeTaxRamp`), not hardcoded. A difficulty with a non-empty ramp uses it; otherwise the existing flat `adventure.lifeTaxPerRound` applies (so Extra Hard is unchanged). Super Hard's flat entry is 0 and its ramp is `[{throughLevel:10,tax:1},{throughLevel:17,tax:2},{throughLevel:25,tax:3}]`.
- All other values live in `balance.json` (`adventure.startingLives.superHard` = 4, `adventure.bossReward.superHard` = 15, `adventure.startingPerks.superHard` = none).
- Difficulty is locked for the run and stored in save state; completion stats are tracked separately for Super Hard, exactly like the other difficulties.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `adventure-core`: the "Difficulty modes" requirement adds Super Hard as a fifth difficulty; the "Lives are guesses" requirement generalizes the per-round life tax to a level-scaled ramp, with Super Hard's brackets as the concrete example.

## Impact

- Modified data: `src/data/balance.json` — add `startingLives.superHard` (4), `startingPerks.superHard` ({}), `bossReward.superHard` (15), `lifeTaxPerRound.superHard` (0), and a new `lifeTaxRamp` per-difficulty record (existing difficulties `[]`, `superHard` the three brackets).
- Modified code: `src/data/balance.ts` (types); `src/engine/adventure.ts` (`AdventureDifficulty` gains `'superHard'`; `AdventureConfig` gains `lifeTaxRamp`; a new `roundLifeTax(config, difficulty, level)` helper resolves the ramp-or-flat tax by level; `submitGuess` uses it in place of the flat lookup); `AdventureSetupScreen` and `AdventureRunScreen` (a fifth difficulty chip/label, blurb derived from balance describing the scaling tax); the achievements `Difficulty` type gains `'superHard'` for event typing only.
- **Achievements deliberately unchanged**: the difficulty-tier mapping stays Tier I = Easy, II = Normal, III = Hard. Super Hard maps to no tier, so it earns **no** difficulty-tiered Adventure badges (no auto Tier IV/V, and it does not earn Hard's Tier III); non-tiered badges (Explorer, Champion, Rich, Regular) still count. Super-Hard-specific achievements are a possible future change.
- No changes to the economy (beyond the identical-to-Hard boss reward), insurance, bosses, skips, shop, or the other modes. Scope is this difficulty only. Extra Hard's flat tax is untouched.

## Open Questions (resolved by prior change)

1. **Last-life solve interaction**: Super Hard preserves Hard's rule — solving a level with your final life (finishing the round at 0 lives) still ends the run on advancing. The floor-at-1 does **not** resurrect a 0-life completion. (Same reading confirmed for Extra Hard.)
2. **Skipped levels**: a purchased level skip is not a completed round, so no tax is applied. (Same default as Extra Hard.)
