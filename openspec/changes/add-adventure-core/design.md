## Context

Two modes are live. Infinite established the patterns Adventure needs: a pure run-state engine with an injectable RNG, a reducer-driven screen with per-level data loading, theme-based category selection with Original fallback, and localStorage wrappers with corrupt-data fallbacks. DESIGN.md gives Adventure a fixed 25-level campaign (bosses at 5/10/15/20/25 with lengths 10–14), lives that ARE guesses, coins, category options, and a hard save-after-every-guess requirement. Story dressing (rival-company taunts before bosses) is a declared open item — leave a seam.

## Goals / Non-Goals

**Goals:**

- Pure, tested Adventure run engine with JSON-safe state for snapshotting.
- Save/resume after every guess; Continue on the setup screen; death/victory clears the save.
- Boss levels visibly distinct, with a placeholder taunt overlay as the story seam.
- Coin earning wired (+$10 level, +$50 boss) so the shop change only adds spending.

**Non-Goals:**

- No shop, no purchases of any kind (lives, hints, skips, insurance, permanents) — `add-adventure-shop`.
- No difficulty tiers (Adventure has none in DESIGN.md) and no high-score tracking (the campaign is win-or-restart).
- No real story writing — placeholder taunt text only.

## Decisions

### Shared category-theme module

Extract `CategoryTheme` (fixed / random / custom), `CategoryOption`, and `pickLevelCategory` from `infinite.ts` into `src/engine/categoryTheme.ts`. Infinite re-exports them (type alias `InfiniteTheme = CategoryTheme`) so nothing outside the engine changes. Adventure's "all categories mixed" option is the existing `random` kind — same semantics, per-level pick among length-eligible categories with Original fallback.

### Run engine: `src/engine/adventure.ts`

`AdventureRunState` mirrors the Infinite shape: `config`, `theme`, `level`, `lives`, `coins`, `lastReward` (coins from the most recent win, for the overlay), current puzzle (`categoryId`, `answer`, `guesses`, `input`), and `phase: 'loading' | 'playing' | 'level-won' | 'run-over' | 'victory'`. Pure functions `startRun`, `beginLevel`, `addLetter`, `removeLetter`, `submitGuess`, `advanceLevel`.

`submitGuess` on a valid guess: lives −1; if the guess is the answer → `level-won` with `coins += reward` (boss or level rate; `victory` instead on level 25); else if lives is now 0 → `run-over`. Solving on the last life beats the level but leaves 0 lives — without insurance or purchases (future changes) the next level's first guess is impossible, so the run ends when the next guess is attempted... actually the engine ends it eagerly: `advanceLevel` with 0 lives transitions straight to `run-over` rather than presenting an unwinnable puzzle. Invalid guesses cost nothing, as everywhere.

### Level lengths: boss map + non-boss ramp in balance.json

```json
"adventure": {
  "levelCount": 25,
  "startingLives": 4,
  "bossLevels": { "5": 10, "10": 11, "15": 12, "20": 13, "25": 14 },
  "nonBossRamp": [4, 4, 5, 5, 5, 6, 6, 7, 7, 7, 8, 8, 8, 9, 9, 9, 9, 10, 10, 10],
  "rewards": { "level": 10, "boss": 50 }
}
```

`nonBossRamp` holds the 20 non-boss levels' lengths in campaign order (all provisional — tune in playtesting). Keeping bosses in their own map means retuning the ramp can't accidentally touch the design-fixed boss lengths. `lengthForLevel` consults the boss map first, then indexes the ramp by how many non-boss levels precede the level. A balance test asserts the shapes agree (20 ramp entries, 5 bosses, lengths within 3–14).

### Save/resume: serialize the whole run state

`AdventureRunState` is already plain JSON data (the RNG stays outside the state, so this falls out for free). `src/storage/adventureSave.ts` gives `saveRun` / `loadRun` / `clearRun` over one key (`wordventure.adventure.run`) with the same Storage-injection pattern as high scores. `loadRun` validates shape (level/lives/coins numbers, phase in range, answer a string) and returns null on anything suspicious — a corrupt save means a fresh campaign, never a crash. The answer is stored in plain text; a determined kid can cheat via DevTools, and that's fine for this project.

The run screen persists via an effect on every run-state change: save when the phase is `loading`/`playing`/`level-won`, clear on `run-over`/`victory`. Since every accepted guess produces a new state, this satisfies "snapshot after EVERY guess" without sprinkling storage calls through the reducer (which stays pure).

Resume: the setup screen shows Continue (level, lives, coins summary) when `loadRun` returns a save; starting a new run overwrites it. A saved `level-won` phase resumes on the reward overlay; a saved `loading` phase re-fetches level data and re-picks the answer only if `answer` is empty (otherwise the puzzle — including the answer and guesses so far — is restored exactly).

### Boss presentation and the story seam

`isBossLevel(config, level)` drives: a "BOSS" badge in the run strip, and an intro overlay when a boss level begins. The overlay's taunt line comes from a `bossTaunts` record in a small `src/data/story.ts` (placeholder lines keyed by boss level, e.g. level 25 = the rival CEO). When the story gets written (open item), only that file changes. The win overlay for bosses shows the +$50 reward with similar seam.

### UI

- **Setup screen**: story one-liner ("The Daily Word-Search is buying out your company…"), category options (reusing the chip UI patterns), Continue card when a save exists, New run button (with an "overwrites your save" note when one exists).
- **Run screen**: strip shows Level N/25 (+BOSS badge), category, lives ♥ and coins $ prominently; board + keyboard reuse; overlays for boss intro, level/boss won (+$N), run over (restart from level 1 / home), victory (campaign complete).

## Risks / Trade-offs

- [Core-only runs die fast (4 lives, no way to gain more)] → Known and intended for this milestone; the shop change makes campaigns viable. Playtesting of the ramp starts then.
- [Save format will evolve when the shop adds coins-spending, insurance, and perks] → `loadRun`'s validation rejects unknown-shaped saves, so an old save is discarded rather than misread; acceptable pre-release behavior.
- [Effect-based saving could miss a snapshot if the tab dies mid-render] → The window is one render frame after a guess; acceptable for a PWA of this scale.
- [Two engines share theme logic — a change for one mode could ripple] → The extraction is type + one pure function with full test coverage; both modes' tests pin the behavior.

## Open Questions

- The non-boss ramp values are a first guess — tune in playtesting once the shop makes long runs reachable.
- Real taunt lines / story dressing — deferred (open item in DESIGN.md); the seam is `src/data/story.ts`.
