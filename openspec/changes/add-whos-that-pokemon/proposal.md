## Why

"Who's That Pokemon?" is a beloved hook and a natural fit for a Wordle-derived game: it turns a single puzzle into a hybrid image + word challenge that's instantly recognizable to the kid/teen audience. It reuses the entire core guess engine, so the new surface area is a manifest, a mode screen, and a home-screen entry — most of the work is presentation and a data-driven asset seam for images that arrive separately.

## What Changes

- Add a fourth game mode, **Who's That Pokemon?**, as its own box on the home screen (separate from the category grid). Single round per play — no run, streak, or campaign structure.
- The round shows a **silhouette** of a Pokemon; the player types its name across a Wordle board: 6 guesses, on-screen keyboard, full green/yellow/gray letter feedback. The image is a clue alongside the letter feedback (a hybrid).
- Word length equals the answer Pokemon's name length. Valid guesses follow the standard union rule: valid if in the Pokemon name list OR the English dictionary.
- On a correct guess (or after the 6th guess), the silhouette **reveals** to the full-color image with the Pokemon's name shown.
- **Data-driven assets**: the mode reads a manifest `src/data/whos-that-pokemon.json` of `{ name, silhouetteImage, revealImage }` entries and works with whatever entries exist — no hardcoded count (Gen 1 = 151 to start, expandable). Images live in `public/pokemon/`.
- The assets folder ships **empty except for a README** documenting the filename convention and image format (transparent PNG, square, consistent size) and the preferred single-image silhouette approach (CSS `filter: brightness(0)`). A few **placeholder manifest entries** exist so the mode is testable before real art.
- Add a balance value `whosThatPokemon.guessCount` (6) — no magic numbers.

## Capabilities

### New Capabilities

- `whos-that-pokemon`: The mode — manifest-driven silhouette round, reuse of the 6-guess engine, image reveal on win/exhaust, single-round-per-play, and the empty-assets-with-README seam.

### Modified Capabilities

- `app-shell`: the home mode picker gains a fourth "Who's That Pokemon?" entry; screen navigation extends to the new mode screen.

## Impact

- New code: `src/data/whos-that-pokemon.json` (manifest, placeholder entries), `public/pokemon/README.md` (+ empty assets folder), `src/screens/WhosThatPokemonScreen.tsx`, a small silhouette/reveal image component, `balance.json`/`balance.ts` (`whosThatPokemon.guessCount`), and `App.tsx` wiring.
- Reused unchanged: the guess engine (`validateGuess`, `scoreGuess`, `keyboardState`), the round reducer (`round.ts`), data loading (`load.ts` for the Pokemon word bucket + dictionary), and the `Board`/`Keyboard` components.
- No changes to Normal, Infinite, or Adventure behavior; no changes to `word-data`, `guess-engine`, or the economy.
- **Out of scope / flagged**: sourcing, licensing, and creation of the actual Pokemon images. This change builds the data-driven seam and ships placeholders only; real art is added separately by dropping files into `public/pokemon/` and extending the manifest — no code change required.
