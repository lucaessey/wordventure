## Context

Wordventure is a fresh Vite + React + TypeScript PWA (see [DESIGN.md](../../../DESIGN.md)). Nothing game-related exists yet. This change lays the foundation every mode builds on: the word data (six launch categories plus a shared English guess dictionary) and the pure guess engine. Project conventions require all game logic to live in pure TypeScript modules with Vitest tests, word data to be static committed JSON (fully offline), and words to be normalized to uppercase A–Z.

## Goals / Non-Goals

**Goals:**

- A category JSON schema and six committed launch category files: Original, Pokemon, Minecraft, Brawl Stars, Animals, Countries.
- A shared English guess dictionary bucketed by length (3–14), from a public-domain word list.
- An authoring-time generation script that normalizes raw word lists into the committed JSON.
- Pure, fully unit-tested engine functions: feedback coloring, guess validation, keyboard state, answer selection.

**Non-Goals:**

- No UI, no React components, no modes, no persistence, no deploy pipeline (those come in `add-normal-mode` and later changes).
- No `balance.json` values yet — guess counts, pool sizes, and economy numbers belong to the mode changes. Engine functions take word length, guess limits, etc. as parameters so modes can pass balance values in.

## Decisions

### Module layout

- `src/engine/` — pure game logic (`feedback.ts`, `validateGuess.ts`, `keyboardState.ts`, `selectAnswer.ts`, plus shared types), each with a sibling `*.test.ts`. No imports from React or the DOM.
- `src/data/categories/*.json` — one file per category, matching the schema in DESIGN.md.
- `src/data/dictionary/` — the English guess dictionary as one JSON file per length (`3.json` … `14.json`). Per-length files keep each import small and let Vite chunk them; a single 3–14 file would be several MB parsed up front. Alternative considered: one big `{ "3": [...], ... }` object — simpler but worse load behavior for no benefit.
- `scripts/generate-words.ts` — authoring-time script (run with `npm run generate:words` via `tsx` or `vite-node`) that reads raw source lists from `scripts/wordlists/`, applies normalization, and writes the committed JSON. Raw sources are committed too, so the pipeline is reproducible.

### Normalization (single shared function, used by the generator AND at guess-input time)

- Unicode-decompose (NFD) and strip combining marks to remove accents; strip spaces, hyphens, apostrophes; uppercase.
- If the result contains anything outside A–Z (digits, symbols), the entry is excluded (generator) or the guess is invalid (runtime).
- One function used in both places guarantees a typed guess like "Mr. Mime" and the stored answer "MRMIME" normalize identically.

### Feedback algorithm

Standard two-pass Wordle algorithm: first pass marks greens and counts remaining letter occurrences in the answer; second pass marks yellows only while the remaining count for that letter is positive, otherwise gray. This gives the standard duplicate-letter behavior for free and is easy to exhaustively unit-test.

### Keyboard state

Derived (not stored): fold over all scored guesses, keeping the best state per letter with precedence `green > yellow > gray > unknown`. A letter never downgrades (e.g., a yellow later scored gray in another slot stays yellow unless it turns green).

### Validation and answer selection

- `validateGuess(guess, length, dictionary, categoryWords)` — valid iff normalized, correct length, and present in the union of the English dictionary bucket and the category's list for that length. Returns a discriminated result (`ok` | reason) so the UI can show "not in word list" vs "too short" later.
- `selectAnswer(category, length, rng)` — uniform random pick from the category's bucket. The RNG is injected (default `Math.random`) so tests are deterministic.

### Word sources

- English dictionary: a public-domain list (e.g., ENABLE / SCOWL public-domain subset), filtered to 3–14 letters.
- Category lists (Pokemon, Minecraft, Brawl Stars, Animals, Countries): authored/curated raw text lists committed under `scripts/wordlists/`, one entry per line. Original draws from the English dictionary's common-word subset. Each category's `minLetters`/`maxLetters` is computed by the generator from what the list actually supports (a length bucket must have a reasonable minimum count of answers to be included — threshold lives in the generator config).

## Risks / Trade-offs

- [Category lists too thin at some lengths] → Generator drops length buckets below a minimum word count and computes `minLetters`/`maxLetters` from surviving buckets, so a sparse bucket can never yield a one-word "random" answer pool.
- [Trademarked names (Pokemon, Minecraft, Brawl Stars) as word lists] → Fine for a personal father-son project; not publishing to app stores. Noted, accepted.
- [Public-domain dictionary may contain obscure/offensive words] → Answers never come from the dictionary (only from category lists), so this only affects what's accepted as a guess — same trade-off real Wordle makes.
- [Per-length dictionary files mean async loading later] → Engine functions stay synchronous and take word arrays as inputs; data loading strategy is the caller's concern and can change without touching the engine.

## Open Questions

- Exact public-domain source list to use for the English dictionary — pick during implementation; requirement is only that it's public-domain and covers 3–14 letters.
- Minimum words-per-bucket threshold for category length ranges — provisional value in generator config, tune in playtesting.
