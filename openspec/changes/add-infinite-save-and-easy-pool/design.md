## Context

Infinite mode is a pure engine (`infinite.ts`) plus two screens. Its health is a banked-guess `pool` seeded from `config.startingPool` (a single 4 shared by all difficulties). `InfiniteRunScreen` builds its run internally from difficulty+theme props and handles restart itself; there is no persistence — Infinite has never had save/resume. Adventure just gained two save slots (per-slot keys, setup-screen slot cards, slot threaded through the view, validator sourced from an engine tuple); this change applies the same pattern to Infinite and additionally makes the starting pool per-difficulty.

## Goals / Non-Goals

**Goals:**

- Easy starts with a 6-guess pool; Medium/Hard unchanged (4), all from balance.
- Two independent Infinite save slots; continue either; start/overwrite either.
- Snapshot every guess; clear on run-over/victory; a run is bound to its slot including retry.
- Restore a mid-level run (resume with the same answer/guesses).
- Keep the engine pure; keep pool economy, high scores, and achievements unchanged.

**Non-Goals:**

- No change to rewards, level progression, or the run-end high-score flow.
- No shared/generic slot-storage abstraction (a parallel `infiniteSave.ts` mirrors `adventureSave.ts`; unifying them later is optional).
- No more than two slots (count is a `SAVE_SLOTS` constant).

## Decisions

### Per-difficulty starting pool

`balance.infinite.startingPool` becomes `{ easy: 6, medium: 4, hard: 4 }`; `InfiniteConfig.startingPool` becomes `Record<Difficulty, number>`; `startRun` seeds `pool: config.startingPool[difficulty]`. Only `startRun` reads it, so the blast radius is small. Test fixtures that used the scalar become the record (keeping their values so existing assertions hold).

### Slot lives in the view layer

As with Adventure, the slot (0/1) never enters `InfiniteRunState`. `App`'s `infinite-run` screen state gains `slot: number` and now carries the built `run` (App constructs it, matching how Adventure works) rather than difficulty+theme. `InfiniteRunScreen` takes `initialRun` + `slot` and passes the slot to `saveRun`/`clearRun`. `InfiniteSetupScreen`'s `onStart`/`onContinue` gain a slot argument.

### Storage: a parallel slot-aware module

New `infiniteSave.ts` mirrors `adventureSave.ts`:
- `SLOT_KEYS = ['wordventure.infinite.run', 'wordventure.infinite.run.2']`, `export const SAVE_SLOTS = SLOT_KEYS.length`.
- `saveRun(run, slot = 0, storage = default)`, `loadRun(slot = 0, storage = default)`, `clearRun(slot = 0, storage = default)`; out-of-range slot → no-op/null.
- `isValidRun` checks the `InfiniteRunState` shape (level/pool/levelsBeaten/answer/guesses/phase/difficulty/config) and validates `difficulty` against `INFINITE_DIFFICULTIES`.

`infinite.ts` exports `INFINITE_DIFFICULTIES = ['easy','medium','hard'] as const` and derives `Difficulty` from it, so the validator and the type share one source.

### Refactor InfiniteRunScreen to be driven, not self-constructing

Today the screen calls `freshRun()` and owns a `restart` action. It becomes prop-driven like `AdventureRunScreen`:
- Reducer initializes from `initialRun`.
- The run-end "New run" button calls `onNewRun` (App rebuilds a fresh run into the same slot and remounts via the `runNonce` key). The internal `restart` action is removed.
- A save effect: `run.phase === 'run-over' || 'victory' ? clearRun(slot) : saveRun(run, slot)`.
- The word-loading effect fires for phase `loading` **or** (`playing` && no data yet), so a restored mid-level run loads its category/dictionary. `beginLevel` already returns a `playing` run unchanged (it only rolls a fresh answer from `loading`), so a resumed answer and guesses are preserved.
- `game-started` is emitted only for a genuinely new run (`initialRun.level === 1 && guesses.length === 0 && levelsBeaten === 0`), not on resume — matching Adventure.

### Setup screen: two slot cards

Load `[loadRun(0), loadRun(1)]` into state (stable during setup). Render two cards reusing Adventure's `.slot-card`/`.slot-list` classes: occupied → summary (`{difficulty} · Level L/total · {pool} guesses`) + Continue + New run (overwrites); empty → Start new run. The difficulty/category pickers and the high-scores section stay; the single global Start button is removed. Difficulty blurbs gain the starting pool (e.g. "start 6 · +4 per level") so the Easy change is visible.

## Risks / Trade-offs

- [startingPool shape change breaks fixtures] → `infinite.test.ts` and `balance.test.ts` updated to the record; a compile error surfaces any miss.
- [Restored run doesn't load words] → load effect explicitly covers `playing && !data`; a manual resume test confirms the board/keyboard work after Continue.
- [game-started double-counts on resume] → guarded to only-new-run, as in Adventure.
- [Duplication with adventureSave] → accepted; the two validators genuinely differ. A future shared helper is possible but out of scope.

## Open Questions

Resolved with defaults: Easy pool = 6 (Medium/Hard stay 4); overwrite is immediate; two slots via `SAVE_SLOTS`.
