## Context

The app has three modes plus twelve word categories, all built on a shared core: a pure guess engine (`validateGuess`, `scoreGuess`, `keyboardState`), a `round.ts` reducer that runs a fixed-guess Wordle round, data loading (`load.ts`) that dynamically imports category and dictionary buckets, and reusable `Board`/`Keyboard` components. The home screen is a mode picker (Normal / Infinite / Adventure cards). "Who's That Pokemon?" is a fourth mode that reuses all of that and adds an image layer plus a data-driven manifest for art that the user supplies separately.

## Goals / Non-Goals

**Goals:**

- A single-round silhouette-guessing mode reusing the 6-guess engine, board, and keyboard.
- Fully manifest-driven: works with any number of entries; no hardcoded Pokemon.
- A clean, empty asset seam (README + placeholders) so real images drop in later with no code change.
- Silhouette from a single image via CSS, with the manifest still allowing separate silhouette/reveal art.

**Non-Goals:**

- No sourcing, downloading, generating, or bundling of real Pokemon images (explicitly out of scope; licensing handled elsewhere).
- No run/streak/score persistence — a round is disposable, like Normal.
- No changes to the guess engine, word data, or the other modes.

## Decisions

### Reuse the round engine; the mode adds only image + answer selection

The round is a standard fixed-guess Wordle round, so `round.ts` (`startRound`, `addLetter`, `removeLetter`, `submitGuess`) is reused verbatim. The mode screen:

1. Loads the manifest, picks a random entry, and normalizes its `name` → the answer (via the shared `normalizeWord`, so "Mr. Mime" → MRMIME consistently).
2. Loads the validation word sets for the answer's length: the **Pokemon category bucket** (`loadCategory('pokemon')`) plus the **English dictionary bucket** (`loadDictionary(len)`) — the same union rule every category uses. The answer Pokemon is in the Pokemon category (Gen 1 names are present), so it is itself a valid guess.
3. Runs the round with `maxGuesses = balance.whosThatPokemon.guessCount` (6).
4. Renders the silhouette until `status !== 'playing'`, then the full reveal + name.

This keeps React a thin view over the existing pure logic; no new engine code is required. (The mode does not use the `pokemon` category's answer-selection — the answer comes from the manifest so it always has matching art.)

### Manifest schema and loading

`src/data/whos-that-pokemon.json`: an array of `{ name, silhouetteImage, revealImage }`.

- `name`: display name (e.g. "Pikachu"); normalized for the answer/validation.
- `silhouetteImage` / `revealImage`: paths under the app base (e.g. `pokemon/pikachu.png`). Both MAY point at the same file when using the CSS-silhouette approach (see below).

The manifest is a static import (small metadata, like `categories/index.json`) so the mode can pick an entry synchronously. Entry count is read from the array length — never hardcoded. An empty or missing manifest is handled gracefully (the mode shows a "no Pokemon available yet" state rather than crashing), so the mode is safe before art exists.

### Silhouette rendering: one image + CSS, swappable

Preferred approach: a single transparent-background PNG per Pokemon serves as both silhouette and reveal. The image component renders it with `filter: brightness(0)` (optionally a hair of contrast) while hidden, and removes the filter on reveal — a pure CSS transition, no second asset needed. The manifest still carries distinct `silhouetteImage`/`revealImage` fields, so a Pokemon that wants bespoke silhouette art can point them at different files; when they're equal, the CSS path is used. This decision (single-image + CSS vs. two files) is documented in the assets README so future art can pick either. Transparent background is what makes `brightness(0)` read as a clean silhouette — noted as a hard requirement in the README.

### Assets folder: empty + README + placeholders

`public/pokemon/` ships with only a `README.md` (no real images — sourcing is out of scope). The README documents:

- Filename convention (e.g. `pokemon/<lowercase-name>.png`), format (transparent-background PNG, square, consistent size — e.g. 256×256), and how entries map to the manifest.
- The two rendering options (single image + CSS silhouette [preferred]; or separate silhouette/reveal files).

Placeholders: 2–3 manifest entries using real Gen 1 names (so the mode is genuinely testable end-to-end) whose images are simple generated **non-Pokemon** placeholders — a plain shape/question-mark PNG committed under `public/pokemon/` (clearly not Pokemon art, just a stand-in). This lets the silhouette→reveal flow, guessing, and layout be verified before any real image exists; swapping in real art is a file drop.

### Home screen and navigation

`app-shell`: the home mode picker gains a fourth card, "Who's That Pokemon?", selecting which shows the mode screen. `App.tsx`'s screen union grows by one member (`whos-that-pokemon`); back returns to home. No category-grid involvement — it's a standalone mode box, not a category.

### Balance

`balance.json` gains `whosThatPokemon: { guessCount: 6 }` with a typed accessor entry, keeping the no-magic-numbers rule. Reusing `normal.guessCount` was considered but rejected — the modes should tune independently.

## Risks / Trade-offs

- [Placeholder images aren't real Pokemon] → Intended; the mode is testable with stand-ins and real art is a later file drop. The README makes the convention unambiguous.
- [A manifest name not present in the Pokemon category would be un-guessable as itself] → Placeholders use real Gen 1 names that are in the category; the README notes the answer name should exist in the Pokemon word list (it does for all real Pokemon). A validation guard can also add the manifest's own names to the valid-guess set to be safe.
- [Large future manifest (151+) with images] → Images are static files in `public/`, precached by the service worker like other assets; loading is per-round and lazy. No fixed-count assumptions anywhere.
- [Transparent background required for the CSS silhouette] → Documented as a hard requirement; a non-transparent image would silhouette as a black rectangle. The manifest's two-file option is the escape hatch.

## Open Questions

- Final image dimensions/style are an art decision captured in the README as a recommendation (256×256 transparent PNG), not enforced by code.
- Whether to show any hint (e.g. first letter, or a "type" clue) is deferred — not in this change; the silhouette + Wordle feedback is the whole game for now.
