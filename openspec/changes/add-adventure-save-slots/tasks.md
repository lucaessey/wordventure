## 1. Engine (single source for difficulties)

- [x] 1.1 In `src/engine/adventure.ts`, add `export const ADVENTURE_DIFFICULTIES = ['easy', 'normal', 'hard', 'extraHard', 'superHard'] as const` and change `AdventureDifficulty` to `(typeof ADVENTURE_DIFFICULTIES)[number]` (same members). Confirm the build still type-checks everywhere the union is used.

## 2. Storage (slot-aware + validation fix)

- [x] 2.1 In `src/storage/adventureSave.ts`, add `SLOT_KEYS` (`['wordventure.adventure.run', 'wordventure.adventure.run.2']`) and `export const SAVE_SLOTS = SLOT_KEYS.length`; give `saveRun`/`loadRun`/`clearRun` a leading `slot = 0` parameter before `storage` and key off `SLOT_KEYS[slot]` (out-of-range slot → no-op/null); replace the local difficulty allow-list with `ADVENTURE_DIFFICULTIES` imported from the engine
- [x] 2.2 Update `src/storage/adventureSave.test.ts` for the new `(slot, storage)` signature; add tests: two slots persist independently (write different runs to 0 and 1, load each back), a legacy-key save loads as slot 0, clearing one slot leaves the other, and an Extra Hard AND a Super Hard run round-trip (proving the validation fix)

## 3. App + screens (thread the slot)

- [x] 3.1 In `src/App.tsx`, add `slot: number` to the `adventure-run` screen state; `onStart(difficulty, theme, slot)` and `onContinue(run, slot)` set it; `AdventureRunScreen`'s `onNewRun` restarts into `screen.slot`
- [x] 3.2 In `src/screens/AdventureSetupScreen.tsx`, load both slots (`[loadRun(0), loadRun(1)]` into state), render two slot cards — occupied: summary + Continue + New-run-overwrites; empty: Start-new-run — each wired to `onContinue(save, slot)` / `onStart(difficulty, buildTheme(), slot)`; remove the single global start button; extend the prop types with the slot argument
- [x] 3.3 In `src/screens/AdventureRunScreen.tsx`, add a `slot: number` prop and pass it to `saveRun(run, slot)` and `clearRun(slot)` in the snapshot effect

## 4. Styling

- [x] 4.1 In `src/index.css`, add slot-card styling (reuse the `continue-card` look; a row/stack of two, an empty-state variant, and an action-button row)

## 5. Verification

- [x] 5.1 `npm test` green and `npm run build` clean
- [x] 5.2 Manual preview pass: start a run in slot 1, back out; start a different run (different difficulty) in slot 2; reopen setup and confirm both slots show correct Continue summaries; continue each and confirm the right run loads; overwrite a slot and confirm the other is untouched; end a run and confirm only its slot clears; confirm an Extra Hard/Super Hard run offers Continue after reload; then push to GitHub and verify the deployed app
