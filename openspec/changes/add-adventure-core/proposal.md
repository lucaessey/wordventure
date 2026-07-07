## Why

Adventure is the flagship roguelite mode: save your Wordle company from bankruptcy at the hands of a rival word-search magazine. This change builds its skeleton — the 25-level campaign, lives-as-guesses, coin earning, boss levels, and after-every-guess save/resume — so the follow-up `add-adventure-shop` change can layer the economy's spending side (lives, skips, hints, insurance, permanent upgrades) onto a working run loop.

## What Changes

- Add Adventure mode: a 25-level campaign with boss levels at 5/10/15/20/25 using word lengths 10–14; level 25 is the final showdown. Non-boss word lengths follow a provisional upward ramp in balance.json (tune in playtesting).
- Lives ARE guesses: runs start with 4 lives; every valid guess subtracts one. Reaching 0 with the level unsolved ends the run — full restart from level 1, no checkpoints.
- Coins: earn +$10 per level beaten and +$50 per boss beaten (balance values). No spending yet — that is `add-adventure-shop`; a core-only run is intentionally brutal until then.
- Category options: all categories mixed, one fixed category, or a custom subset — the same theme machinery as Infinite, extracted into a shared engine module.
- Save/resume: the full run state (level, lives, coins, current puzzle and guesses, settings) snapshots to localStorage after every guess; the Adventure setup screen offers Continue when a save exists; death or victory clears it.
- Boss presentation: boss levels are visibly marked and open with an intro overlay carrying a placeholder taunt line — the seam for the story dressing (open item, not designed yet).
- Home screen gains the Adventure mode card.

## Capabilities

### New Capabilities

- `adventure-core`: Campaign structure and length ramp, lives-as-guesses, coin earning, boss levels with story seam, category options, run over/victory, and after-every-guess save/resume.

### Modified Capabilities

- `app-shell`: The home mode picker gains Adventure; screen navigation extends to the Adventure setup and run screens.

## Impact

- New code: `src/engine/adventure.ts` (+ tests), `src/engine/categoryTheme.ts` (theme/eligibility logic extracted from `infinite.ts`, shared by both modes), `src/storage/adventureSave.ts` (+ tests), Adventure setup and run screens.
- Modified code: `infinite.ts` delegates to the shared theme module (no behavior change); `App.tsx` screen union and home screen; `balance.json`/`balance.ts` gain the `adventure` block.
- No new dependencies. Normal and Infinite behavior unchanged (Infinite's refactor is internal).
- Deliberately deferred to `add-adventure-shop`: all purchases (+1 life, hints, skips, insurance, permanent upgrades) and the between-levels shop screen.
