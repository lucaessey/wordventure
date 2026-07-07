## Why

Normal mode is live; Infinite is the second mode from DESIGN.md — a 12-level run with a banked guess pool that turns the same core puzzle into a survival challenge with difficulty tiers, category themes, and high scores. It also forces the home screen to grow into a real mode picker, which Adventure will need too.

## What Changes

- Add Infinite mode: 12 levels, word length 3 → 14 (one per level), all driven by a pure run engine in `src/engine/`.
- Banked guess pool: start with 4; every scored guess (any level) drains 1; beating a level adds guesses by difficulty (Easy +4, Medium +3, Hard +2) with a "+N guesses!" reward moment; run ends at pool 0. Pool is displayed prominently at all times.
- Run setup: pick difficulty (Easy/Medium/Hard) and theme — one fixed category, random category per level, or a custom subset. Current category always shown at the top during play.
- Category eligibility: at each level only categories supporting that word length are used; fall back to Original when none qualify.
- High scores in localStorage: best level reached per difficulty, plus lifetime total levels beaten. Shown on the setup screen.
- Rework the home screen into a mode picker (Normal / Infinite); Normal's category grid moves one screen deeper, unchanged otherwise.
- New balance values: `infinite.levelCount`, `infinite.startLength`, `infinite.startingPool`, `infinite.rewards.{easy,medium,hard}` (all provisional — tune in playtesting).

## Capabilities

### New Capabilities

- `infinite-mode`: Run setup (difficulty, theme), 12-level progression with growing word length, banked guess pool economy with rewards and run-over, category eligibility/fallback, and persisted high scores.

### Modified Capabilities

- `app-shell`: "Home screen category grid" becomes a mode-selection home (Normal / Infinite) with the category grid on its own screen; "Screen navigation" extends to the new Infinite screens.

## Impact

- New code: `src/engine/infinite.ts` (+ tests), `src/storage/highScores.ts` (+ tests), Infinite setup and run screens, mode-picker home screen.
- Modified code: `App.tsx` screen union grows; `HomeScreen` becomes the mode picker and the category grid becomes its own screen; `Board` gains a row-count override (Infinite has no fixed per-level guess limit — the pool is the limit); `balance.json`/`balance.ts` gain the `infinite` block.
- No new dependencies. `word-data`, `guess-engine`, `normal-mode`, `balance-config`, and `deploy` behavior unchanged.
