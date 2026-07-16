## Why

Two Infinite-mode improvements requested together:

1. Easy should feel more forgiving from the start. Today every difficulty begins with the same pool of 4 banked guesses; Easy should begin with 6.
2. Infinite has no save/resume at all — closing the app loses the run. Adventure just gained two save slots; Infinite should get the same, so players can keep two Infinite runs going and continue either.

## What Changes

- **Per-difficulty starting pool.** The Infinite banked-guess pool starts from a per-difficulty balance value instead of one shared number. Easy starts at 6; Medium and Hard stay at 4 (`infinite.startingPool.easy/medium/hard` = 6/4/4). Fully tunable.
- **Two Infinite save slots.** The full Infinite run state snapshots to a per-slot localStorage key after every guess. The Infinite setup screen shows both slots — an occupied slot offers Continue (difficulty · level · pool) plus New run (overwrites); an empty slot offers Start new run. A run stays bound to its slot for snapshots, clear-on-end, and retry. This mirrors Adventure's save-slot design and reuses its slot-card styling.
- The accepted-difficulty validation for the new Infinite save is derived from a single engine-exported `INFINITE_DIFFICULTIES` tuple (the same source the `Difficulty` type is built from), so a save's difficulty can never be wrongly rejected.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `infinite-mode`: the "Banked guess pool" requirement changes the starting pool from one shared value to a per-difficulty value (Easy 6). A new "Save and resume" requirement adds two independent save slots with per-slot Continue/overwrite/clear on the setup screen.

## Impact

- Modified data: `src/data/balance.json` — `infinite.startingPool` becomes `{ easy: 6, medium: 4, hard: 4 }`.
- Modified code:
  - `src/engine/infinite.ts` — `InfiniteConfig.startingPool` becomes `Record<Difficulty, number>`; `startRun` seeds `config.startingPool[difficulty]`; export `INFINITE_DIFFICULTIES` and derive `Difficulty` from it.
  - `src/data/balance.ts` — type for the per-difficulty pool.
  - `src/storage/infiniteSave.ts` (new) — slot-aware `saveRun`/`loadRun`/`clearRun` + `SAVE_SLOTS`, validating an `InfiniteRunState` and its difficulty against `INFINITE_DIFFICULTIES`.
  - `src/App.tsx` — the `infinite-run` screen state carries `run` + `slot`; start/continue/retry thread the slot.
  - `src/screens/InfiniteSetupScreen.tsx` — two slot cards (reusing the `.slot-card` styles); `onStart`/`onContinue` gain a slot; difficulty blurb shows the starting pool.
  - `src/screens/InfiniteRunScreen.tsx` — take `initialRun` + `slot`; save/clear to the slot; restore a mid-level run; the run-end "New run" calls back to the parent for the same-slot retry.
- Modified tests: `src/data/balance.test.ts`, `src/engine/infinite.test.ts` (per-difficulty pool fixture); new `src/storage/infiniteSave.test.ts` (slot isolation + resume).
- No changes to the pool economy, level progression, high scores, achievements, or other modes.

## Open Questions (reasonable defaults chosen)

1. **"6 lives" = starting pool 6.** Infinite's health is the banked-guess pool; Easy's starting pool becomes 6. Medium/Hard are unspecified and kept at their current 4.
2. **Overwrite is immediate** (no modal) and slot count is two, matching Adventure's just-shipped behavior.
