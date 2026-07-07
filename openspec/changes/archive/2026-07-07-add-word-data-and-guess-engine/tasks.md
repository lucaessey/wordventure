## 1. Normalization and shared types

- [x] 1.1 Create `src/engine/normalize.ts`: shared normalization function (strip spaces/hyphens/apostrophes, remove accents via NFD, uppercase; report non-A–Z results as invalid) with unit tests covering "Mr. Mime" → "MRMIME", "Poké Ball" → "POKEBALL", "sea-horse" → "SEAHORSE", and digit exclusion ("Porygon2")
- [x] 1.2 Create `src/engine/types.ts`: `Category`, `LetterState` (`green | yellow | gray | unknown`), guess feedback and validation result types

## 2. Word data pipeline

- [x] 2.1 Create `scripts/wordlists/` with raw source lists: public-domain English dictionary source, plus curated lists for Pokemon, Minecraft, Brawl Stars, Animals, Countries (one entry per line)
- [x] 2.2 Create `scripts/generate-words.ts`: reads raw lists, applies the shared normalization, drops entries outside A–Z, buckets by length, drops buckets under the minimum-word-count threshold (config value, tune in playtesting), computes `minLetters`/`maxLetters`, writes JSON deterministically (sorted, deduplicated)
- [x] 2.3 Add `generate:words` npm script (via `tsx` or `vite-node`) and run it to emit `src/data/dictionary/3.json` … `14.json` and the six files in `src/data/categories/` (Original, Pokemon, Minecraft, Brawl Stars, Animals, Countries)
- [x] 2.4 Add a data validation test: every category file matches the schema (bucket lengths correct, keys within range, non-empty, all words uppercase A–Z), all six launch categories present, dictionary has a non-empty bucket for every length 3–14

## 3. Guess engine

- [x] 3.1 Implement `src/engine/feedback.ts`: two-pass Wordle scoring (greens first, then yellows limited by remaining letter counts) with tests for exact match, absent letters, duplicate-guess-letter cases, and green-consumes-before-yellow
- [x] 3.2 Implement `src/engine/validateGuess.ts`: normalize, check length, check union of dictionary bucket and category bucket; return discriminated result (`ok` / `wrong-length` / `not-in-word-list`) with tests for dictionary-only words, category-only words, unknown words, and wrong length
- [x] 3.3 Implement `src/engine/keyboardState.ts`: fold scored guesses into best-known state per letter with precedence green > yellow > gray > unknown; tests for upgrade (yellow→green) and no-downgrade (yellow stays despite later gray)
- [x] 3.4 Implement `src/engine/selectAnswer.ts`: uniform random pick from a category's length bucket with injectable RNG; tests for bucket membership and determinism under a seeded RNG

## 4. Verification

- [x] 4.1 Confirm engine purity: no imports from React, DOM APIs, or localStorage anywhere under `src/engine/` (add a simple lint/grep check or test)
- [x] 4.2 Run `npm test` (all Vitest suites green) and `npm run build` (type-checks and bundles cleanly)
