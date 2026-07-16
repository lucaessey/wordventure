## Why

Adventure keeps exactly one saved run: starting a new run silently overwrites whatever was in progress. Players who want to keep a serious Hard/Super Hard campaign going while also dabbling on Easy have to choose. Two save slots let a player keep two independent runs and continue either one.

While here, this also fixes a latent bug: the save validator only accepts `easy/normal/hard`, so Extra Hard and Super Hard runs currently fail shape validation on load and can never be resumed. The slot feature is useless for those difficulties until that is fixed.

## What Changes

- Adventure supports **two independent save slots**. Each slot holds a full run snapshot, keyed to its own localStorage key. Slot 1 keeps the existing key (`wordventure.adventure.run`) so any in-progress run migrates automatically; slot 2 uses a new key.
- The Adventure setup screen shows **both slots**. An occupied slot shows a Continue summary (difficulty · level · lives · coins) with a **Continue** button and a **New run (overwrites)** button; an empty slot shows a **Start new run** button. The difficulty/category pickers configure whichever new run is started.
- A run is bound to its slot for its lifetime: every-guess snapshots and the run-over/victory clear both target that slot. Retrying after a run ends reuses the same slot.
- **Bug fix (folded in):** the save validator's accepted difficulties are derived from a single engine-exported list (`ADVENTURE_DIFFICULTIES`) instead of a hand-maintained array, so all five difficulties (including Extra Hard and Super Hard) round-trip correctly and the list can never drift from the type again.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `adventure-core`: the "Save and resume" requirement changes from one save to two independent slots — snapshots, Continue, overwrite, and clear are all per-slot; the setup screen offers Continue for each occupied slot. The accepted-difficulty validation is specified to cover every Adventure difficulty.

## Impact

- Modified code:
  - `src/engine/adventure.ts` — export an `ADVENTURE_DIFFICULTIES` tuple and derive `AdventureDifficulty` from it (no change to the type's members).
  - `src/storage/adventureSave.ts` — `saveRun`/`loadRun`/`clearRun` gain a `slot` parameter; add `SAVE_SLOTS` (count) and slot keys; validate difficulty against `ADVENTURE_DIFFICULTIES`. Legacy key stays slot 1 for back-compat.
  - `src/App.tsx` — the `adventure-run` screen state carries its `slot`; new/continue/retry thread the slot through.
  - `src/screens/AdventureSetupScreen.tsx` — render two slot cards with per-slot Continue / Start-new / overwrite actions; `onStart`/`onContinue` gain a slot argument.
  - `src/screens/AdventureRunScreen.tsx` — take a `slot` prop; save/clear to that slot.
  - `src/index.css` — styling for the slot cards.
- Modified tests: `src/storage/adventureSave.test.ts` (slot signature + two-slot isolation + a resume test for Extra Hard/Super Hard proving the validator fix).
- No changes to gameplay, the engine's run logic, the economy, achievements, or other modes.

## Open Questions (reasonable defaults chosen)

1. **Overwriting an occupied slot**: the "New run (overwrites)" button starts immediately, matching today's single-slot behavior (which overwrote without a modal). No confirmation dialog is added.
2. **Slot count**: fixed at two, from a `SAVE_SLOTS` constant, so a future change could raise it with minimal work.
