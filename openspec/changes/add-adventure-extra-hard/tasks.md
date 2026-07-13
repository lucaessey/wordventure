## 1. Balance

- [x] 1.1 In `src/data/balance.json`, add `adventure.startingLives.extraHard` (4), `adventure.startingPerks.extraHard` ({}), `adventure.bossReward.extraHard` (15), and a new `adventure.lifeTaxPerRound` record (`easy` 0, `normal` 0, `hard` 0, `extraHard` 1)
- [x] 1.2 Update the `Balance` type in `src/data/balance.ts`: add `extraHard` to `startingLives`, `startingPerks`, and `bossReward`, and add `lifeTaxPerRound` (per-difficulty numbers); extend `balance.test.ts` to assert the extraHard values and that `lifeTaxPerRound` has all four difficulties with Extra Hard > 0 and the others 0

## 2. Engine

- [x] 2.1 In `src/engine/adventure.ts`, add `'extraHard'` to `AdventureDifficulty`, add `extraHard` to `bossReward` and `lifeTaxPerRound` in `AdventureConfig` (mirroring the balance shape); in `submitGuess`, after a level is solved (the win branch), apply the end-of-round life tax `lives = lives > 0 ? Math.max(1, lives - config.lifeTaxPerRound[difficulty]) : lives` so the level-won/victory state carries the post-tax lives
- [x] 2.2 Update the `AdventureConfig` test fixtures (`adventure.test.ts`, `adventureShop.test.ts`, `adventureSave.test.ts`) to include `extraHard` in the per-difficulty records and a `lifeTaxPerRound` (all 0 in fixtures unless a test needs the tax); add engine tests: an Extra Hard win loses the base guess life PLUS the tax (floored at 1); the tax never drops below 1; a last-life solve on Extra Hard still ends the run on advance; Easy/Normal/Hard wins lose no extra life

## 3. Achievements type

- [x] 3.1 Add `'extraHard'` to the achievements `Difficulty` union in `src/achievements/types.ts` so events carrying `run.difficulty` type-check. Do NOT extend `difficultyTier` — Extra Hard must resolve to no tier (tier 0), earning no difficulty-tiered Adventure badges; add a test asserting `difficultyTier('adventure', 'extraHard')` is 0 and that a non-tiered badge (e.g. Champion) still counts an Extra Hard win

## 4. UI

- [x] 4.1 Add the Extra Hard chip to the difficulty picker in `AdventureSetupScreen`, with a blurb derived from balance values (starting lives + a "−N life each round" note from `lifeTaxPerRound.extraHard`); confirm the run screen's difficulty label renders "Extra Hard"

## 5. Verification

- [x] 5.1 `npm test` green and `npm run build` clean
- [x] 5.2 Manual preview pass: start an Extra Hard run and confirm 4 starting lives and the chip; win a non-boss level and confirm lives drop by the guess cost plus the tax (floored at 1); confirm a level-5 boss also applies the tax and pays the Hard boss reward ($15); confirm Easy/Normal/Hard runs lose no extra life per round; then push to GitHub and verify the deployed app
