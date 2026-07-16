## 1. Balance

- [x] 1.1 In `src/data/balance.json`, add `adventure.startingLives.superHard` (4), `adventure.startingPerks.superHard` ({}), `adventure.bossReward.superHard` (15), `adventure.lifeTaxPerRound.superHard` (0), and a new `adventure.lifeTaxRamp` record: existing difficulties `[]`, `superHard` `[{ "throughLevel": 10, "tax": 1 }, { "throughLevel": 17, "tax": 2 }, { "throughLevel": 25, "tax": 3 }]`
- [x] 1.2 Update the `Balance` type in `src/data/balance.ts`: add `superHard` to `startingLives`, `startingPerks`, `bossReward`, and `lifeTaxPerRound`, and add `lifeTaxRamp` (per-difficulty array of `{ throughLevel: number; tax: number }`); extend `balance.test.ts` to loop `superHard` into the shape checks and assert the ramp is ascending, Super Hard's brackets are 1/2/3, and non-ramped difficulties have an empty ramp

## 2. Engine

- [x] 2.1 In `src/engine/adventure.ts`, add `'superHard'` to `AdventureDifficulty`, add `lifeTaxRamp` to `AdventureConfig` (mirroring the balance shape), and add a `roundLifeTax(config, difficulty, level)` helper that returns the first ramp bracket's tax whose `throughLevel >= level` (holding the top rate past the last bracket), or the flat `lifeTaxPerRound[difficulty]` when the ramp is empty; change `submitGuess` to compute the end-of-round tax via `roundLifeTax(state.config, state.difficulty, state.level)` instead of the flat lookup
- [x] 2.2 Update the `AdventureConfig` test fixtures (`adventure.test.ts`, `adventureShop.test.ts`, `adventureSave.test.ts`) to include `superHard` in the per-difficulty records and a `lifeTaxRamp` (all `[]` in shared fixtures); add engine tests: a Super Hard win taxes 1 on levels 1–10, 2 on 11–17, 3 on 18–25 (bracket boundaries pinned); the scaling tax floors at 1; a last-life solve on Super Hard still ends the run on advance; Extra Hard's flat tax and Easy/Normal/Hard's no-tax are unchanged

## 3. Achievements type

- [x] 3.1 Add `'superHard'` to the achievements `Difficulty` union in `src/achievements/types.ts` so events carrying `run.difficulty` type-check. Do NOT extend `difficultyTier` — Super Hard must resolve to no tier (tier 0), earning no difficulty-tiered Adventure badges; add a test asserting `difficultyTier('adventure', 'superHard')` is 0 and that a non-tiered badge (e.g. Champion) still counts a Super Hard win

## 4. UI

- [x] 4.1 Add the Super Hard chip to the difficulty picker in `AdventureSetupScreen`, with a blurb derived from balance values (starting lives + a scaling-tax note computed from `lifeTaxRamp.superHard`, e.g. "−1–3 lives each round (scales up)"); add `superHard: 'Super Hard'` to the run screen's difficulty label map and confirm it renders

## 5. Verification

- [x] 5.1 `npm test` green and `npm run build` clean
- [x] 5.2 Manual preview pass: start a Super Hard run and confirm 4 starting lives and the chip; win an early level and confirm lives drop by the guess cost plus a 1-life tax; confirm Extra Hard still taxes a flat 1 and Easy/Normal/Hard lose no extra life; then push to GitHub and verify the deployed app
