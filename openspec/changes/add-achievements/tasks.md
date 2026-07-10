## 1. Balance and catalog

- [x] 1.1 Add an `achievements` block to `src/data/balance.json` (wordsmithLength 10, aceGuesses 1, infinite ascenderLevel 6 / summiteerLevel 9 / hoarderPool 20, collection gamesPlayed/totalWins [10,50,100] and adventureCoins [100,500,1000], loyalDays 7, flagshipCategories = the six originals); extend the `Balance` type and cover the block in `balance.test.ts`
- [x] 1.2 Create `src/data/achievements.ts`: the badge catalog — each entry `{ id, group, kind, hidden, modeRestriction, name, howTo, threshold-ref }` for every achievement in the starter set; reuse existing balance paths for Clutch (`normal.guessCount`), Perfect Climb (`infinite.levelCount`), Savior (`adventure.levelCount`)

## 2. Evaluator (pure, tested)

- [x] 2.1 Create `src/achievements/types.ts`: the `AchievementEvent` union (game-won/game-lost with guesses/hadYellow/lastGuessGreens/answerLength/category/difficulty/mode; level-reached; pool-held; boss-beaten; coins-earned; run-finished with won/boughtInsuranceEver/revivedAndWon/perksMaxed; category-played/solved), `AchievementProgress`, and a `difficultyTierIndex(mode, difficulty)` helper (Infinite easy/medium/hard → 0/1/2; Adventure easy/normal/hard → 0/1/2)
- [x] 2.2 Implement `src/achievements/evaluate.ts` (pure): fold an event into progress and return newly-unlocked badge tiers, driven by the catalog + `balance.achievements`; implement single-tier, difficulty-tiered (non-stacking, exact difficulty), and volume-tiered (cumulative) rules; enforce the Normal-only restriction for Onboarding/Skill; handle Explorer (per-mode win set) and hidden flags
- [x] 2.3 Unit-test the evaluator: each starter badge's unlock condition; difficulty tiers earn only the exact tier and never stack; volume tiers award on crossing (and back-fill lower tiers); Normal-only events from other modes are ignored; Explorer needs all three modes; re-earning is idempotent; thresholds read from balance

## 3. Store and event emission

- [x] 3.1 Create `src/achievements/store.ts`: load/save `AchievementProgress` under one localStorage key with corrupt/missing-data fallback; `recordEvent(event)` (load → evaluate → save → return newly unlocked) and a subscribe API for the toast; unit-test round-trip, corrupt fallback, and that `recordEvent` surfaces new unlocks
- [x] 3.2 Emit events from the Normal `GameScreen` at existing outcome points: `category-played` on round start (+ games-played counter), and on a win/loss `game-won`/`game-lost` carrying guessesUsed, maxGuesses, answerLength, categoryId, hadYellow, lastGuessGreens (all derived from data the screen already holds), plus `category-solved` on a win
- [x] 3.3 Emit events from `InfiniteRunScreen`: `level-reached` (difficulty, level), `pool-held` (banked pool after a change), a per-mode win event on beating a level (for Explorer), and `run-finished` on run end
- [x] 3.4 Emit events from `AdventureRunScreen`: `boss-beaten` (difficulty), `coins-earned` (lifetime accumulation), a per-mode win on beating a level (Explorer), and `run-finished` (won, boughtInsuranceEver, revivedAndWon, perksMaxed) — all read from run state the screen already has

## 4. UI

- [x] 4.1 Create a global unlock-toast component subscribed to the store; queue multiple simultaneous unlocks; mount at the app root so it shows on any screen
- [x] 4.2 Create `src/screens/TrophyRoomScreen.tsx`: list all catalog badges grouped; earned highlighted; locked non-hidden show name + how-to; difficulty/volume-tiered show three I/II/III pips with earned ones filled; hidden show "???" for name and criteria until earned
- [x] 4.3 Add the 🏆 trophy icon to the `HomeScreen` header's top-left (the otherwise-empty left cell) opening the Trophy Room; add the `trophy-room` screen to `App.tsx` (screen union + back-to-home); ensure the icon renders only on home so it never collides with a back button
- [x] 4.4 Style the trophy icon, Trophy Room (badge rows, tier pips, earned/locked/hidden states), and the unlock toast, consistent with the existing CSS variables and mobile-first layout

## 5. Verification

- [x] 5.1 `npm test` green (evaluator, store, balance) and `npm run build` clean
- [x] 5.2 Manual preview pass: earn First win + a Skill badge (e.g. Purist) + a category solve in Normal → unlock toast appears; open the Trophy Room from the home 🏆 and confirm earned are highlighted, locked show how-to, tiered show I/II/III pips, and Fun badges show "???"; confirm the trophy icon appears only on home and never overlaps a back button; then push to GitHub and verify the deployed app
