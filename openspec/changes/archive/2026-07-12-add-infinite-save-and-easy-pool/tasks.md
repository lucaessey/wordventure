## 1. Balance (per-difficulty starting pool)

- [x] 1.1 In `src/data/balance.json`, change `infinite.startingPool` from `4` to `{ "easy": 6, "medium": 4, "hard": 4 }`; update the `Balance` type in `src/data/balance.ts` to a per-difficulty record and adjust `balance.test.ts` to assert each difficulty's pool is positive and Easy is the largest

## 2. Engine

- [x] 2.1 In `src/engine/infinite.ts`, export `INFINITE_DIFFICULTIES = ['easy', 'medium', 'hard'] as const` and derive `Difficulty` from it; change `InfiniteConfig.startingPool` to `Record<Difficulty, number>`; seed `startRun` with `config.startingPool[difficulty]`
- [x] 2.2 Update `src/engine/infinite.test.ts`: the CONFIG fixture's `startingPool` becomes a per-difficulty record; references to `CONFIG.startingPool` become the relevant difficulty; add a test that Easy and Hard start at their configured (different) pools

## 3. Storage (new slot-aware Infinite save)

- [x] 3.1 Add `src/storage/infiniteSave.ts` mirroring `adventureSave.ts`: `SLOT_KEYS` (`['wordventure.infinite.run', 'wordventure.infinite.run.2']`), `export const SAVE_SLOTS`, `saveRun`/`loadRun`/`clearRun` with a leading `slot = 0` param, and an `isValidRun` that checks the `InfiniteRunState` shape and validates `difficulty` against `INFINITE_DIFFICULTIES`
- [x] 3.2 Add `src/storage/infiniteSave.test.ts`: round-trip a run, reject corrupt/wrong-shape/unknown-difficulty saves, two slots persist independently, clearing one leaves the other, out-of-range slot is a no-op, and a null storage is safe

## 4. App + screens

- [x] 4.1 In `src/App.tsx`, change the `infinite-run` screen state to `{ run: InfiniteRunState; slot: number }`; import `startRun as startInfiniteRun`; `onStart(difficulty, theme, slot)` builds the run, `onContinue(run, slot)` restores it, and the run screen's `onNewRun` restarts into `screen.slot` (bump `runNonce` for a remount)
- [x] 4.2 In `src/screens/InfiniteRunScreen.tsx`, take `initialRun` + `slot` + `onNewRun` props instead of building the run internally; initialize the reducer from `initialRun` and remove the internal `restart`; add a snapshot effect (`clearRun(slot)` on run-over/victory else `saveRun(run, slot)`); load words for `loading` OR (`playing` && no data) so a restored run resumes; only emit `game-started` for a genuinely new run
- [x] 4.3 In `src/screens/InfiniteSetupScreen.tsx`, load both slots into state, render two slot cards (reuse `.slot-card`/`.slot-list`) — occupied: summary + Continue + New-run-overwrites; empty: Start-new-run — wired to `onContinue(save, slot)` / `onStart(difficulty, buildTheme(), slot)`; remove the single global start button; add the starting pool to each difficulty blurb; extend the prop types with the slot argument

## 5. Verification

- [x] 5.1 `npm test` green and `npm run build` clean
- [x] 5.2 Manual preview pass: confirm an Easy run starts with a pool of 6 and Medium/Hard with 4; start a run in slot 1, back out, start a different run in slot 2; reopen setup and confirm both slots show correct Continue summaries; continue each and confirm the right run loads and is playable; overwrite a slot and confirm the other is untouched; end a run and confirm only its slot clears; then push to GitHub and verify the deployed app
