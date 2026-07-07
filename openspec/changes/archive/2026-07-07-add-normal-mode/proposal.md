## Why

The engine and word data exist but there is nothing to play. Normal mode is the first playable slice: it delivers the app shell (home screen, navigation), the shared play UI (board, keyboard, feedback) that Infinite and Adventure will reuse, and the GitHub Pages deploy so the game is on a real URL from day one.

## What Changes

- Replace the Vite scaffold UI with the Wordventure app shell: home screen showing all categories as boxes in a scrollable grid, plus screen navigation (home → length picker → game).
- Implement Normal mode: pick a category, pick a word length within that category's range, then play a fixed-guess Wordle round against a random answer from the category. No daily word; unlimited replays.
- Introduce `src/data/balance.json` (project convention: all tunable numbers live there) with its first value: the Normal mode guess count (6).
- Add a pure round state module in `src/engine/` (typed letters, submit → validate + score, win/lose) so React stays a thin view layer.
- Surface engine rules in the UI: green/yellow/gray tiles, keyboard showing best-known letter states, invalid guesses rejected with a "not in word list" shake at no cost.
- Add PWA icons and verify full offline play after first visit.
- Add GitHub Pages deployment via GitHub Actions: on push to main, run tests + typecheck + build, then publish.

## Capabilities

### New Capabilities

- `app-shell`: Home screen category grid, navigation between screens, and offline-capable installable PWA shell.
- `normal-mode`: Category/length selection and the fixed-guess play loop — board, keyboard, feedback, invalid-guess handling, win/lose, replay.
- `balance-config`: Single `src/data/balance.json` for all tunable numbers; code and specs reference named values, no magic numbers.
- `deploy`: GitHub Actions workflow that tests, builds, and publishes the app to GitHub Pages on push to main.

### Modified Capabilities

None — `word-data` and `guess-engine` are consumed as-is.

## Impact

- New code: React components under `src/components/` (or `src/ui/`), screen state in `App.tsx`, `src/engine/round.ts` (+ tests), `src/data/balance.json`, data-loading helpers, PWA icon assets, `.github/workflows/deploy.yml`.
- Modified code: `scripts/generate-words.ts` gains a lightweight `categories/index.json` (id, displayName, letter range) so the home grid doesn't load full word lists; scaffold `App.tsx`/CSS replaced.
- Dependencies: none new at runtime; no router library (screen switching via React state).
- Deploy: repo must be published to GitHub with Pages enabled; the Vite `base` path must match the repo name.
