## Context

The archived `add-word-data-and-guess-engine` change delivered pure engine modules (`src/engine/`) and committed word data (`src/data/categories/`, `src/data/dictionary/`). The app itself is still the untouched Vite scaffold. Project conventions: React is a thin view layer over pure logic, all tunable numbers live in `src/data/balance.json`, persistence is localStorage only, and the app must be fully offline-capable. The PWA plugin and GitHub Pages `base` path are already configured in `vite.config.ts`.

## Goals / Non-Goals

**Goals:**

- First playable: home category grid → length picker → Normal game, styled for phones first (it's a PWA).
- Reusable play UI: the board, tile, and keyboard components take props from a round state so Infinite/Adventure can reuse them later.
- `balance.json` established with `normal.guessCount: 6`.
- Live deployment on GitHub Pages with tests gating the publish.

**Non-Goals:**

- No Infinite or Adventure mode, no coins/lives/shop, no stats or streaks (Normal mode per DESIGN.md has no tracked high score).
- No persistence in this change — a Normal round is disposable; abandoning it is fine.
- No router library and no URL-based deep links; screens are React state.

## Decisions

### Screen navigation: React state, no router

Three screens (`home`, `length-picker`, `game`) held in `App.tsx` state as a discriminated union (e.g., `{ screen: 'game', categoryId, length }`). A router adds a dependency and URL semantics nothing needs; GH Pages + hash-route quirks are avoided entirely. Later modes add union members, and a mode picker can be added to the home screen then (seam: home renders Normal's category grid as its main content today).

### Round logic: pure reducer in `src/engine/round.ts`

A `RoundState` (answer, submitted guesses with feedback, current input, status: `playing | won | lost`) advanced by pure functions: `startRound(answer, maxGuesses)`, `addLetter`, `removeLetter`, `submitGuess(state, dictionary, categoryWords)`. `submitGuess` composes the existing `validateGuess` + `scoreGuess` and returns the new state plus a rejection reason for invalid guesses (UI shakes, nothing consumed). Fully unit-tested; components never compute game logic. `maxGuesses` is a parameter — Normal passes the balance value, future modes pass theirs.

### Balance file: JSON + typed accessor

`src/data/balance.json` starts as `{ "normal": { "guessCount": 6 } }`. A tiny `src/data/balance.ts` imports it and exports a typed `balance` object, giving compile-time safety on names while keeping the JSON as the single tunable source. All values provisional — tune in playtesting.

### Data loading: static metadata index + dynamic word chunks

The generator additionally emits `src/data/categories/index.json` — `[{ id, displayName, minLetters, maxLetters }]` — statically imported for the home grid and length picker (tiny, no word lists). Full category files and the needed dictionary bucket load via dynamic `import()` when a game starts; Vite code-splits them into chunks the service worker precaches, so offline play still works after first visit. Engine functions keep receiving plain word arrays.

### Styling: hand-written CSS, mobile-first

Plain CSS with custom properties (tile/keyboard colors, spacing), flexbox/grid layout, `dvh`-based sizing so board + keyboard fit a phone viewport without scrolling. Tile flip/shake via CSS animations (`prefers-reduced-motion` respected). No UI framework — keeps the bundle small and the father-son project hackable.

### On-screen + physical keyboard

One input dispatch path: both the on-screen keys and a `keydown` listener feed the same `addLetter`/`removeLetter`/`submit` actions. Keyboard keys colored from the engine's `keyboardState`.

### PWA icons

Generate simple 192/512 PNG icons (letter-tile "W" motif) into `public/` to satisfy the manifest already declared in `vite.config.ts`. Any icon-drawing happens at authoring time (script or one-off), committed like the word data.

### Deploy: GitHub Actions → GitHub Pages

`.github/workflows/deploy.yml` on push to `main`: `npm ci` → `npm test` → `npm run build` → `actions/upload-pages-artifact` + `actions/deploy-pages` (the official Pages flow; no gh-pages branch to manage). Tests failing block the publish.

## Risks / Trade-offs

- [Vite `base` is hard-coded `/wordventure/` but the GitHub repo name may differ] → Task includes verifying/aligning repo name and base (or deriving base from an env var in CI). Mismatch = blank page with 404 assets.
- [No URL routing means refresh always lands on home] → Acceptable for a game PWA; Normal rounds are disposable by design. Adventure's save/resume (later change) covers the case that matters.
- [Dynamic-import word chunks might be requested before the service worker has precached them on a flaky first visit] → They're regular precache entries after install; first visit needs network anyway. Documented behavior: offline works after first successful load.
- [Hand-rolled CSS animations can get fiddly across browsers] → Keep animations simple (transform-based shake/flip); they're cosmetic, with game correctness in the tested engine.

## Open Questions

- Final GitHub repo name (affects `base`) — confirm at deploy time; workflow can inject `--base=/$REPO_NAME/` to make it automatic.
- Icon artwork is placeholder-quality for now; real art is a fun father-son task later.
