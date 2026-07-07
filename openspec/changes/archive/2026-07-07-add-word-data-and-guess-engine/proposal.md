## Why

Wordventure needs its foundation before any mode can be built: the word data (categories + English guess dictionary) and the pure guess engine that every mode shares. Building this first, with no UI, lets us fully unit-test the core rules (feedback coloring, duplicate handling, guess validation) that Normal, Infinite, and Adventure all depend on.

## What Changes

- Define the category data schema: `{ id, displayName, minLetters, maxLetters, wordsByLength }`, stored as static JSON in `src/data/categories/`, committed to the repo (never fetched at runtime).
- Author/generate the six launch category files: Original, Pokemon, Minecraft, Brawl Stars, Animals, Countries — each with its own supported letter range.
- Add a shared English guess dictionary bucketed by word length (3–14 letters), sourced from a public-domain word list.
- Implement word normalization: uppercase A–Z only; strip spaces, hyphens, apostrophes, accents; exclude entries with digits or other characters.
- Implement the pure guess engine as UI-free TypeScript modules with Vitest tests:
  - Classic Wordle feedback (green/yellow/gray) with standard duplicate-letter handling.
  - Guess validation: valid if in the English dictionary OR the active category's list (union); answers always drawn from the category list.
  - Best-known keyboard letter state derivation.
  - Random answer selection from a category at a given length.
- No UI, no React components, no modes in this change.

## Capabilities

### New Capabilities

- `word-data`: Category data schema, launch category files, shared English guess dictionary bucketed by length, and word normalization rules.
- `guess-engine`: Pure-function guess feedback (green/yellow/gray with duplicate handling), guess validation against the dictionary/category union, keyboard letter-state derivation, and random answer selection.

### Modified Capabilities

None — this is the first change; no existing specs.

## Impact

- New code: `src/data/categories/*.json`, `src/data/dictionary/` (or equivalent length-bucketed structure), pure modules under `src/engine/` (or `src/logic/`), Vitest test files alongside.
- New tooling: an authoring-time script to normalize/generate the committed JSON word data.
- Dependencies: no new runtime dependencies; Vitest (already installed) for tests.
- No UI, no persistence, no deploy changes in this change.
