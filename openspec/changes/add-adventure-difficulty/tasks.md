## 1. Balance

- [ ] 1.1 Restructure `adventure.startingLives` in `src/data/balance.json` to `{ "easy": 6, "normal": 6, "hard": 4 }` and add `adventure.startingPerks` (`{ "easy": { "perkA": 1 }, "normal": {}, "hard": {} }`); update the `Balance` type and the balance test (three difficulties present, lives within sane bounds, starting perk tiers valid)

## 2. Engine

- [ ] 2.1 Add `AdventureDifficulty` (`'easy' | 'normal' | 'hard'`) to `src/engine/adventure.ts`; `startRun` takes difficulty first, stores it on `AdventureRunState`, and seeds `lives` and `shop.perkA` from the per-difficulty balance values
- [ ] 2.2 Update engine tests: per-difficulty starting lives; Easy starts with `perkA: 1` and 0 slots; the free perk pays +1 life on level wins immediately; buying Perk A on Easy is a no-op (already owned); upgrading it still requires a slot + $80; Normal/Hard start with no perks; update existing fixtures for the new config shape
- [ ] 2.3 Extend `adventureSave.ts` validation with the `difficulty` field (must be one of the three); saves without it are rejected; extend the round-trip test and add a missing-difficulty rejection test

## 3. UI

- [ ] 3.1 Add the difficulty chip row to `AdventureSetupScreen` (default Normal, blurbs derived from balance values), pass the choice through `onStart` into `startRun`; Continue card shows the saved difficulty and bypasses the picker
- [ ] 3.2 Show the difficulty in the run screen strip (e.g. "Easy · Level 3/25")
- [ ] 3.3 Update `App.tsx` plumbing for the new `startRun` signature (new-run and run-over "New run" paths carry the difficulty)

## 4. Verification

- [ ] 4.1 `npm test` green and `npm run build` clean
- [ ] 4.2 Manual preview pass: start one run per difficulty and verify lives/perk seeding (Easy's shop shows the owned perk with only the upgrade offered); win a level on Easy and see the free perk's +1 life; resume a saved run and confirm the picker is bypassed and the difficulty shows on the Continue card and strip; old-format save discarded
- [ ] 4.3 Archive/sync `add-adventure-shop` first if still active, then push to GitHub and verify the deployed app
