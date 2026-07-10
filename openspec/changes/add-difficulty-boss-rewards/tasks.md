## 1. Balance

- [x] 1.1 In `src/data/balance.json`, remove `adventure.rewards.boss` and add `adventure.bossReward: { "easy": 25, "normal": 20, "hard": 15 }`; `adventure.rewards` keeps only `level` (10)
- [x] 1.2 Update the `AdventureConfig` shape in `src/data/balance.ts`: drop `rewards.boss`, add `bossReward: Record<AdventureDifficulty, number>` (or the equivalent easy/normal/hard object); update `balance.test.ts` — replace the `rewards.boss > rewards.level` assertion with checks that `rewards.level > 0` and `bossReward.easy/normal/hard` are all positive numbers

## 2. Engine

- [x] 2.1 In `src/engine/adventure.ts`, change the boss-win branch of `submitGuess` to read `state.config.bossReward[state.difficulty]` instead of `state.config.rewards.boss`; keep the non-boss reward as `state.config.rewards.level` and leave everything else (coins accumulation, `lastReward`, slot unlock, phase transitions) unchanged
- [x] 2.2 Update the `AdventureConfig` test fixtures in `src/engine/adventure.test.ts` and `src/engine/adventureShop.test.ts` (`rewards: { level, boss }` → `rewards: { level }` + `bossReward: { easy, normal, hard }`); update existing boss-win assertions to the fixture's per-difficulty value, and add a test that an Easy boss win and a Hard boss win pay their respective `bossReward` amounts

## 3. Verification

- [x] 3.1 `npm test` green and `npm run build` clean
- [x] 3.2 Manual preview pass: start an Adventure run per difficulty, beat the level-5 boss, and confirm the coin gain matches `bossReward` for that difficulty ($25 Easy / $20 Normal / $15 Hard) while a non-boss level still pays $10; then push to GitHub and verify the deployed app
