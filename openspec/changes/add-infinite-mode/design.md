## Context

Normal mode shipped with the reusable pieces Infinite needs: pure engine modules (`validateGuess`, `scoreGuess`, `keyboardState`, `selectAnswer`, `round`), Board/Tile/Keyboard components, the category metadata index, dynamic word-data loading, and `balance.json`. The home screen currently *is* Normal's category grid; DESIGN.md gives Infinite its own run structure (12 levels, banked pool, themes, difficulties, high scores) and mandates the pool be displayed prominently at all times.

## Goals / Non-Goals

**Goals:**

- Pure, fully-tested Infinite run engine; React stays a thin view.
- Home becomes a mode picker with room for Adventure later.
- High scores (best level per difficulty, lifetime levels beaten) in localStorage.
- Reward moment ("+N guesses!") and always-visible pool as the run's health bar.

**Non-Goals:**

- No run save/resume — an Infinite run is one sitting; only high scores persist (DESIGN.md mandates mid-run persistence for Adventure only).
- No coins, hints, or shop (Adventure changes).
- No changes to Normal gameplay, the guess engine, or word data.

## Decisions

### Run engine: `src/engine/infinite.ts`, reducer-shaped like `round.ts`

`InfiniteRunState` holds `difficulty`, `theme`, `level`, `pool`, `totalLevelsBeaten` (this run), the current level's `categoryId` + `answer` + scored guesses + input, and `phase: 'playing' | 'level-won' | 'run-over' | 'victory'`. Pure functions: `startRun`, `addLetter`, `removeLetter`, `submitGuess`, `advanceLevel`. Level rounds reuse `validateGuess` + `scoreGuess` directly rather than wrapping `round.ts` — Infinite has no per-level guess limit (the pool is the only limit), so `round`'s `maxGuesses`/`lost` semantics don't apply.

Pool math on a valid submitted guess, in order: pool −1; if the guess is the answer → phase `level-won`, pool += reward for difficulty (so winning on your last guess saves the run — reward applies after the drain); else if pool is now 0 → phase `run-over`. Beating level 12 → `victory`. Invalid guesses cost nothing (existing engine rule). The `level-won` phase is an explicit state so the UI can show the "+N guesses!" moment before `advanceLevel` starts the next puzzle.

### Category selection per level

`pickLevelCategory(theme, level, index, rng)` — eligible categories are those in the theme's set whose `lengths` include the level's word length; when none qualify, fall back to Original (which spans 3–14, so a category always exists). Applies to all three themes: a fixed category that can't support the length falls back to Original for that level, and returns afterward. Word length for level N = `infinite.startLength + N − 1` (3..14 with `levelCount` 12). All selection takes an injected RNG for deterministic tests; answers keep using `selectAnswer`.

Data loading: the run screen loads the level's category file and dictionary bucket per level via the existing `load.ts` dynamic imports (all precached — offline still works).

### High scores: pure logic + thin storage wrapper

`src/storage/highScores.ts`: `HighScores = { byDifficulty: { easy/medium/hard: { bestLevel } }, totalLevelsBeaten }`. A pure `recordRun(scores, difficulty, levelsBeaten)` (unit-tested) plus `loadHighScores`/`saveHighScores` that JSON-parse/serialize one localStorage key (`wordventure.infinite.highScores`) with corrupt-data fallback to defaults. Components call the wrapper; tests exercise the pure function and the wrapper against an in-memory Storage stub (no jsdom needed).

### Home becomes a mode picker

`App.tsx` screen union grows: `home` (mode picker) → `category-grid` (Normal's old home) → `length-picker` → `game`, plus `infinite-setup` → `infinite-run`. Home shows two large mode cards (Normal, Infinite) — the seam Adventure slots into. Back navigation walks one level toward home, as today.

### Infinite UI

- **Setup screen**: difficulty (3 buttons), theme (fixed / random / custom with category checkboxes), start button, current high scores.
- **Run screen**: header strip with level number, current category name (always visible per DESIGN.md), and the pool as a prominent counter; board + keyboard reuse. Board gains an optional `rows` prop (defaults to `maxGuesses`) — Infinite renders submitted guesses + one input row, growing as the player guesses, with the board area scrollable.
- **Reward moment**: on `level-won`, an overlay shows "+N guesses!" with a continue button dispatching `advanceLevel`.
- **Run over / victory**: overlay with level reached, levels beaten, new-high-score callout; buttons for new run / home. High score is recorded exactly once per run end.

### Balance additions

```json
"infinite": {
  "levelCount": 12,
  "startLength": 3,
  "startingPool": 4,
  "rewards": { "easy": 4, "medium": 3, "hard": 2 }
}
```

All provisional — tune in playtesting. `startLength + levelCount − 1 = 14` keeps the final level within the dictionary/Original range; the engine derives lengths from these values rather than hard-coding 3..14.

## Risks / Trade-offs

- [Pool of 4 at level 1 may be brutally tight (a 3-letter word blind-guessed in ≤4 tries)] → It's the designed tension; values are balance.json entries and Easy's +4 reward compounds quickly. Tune in playtesting.
- [Custom-subset theme with only narrow categories (e.g., just Brawl Stars, max 7) means many fallback-to-Original levels] → Working as designed per DESIGN.md; the always-visible category label keeps it legible. Setup screen can hint at each category's range.
- [Board rows growing unbounded if a player stalls on one level] → Pool bounds total guesses; the board area scrolls. Worst case is pool-sized, not unbounded.
- [localStorage unavailable (private mode)] → Wrapper catches and returns defaults; high scores just don't persist.

## Open Questions

- Whether the reward overlay should auto-advance after a beat instead of requiring a tap — decide by feel in playtesting.
