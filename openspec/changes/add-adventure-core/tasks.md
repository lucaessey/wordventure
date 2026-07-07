## 1. Balance and shared theme module

- [x] 1.1 Add the `adventure` block to `src/data/balance.json` (levelCount 25, startingLives 4, bossLevels map 5/10/15/20/25 → 10-14, nonBossRamp of 20 provisional lengths, rewards level 10 / boss 50) and extend the `Balance` type; balance test asserts 20 ramp entries, 5 boss entries, and all lengths within 3-14
- [x] 1.2 Extract `CategoryTheme`, `CategoryOption`, and `pickLevelCategory` from `src/engine/infinite.ts` into `src/engine/categoryTheme.ts`; `infinite.ts` re-exports (`InfiniteTheme` stays as an alias) so existing imports and tests keep passing unchanged

## 2. Adventure run engine

- [x] 2.1 Implement `src/engine/adventure.ts`: `AdventureRunState` (config, theme, level, lives, coins, lastReward, current puzzle, phase `loading | playing | level-won | run-over | victory`), `lengthForLevel` (boss map first, then ramp), `isBossLevel`, and pure `startRun`, `beginLevel`, `addLetter`, `removeLetter`, `submitGuess`, `advanceLevel`; `advanceLevel` with 0 lives goes straight to `run-over`
- [x] 2.2 Unit-test the engine: life drain on valid guesses only; level/boss coin rewards; last-life solve grants rewards then dies on advance; run-over at 0 lives unsolved; boss lengths 10-14 at levels 5-25; ramp lengths for non-boss levels; victory on level 25; category fallback at boss lengths; determinism under seeded RNG

## 3. Save/resume

- [x] 3.1 Create `src/storage/adventureSave.ts`: `saveRun`/`loadRun`/`clearRun` over key `wordventure.adventure.run` with Storage injection; `loadRun` validates shape (numbers, phase, strings) and returns null for corrupt/unknown saves
- [x] 3.2 Unit-test save round-trip (mid-puzzle state with guesses restores exactly), corrupt-JSON and wrong-shape rejection, and null-storage safety

## 4. UI

- [x] 4.1 Create `src/data/story.ts`: placeholder rival-company intro line and per-boss taunt lines (the story seam)
- [x] 4.2 Create the Adventure setup screen: story blurb, category options (all mixed / one category / custom subset chips), Continue card (level/lives/coins summary) when a save exists, New run with overwrite note
- [x] 4.3 Create the Adventure run screen: reducer + per-level data loading like Infinite; strip with Level N/25, BOSS badge, category, lives and coins; save-on-every-state-change effect (clear on run end); boss intro overlay with taunt; level/boss won overlay with +$N; run-over overlay (new run from level 1 / home); victory overlay
- [x] 4.4 Add the Adventure card to the home mode picker and the new screens to `App.tsx` (back from run → setup; leaving a run keeps the save)
- [x] 4.5 Style: lives/coins strip, BOSS badge, boss intro overlay, reusing existing CSS variables and patterns

## 5. Verification

- [x] 5.1 `npm test` green and `npm run build` clean
- [x] 5.2 Manual preview pass: start a run, verify life drain and coin rewards, boss badge/taunt at level 5 (via a save-state shortcut if needed), mid-puzzle reload resumes exactly, death clears the save and restarts from level 1, leaving and re-entering keeps the run, Infinite regression after the theme extraction
- [ ] 5.3 Push to GitHub and verify the deployed app
