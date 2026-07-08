# Who's That Pokemon? — image assets

This folder holds the images for the **Who's That Pokemon?** mode. The mode is
fully data-driven: it reads the manifest at `src/data/whos-that-pokemon.json`
and works with whatever entries exist — there is no hardcoded count. Add art by
dropping files here and adding manifest entries; **no code change is required.**

> Image sourcing and licensing are handled outside the game code. The files
> currently in this folder are simple **placeholder** stand-ins (colored blobs,
> not Pokemon) so the mode is testable before real art is added. Replace them
> with real images at the same paths.

## Manifest entry shape

Each entry in `src/data/whos-that-pokemon.json`:

```json
{ "name": "Pikachu", "silhouetteImage": "pokemon/pikachu.png", "revealImage": "pokemon/pikachu.png" }
```

- `name` — display name; normalized (uppercase A–Z) for the answer and guess validation.
- `silhouetteImage` / `revealImage` — paths **relative to the app base**, e.g. `pokemon/pikachu.png`.

## Filename convention

`pokemon/<lowercase-name>.png` — e.g. `pokemon/pikachu.png`, `pokemon/bulbasaur.png`.

## Image format

- **Transparent-background PNG** (required — see below).
- **Square**, consistent size across all entries. Recommended **256×256**.
- The subject fills the frame with transparent margins; no baked-in background.

## Rendering options

**1. Single image + CSS silhouette (preferred).** Point both `silhouetteImage`
and `revealImage` at the *same* transparent PNG. The mode renders the silhouette
by applying `filter: brightness(0)` to that image while hidden, then removes the
filter on reveal. One file per Pokemon serves as both silhouette and reveal.

> The transparent background is what makes `brightness(0)` read as a clean
> silhouette. A non-transparent image would silhouette as a solid black square.

**2. Separate silhouette / reveal files.** For a Pokemon that wants bespoke
silhouette art, point `silhouetteImage` and `revealImage` at *different* files;
the mode shows `silhouetteImage` during play and `revealImage` on reveal, with
no CSS filter.

## Regenerating the placeholders

`npm run generate:placeholder-pokemon` rewrites the placeholder blobs. Delete
this step (and the placeholder entries) once real art and a real manifest exist.
