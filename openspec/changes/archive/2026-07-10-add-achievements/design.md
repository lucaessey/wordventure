## Context

The three modes already compute every outcome the badges care about: `round.ts` yields a Normal win with its guesses and per-tile feedback; `infinite.ts` tracks level reached, banked pool, and difficulty; `adventure.ts` tracks bosses beaten, coins, insurance state, perks, difficulty, and run end. Project rules: pure engines stay untouched and unit-tested, React is a thin view layer, persistence is localStorage-only, and all tunable numbers live in `balance.json`. The achievements layer must therefore be an observer that the view calls at existing outcome points, plus a pure evaluator and a store — no new game logic.

## Goals / Non-Goals

**Goals:**

- A pure, fully-tested achievement evaluator: `(progress, event) → { progress', newlyUnlocked[] }`, driven by a data catalog and balance thresholds.
- localStorage persistence of earned badges (per-tier for tiered) and progress counters.
- A Trophy Room listing every badge with earned/locked/tier/hidden states, and an unlock toast on any screen.
- Zero changes to the pure engines or gameplay/economy values.

**Non-Goals:**

- No new game mechanics, no engine edits, no balance retuning of existing values.
- No accounts/sync — localStorage only, per device.
- No achievement editor/admin UI.

## Decisions

### Architecture: emit → evaluate (pure) → persist → notify

1. **Events** — a small typed union the view emits at points it already reaches: `game-won` (mode, difficulty?, guessesUsed, maxGuesses, answerLength, categoryId, hadYellow, lastGuessGreens), `game-lost` (mode, lastGuessGreens, answerLength), `level-reached` (mode: infinite, difficulty, level), `pool-held` (banked pool size), `boss-beaten` (difficulty), `run-finished` (mode, difficulty, won, boughtInsuranceEver, revivedAndWon, perksMaxed), `coins-earned` (delta, lifetime), `category-played` (categoryId), `category-solved` (categoryId). These are facts the screens already have in hand — emitting them adds no logic to the engines.
2. **Evaluator** (`src/achievements/evaluate.ts`, pure, tested): folds an event into `AchievementProgress` (counters + sets + per-badge/per-tier earned map) and returns any newly-unlocked badge tiers. All criteria live here as data-driven predicates reading `balance.achievements` thresholds and the catalog.
3. **Store** (`src/achievements/store.ts`): load/save `AchievementProgress` under one localStorage key with corrupt-data fallback (same pattern as high scores / adventure save). A thin `recordEvent(event)` reads, evaluates, saves, and returns newly-unlocked badges for the toast.
4. **Notify**: a global toast subscriber at the app root shows unlock notifications regardless of screen; multiple simultaneous unlocks queue.

### Catalog (`src/data/achievements.ts`)

A static list; each entry: `id`, `group` (onboarding | skill | explorer | infinite | adventure | collection | fun), `kind` (single | difficulty-tiered | volume-tiered), `hidden` (bool), `modeRestriction` (e.g. normal-only), `name`, `howTo` text, and a threshold reference (a key into `balance.achievements`, or a reused existing balance path). The evaluator maps each catalog entry to its predicate. Adding/retuning a badge is a data edit, not a code change.

### Tier semantics

- **Difficulty-tiered** (Infinite, Adventure): three tiers mapped to the mode's three difficulties in ascending order — Infinite `[easy, medium, hard]`, Adventure `[easy, normal, hard]`. Earning the feat on a given difficulty marks only that tier; tiers are independent (non-stacking). A `difficultyTierIndex(mode, difficulty)` helper centralizes the mapping and resolves the Infinite "Medium = Tier II" reconciliation.
- **Volume-tiered** (Collection): three ascending thresholds; crossing a threshold marks that tier (and any lower tiers already crossed, since amount is cumulative). Amounts from `balance.achievements`.
- **Single-tier**: earned/not.
- Difficulty-locked single-tier badges (none in the starter set, but supported): no tiers.

### Mode restrictions

Onboarding and Skill badges are evaluated only for `game-won` events with `mode === 'normal'`; the evaluator ignores those events from other modes. Explorer is separate: it tracks a per-mode "won at least once" set and unlocks when all three modes are present.

### Persistence shape

```ts
interface AchievementProgress {
  earned: Record<string, { tiers?: number[]; at?: string }> // badgeId → earned tiers (or single)
  counters: { gamesPlayed: number; totalWins: number; lifetimeAdventureCoins: number }
  sets: { categoriesPlayed: string[]; flagshipCategoriesSolved: string[]; modesWon: string[]; daysPlayed: string[] }
}
```

`daysPlayed` stores distinct local date strings (Loyal = 7). Sets are deduped. One localStorage key, e.g. `wordventure.achievements`.

### Balance thresholds (`balance.json` → `achievements`)

```json
"achievements": {
  "wordsmithLength": 10,
  "aceGuesses": 1,
  "infinite": { "ascenderLevel": 6, "summiteerLevel": 9, "hoarderPool": 20 },
  "collection": { "gamesPlayed": [10, 50, 100], "totalWins": [10, 50, 100], "adventureCoins": [100, 500, 1000] },
  "loyalDays": 7,
  "flagshipCategories": ["original", "pokemon", "minecraft", "brawl-stars", "animals", "countries"]
}
```

Reused existing values (not duplicated): Clutch = `normal.guessCount`; Perfect Climb = `infinite.levelCount`; Savior = `adventure.levelCount`; boss/level definitions from `adventure.bossLevels`. Provisional — tune in playtesting.

### Trophy Room and the trophy icon

- **Icon**: rendered in the home header's top-left cell (currently an empty spacer, since home has no back button). On every other screen that cell holds the back button, so the trophy icon is simply not rendered there — no overlap, no relocation needed. Home is the entry point, per the design.
- **Trophy Room screen**: reached from the icon; its own header with a back button returning home. Lists badges grouped (Onboarding, Skill, …). Earned badges highlighted; locked show name + `howTo`; tiered badges render three tier pips (I/II/III) with earned ones filled; hidden badges show "???" for name and criteria until any tier is earned, then reveal.

### Wiring (view layer, no engine change)

`GameScreen`, `InfiniteRunScreen`, `AdventureRunScreen` call `recordEvent(...)` in effects that already fire on their outcome transitions (win/lose, level-won, boss beaten via `lastReward`/boss check, run over/victory, coins). `App.tsx` mounts the toast subscriber and adds the `trophy-room` screen; `HomeScreen` renders the icon. These are additive calls, not logic changes.

## Risks / Trade-offs

- [Deriving `hadYellow` / `lastGuessGreens` for badges] → both come from the scored-guess feedback the screens already hold (`ScoredGuess.feedback`); the evaluator receives them as event fields, so no engine change. Purist/Ace/Oof are pure functions of that data.
- [Event double-firing on React StrictMode / re-renders] → `recordEvent` is idempotent for already-earned badges (re-earning is a no-op), and outcome effects fire on a terminal state transition guarded by phase, so duplicates don't corrupt counters. Counter-type events (gamesPlayed) fire once per round start, guarded like the existing high-score record-once pattern.
- [Trophy icon vs back button collision] → resolved structurally by only rendering the icon on home (the one screen with no back button); no per-screen special-casing.
- [Big starter catalog] → it's data; the evaluator is generic over `kind`, so the code size is bounded regardless of badge count.

## Open Questions

Carried from the proposal for review: Infinite Tier II = Medium; flagship-category list; Tycoon = both perks maxed at once; Oof = last guess one letter off on a loss; Collection counts across modes (Rich = Adventure coins only). All are provisional and encoded as configurable data where possible so confirming/adjusting them is a data edit.
