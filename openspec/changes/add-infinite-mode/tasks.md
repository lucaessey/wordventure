## 1. Balance and storage

- [x] 1.1 Add the `infinite` block to `src/data/balance.json` (`levelCount` 12, `startLength` 3, `startingPool` 4, `rewards` easy 4 / medium 3 / hard 2) and extend the `Balance` type and its test
- [x] 1.2 Create `src/storage/highScores.ts`: `HighScores` type, pure `recordRun(scores, difficulty, levelsBeaten)`, and `loadHighScores`/`saveHighScores` over one localStorage key with corrupt/missing-data fallback; unit-test the pure logic and the wrapper against an in-memory Storage stub

## 2. Infinite run engine

- [x] 2.1 Implement `src/engine/infinite.ts`: `InfiniteRunState` (difficulty, theme, level, pool, run tally, current puzzle guesses/input, phase `playing | level-won | run-over | victory`) with pure `startRun`, `addLetter`, `removeLetter`, `submitGuess`, `advanceLevel`; level N word length derived from balance values; injected RNG
- [x] 2.2 Implement per-level category selection: eligibility by theme + level length using the category index `lengths`, fallback to Original when none qualify
- [x] 2.3 Unit-test the engine: pool drains on valid guesses only; reward applied after the winning drain (last-guess win survives); run-over at pool 0 unsolved; length ramp 3→14; victory after level 12; fixed/random/custom themes; fallback behavior; determinism under seeded RNG

## 3. UI

- [x] 3.1 Rework home into a mode picker (Normal / Infinite cards) and move the category grid to its own `category-grid` screen; update `App.tsx` screen union and back navigation
- [x] 3.2 Add an optional `rows` prop to `Board` (default `maxGuesses`) so Infinite can render submitted guesses + one input row with a scrollable board area
- [x] 3.3 Create the Infinite setup screen: difficulty buttons, theme choice (fixed category / random / custom subset with checkboxes), high-score display, start button
- [x] 3.4 Create the Infinite run screen: header strip with level, current category name, and prominent pool counter; per-level data loading; board + keyboard reuse; "+N guesses!" reward overlay with continue; run-over and victory overlays with levels beaten, new-record callout, new-run and home buttons; record high scores exactly once per run end
- [x] 3.5 Style the new screens (mode cards, setup controls, pool counter, overlays) consistent with the existing CSS variables and mobile-first layout

## 4. Verification

- [x] 4.1 `npm test` green and `npm run build` clean
- [x] 4.2 Manual preview pass: full run on Easy (reward moments, pool display), a run-over (pool to 0), theme variants including a narrow custom subset hitting the Original fallback at high lengths, high scores persisting across reloads, back navigation from every new screen
- [x] 4.3 Push to GitHub and verify the deployed app plays Infinite correctly
