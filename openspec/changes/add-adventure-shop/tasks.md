## 1. Balance

- [x] 1.1 Add the `adventure.shop` block to `src/data/balance.json` (lifePrice 3, hintPrice 6, skipPrice 50, insurance first 10 / rebuy 20 / premium 2 / reviveLives 4, perkA 60/80 with 1/2 lives, perkB 60/80 with thresholds 3/4), extend the `Balance` type, and add a balance test for the block's shape

## 2. Engine

- [x] 2.1 Extend `AdventureRunState` with the `shop` field (insurance owned/covered/everUsed, permanentSlots, perkA/perkB levels, hintCredits, per-level hints revealed/contained/eliminated); `startRun` seeds it empty; add the `revived` phase
- [x] 2.2 Wire core transitions in `adventure.ts`: win applies Perk A lives, Perk B credit (threshold by perk level), and +1 slot on boss wins; death with owned+covered insurance → `revived` phase (reviveLives, policy consumed, everUsed); `advanceLevel` charges the premium (or lapses coverage), clears per-level hints, and revives instead of run-over at 0 lives when covered; add a `resumePlay` transition from `revived`
- [x] 2.3 Create `src/engine/adventureShop.ts`: pure `buyLife`, `buyInsurance`, `buySkip` (skip counts as beaten for perk triggers, no coins, boss-next and phase guards), `buyPerk`, `upgradePerk` (slot + coin guards), `useHint` (credit-before-coins, three types with injected RNG, only-unknown-information targeting, no-op when nothing to reveal)
- [x] 2.4 Unit-test the shop engine: every purchase's happy path and guard (can't afford, wrong phase, no slot, boss next, nothing to reveal); premium charge and lapse; revive consumes policy and rebuy price switches; last-life-solve + covered advance revives; skip fires both perk triggers; hint targeting never repeats known information; credits spend before coins
- [x] 2.5 Update `adventureSave.ts` validation for the `shop` field (old saves without it are rejected) and extend the round-trip test with a shop-rich state

## 3. UI

- [x] 3.1 Grow the level-won overlay into the shop: reward header, lives/coins status, purchase rows (life, skip with next-level preview, insurance with status/price line, perks section once slots exist) with disabled-state reasons, and Next level button
- [x] 3.2 Add the mid-puzzle hint button and three-option picker (price or credits shown); render revealed/contained hints as a strip above the board; merge eliminated/contained letters into the keyboard state map
- [x] 3.3 Add the `revived` phase overlay ("Insurance kicked in!") and the insured shield indicator (covered vs lapsed) to the run strip
- [x] 3.4 Style the shop rows, hint strip, hint picker, and shield indicator within the existing CSS system; verify the shop overlay scrolls at 375px width

## 4. Verification

- [x] 4.1 `npm test` green and `npm run build` clean
- [x] 4.2 Manual preview pass (crafted saves where grinding is impractical): buy lives; use all three hint types and confirm keyboard/strip effects and no-repeat targeting; skip a level and see perk triggers without coins; insurance full cycle — buy at $10, premium each level, lapse when broke, die covered → revive → rebuy at $20; boss win grants a slot; buy and upgrade both perks; resume a save mid-run with shop state intact
- [ ] 4.3 Push to GitHub, verify the deployed app, and confirm a full campaign is now realistically winnable (playtesting begins)
