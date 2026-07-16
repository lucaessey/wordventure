## Context

Adventure persists one run to a single localStorage key (`wordventure.adventure.run`). `AdventureRunScreen` calls `saveRun(run)` after every state change and `clearRun()` on run-over/victory; `AdventureSetupScreen` calls `loadRun()` and renders one Continue card; `App` orchestrates start/continue/retry. The storage layer validates a loaded save's shape and discards anything unrecognized — but its difficulty allow-list is a hand-maintained `['easy','normal','hard']`, so Extra Hard and Super Hard saves are wrongly rejected. The slot is purely a persistence/UI concern; the pure engine has no notion of it.

## Goals / Non-Goals

**Goals:**

- Two independent save slots; continue either; start/overwrite either.
- Back-compat: an existing single save appears as slot 1.
- Slot is bound to a run for its lifetime (snapshots + clear + retry).
- Keep the engine pure — no slot concept leaks into run state.
- Fix the difficulty-validation drift so all five difficulties resume.

**Non-Goals:**

- No change to gameplay, economy, achievements, or other modes.
- No naming/renaming of slots, no more than two slots (but count is a constant).
- No confirmation modal for overwrite (matches today's behavior).

## Decisions

### Slot lives in the view layer, not the engine

`AdventureRunState` stays slot-free. The slot (0 or 1) is threaded through the view: `App`'s `adventure-run` screen state gains `slot: number`; `AdventureRunScreen` takes a `slot` prop and passes it to `saveRun`/`clearRun`; `AdventureSetupScreen`'s `onStart`/`onContinue` gain a slot argument. This keeps persistence out of the pure model and avoids touching the run-state validator/shape for a non-gameplay field.

### Storage layer becomes slot-aware

`adventureSave.ts`:
- `const SLOT_KEYS = ['wordventure.adventure.run', 'wordventure.adventure.run.2'] as const` — index 0 is the legacy key, so an existing save is slot 1 with no migration code. `export const SAVE_SLOTS = SLOT_KEYS.length`.
- Signatures become `saveRun(run, slot = 0, storage = default)`, `loadRun(slot = 0, storage = default)`, `clearRun(slot = 0, storage = default)`. Slot is the primary new axis; `storage` stays injectable for tests (its position moves, so the existing test call sites are updated to pass the slot explicitly).
- An out-of-range slot is treated as a no-op / null (defensive), so a stale caller can't write to an undefined key.

### Fix difficulty validation at its source

`adventure.ts` exports `export const ADVENTURE_DIFFICULTIES = ['easy','normal','hard','extraHard','superHard'] as const` and derives `export type AdventureDifficulty = (typeof ADVENTURE_DIFFICULTIES)[number]` (identical members to today). `adventureSave.ts` imports the tuple and validates `run.difficulty` against it, replacing the local `['easy','normal','hard']`. Now the type and the runtime validator share one source and cannot drift — this is what silently broke Extra Hard/Super Hard resume.

### Setup screen: per-slot actions

Render two slot cards from `[loadRun(0), loadRun(1)]` (read once into state so the list is stable during setup):
- **Occupied**: title "Slot N", a summary line (`{difficultyLabel} · Level L/total · ♥lives · $coins`), a primary **Continue** (`onContinue(save, slot)`) and a secondary **New run (overwrites)** (`onStart(difficulty, buildTheme(), slot)`).
- **Empty**: title "Slot N", "Empty", a primary **Start new run** (`onStart(difficulty, buildTheme(), slot)`).

The difficulty and category pickers stay and define the config for any new run; `startDisabled` (custom theme with no categories chosen) disables the start/overwrite buttons. The single global Start button is removed — each slot owns its start action, which removes any ambiguity about where a new run goes.

### App wiring

`onStart(difficulty, theme, slot)` builds the run and sets `{ name: 'adventure-run', run, slot }`; `onContinue(run, slot)` sets the same with the loaded run. `AdventureRunScreen`'s `onNewRun` (retry after a run ends) restarts into `screen.slot`. `runNonce` keying is unchanged.

### Overwrite timing

Starting/overwriting a slot mounts a fresh run whose first save effect (phase `loading`) immediately writes that slot, replacing the previous occupant. No explicit pre-clear needed.

## Risks / Trade-offs

- [Signature change breaks existing save-test call sites] → All `saveRun/loadRun/clearRun` call sites in tests are updated to pass the slot; a compile error surfaces any miss.
- [Legacy save silently lost] → Avoided by keeping the legacy key as slot 0; a resume test asserts a run written at the legacy key loads as slot 1.
- [Validator still drifting] → Removed the hand-maintained list entirely; a test writes an Extra Hard and a Super Hard save and asserts both resume.
- [Two start buttons confuse first-time users] → Each card is labeled with its slot and state (Empty / summary); the action verb differs (Start new run vs Continue vs overwrite).

## Open Questions

Resolved with defaults: overwrite is immediate (no modal, matching today); slot count fixed at two via `SAVE_SLOTS`.
