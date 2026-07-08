## 1. Balance and manifest

- [x] 1.1 Add `whosThatPokemon: { guessCount: 6 }` to `src/data/balance.json`, extend the `Balance` type, and cover it in the balance test
- [x] 1.2 Create `src/data/whos-that-pokemon.json`: a manifest array of `{ name, silhouetteImage, revealImage }` with 2–3 placeholder entries using real Gen 1 names (e.g. Pikachu, Bulbasaur, Charmander) pointing at placeholder image paths under `pokemon/`
- [x] 1.3 Add a typed loader/types in `src/data/` (e.g. `whosThatPokemon.ts`): static import of the manifest, an `entries` export, and a graceful empty check; the entry count is derived from the array, never hardcoded

## 2. Assets seam

- [x] 2.1 Create `public/pokemon/README.md` documenting the filename convention, image format (transparent-background PNG, square, consistent size e.g. 256×256), the manifest mapping, and the two rendering options (single image + CSS `brightness(0)` silhouette [preferred]; or separate silhouette/reveal files) — note transparent background is required for the CSS approach
- [x] 2.2 Commit 2–3 simple stand-in placeholder images (clearly non-Pokemon, e.g. a question-mark/blob shape on transparent PNG) under `public/pokemon/` matching the placeholder manifest entries, so the mode is testable before real art (do NOT create real Pokemon images)

## 3. Mode UI

- [x] 3.1 Create a silhouette/reveal image component: renders the entry's image with `filter: brightness(0)` while hidden and no filter on reveal; falls back to `revealImage` when it differs from `silhouetteImage`
- [x] 3.2 Create `src/screens/WhosThatPokemonScreen.tsx`: pick a random manifest entry, normalize its name to the answer, load the Pokemon category bucket + dictionary bucket for that length (reuse `load.ts`), run a round via `round.ts` at `whosThatPokemon.guessCount`, reuse `Board`/`Keyboard`, show the silhouette during play and the reveal + name on win/exhaust, and offer play-again / home; graceful empty state when the manifest has no entries
- [x] 3.3 Add the "Who's That Pokemon?" card to the home mode picker and wire the new screen into `App.tsx` (screen union + back-to-home)
- [x] 3.4 Style the silhouette/reveal panel and the mode screen consistent with the existing CSS variables and mobile-first layout

## 4. Verification

- [x] 4.1 `npm test` green and `npm run build` clean
- [x] 4.2 Manual preview pass: the mode appears on home; a round shows a (placeholder) silhouette with a correctly sized board; a valid Pokemon-name guess and a dictionary-word guess are both accepted and scored; an unknown word is rejected at no cost; winning and running out both reveal the full image + name; play-again starts a fresh entry; back returns home
- [x] 4.3 Push to GitHub and verify the deployed app (placeholder art expected until real images are supplied)
