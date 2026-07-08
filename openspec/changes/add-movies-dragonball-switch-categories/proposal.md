## Why

Three more themed categories broaden the appeal across all modes at zero engine cost — the category machinery already loads everything generically from committed data and the metadata index. Movies & TV, Dragon Ball, and Nintendo Switch are high-recognition themes for the kid/teen audience and drop straight into the existing pipeline, just like the Food and Sports additions before them.

## What Changes

- Add **Movies & TV**: single-word screen titles kids/teens actually recognize (FROZEN, MOANA, ENCANTO, BLUEY, WEDNESDAY, POKEMON). Multi-word titles are skipped rather than mashed together. Range 4–10; naturally smaller — include real recognizable titles, don't pad with obscure films.
- Add **Dragon Ball**: character names (GOKU, VEGETA, GOHAN, PICCOLO, FRIEZA, TRUNKS, CELL, BROLY, KRILLIN, BULMA). Range 3–10, aiming for 15+ per length where the source allows.
- Add **Nintendo Switch**: Switch game titles and franchises as single words (MARIO, ZELDA, KIRBY, SPLATOON, METROID, PIKMIN, BAYONETTA). Single-word entries only. Range 4–10.
- All three use the existing schema (`{ id, displayName, minLetters, maxLetters, wordsByLength }`), uppercase A–Z normalization, and length bucketing, and flow through the committed generator into `src/data/categories/` and `index.json` — so they appear automatically in every category picker.
- These are curated, naturally-smaller lists (like Sports): include what genuinely exists per length rather than inventing entries; small buckets are acceptable. No UI, engine, balance, or persistence changes.

## Capabilities

### New Capabilities

None — no new behavior; existing category machinery consumes the new data.

### Modified Capabilities

- `word-data`: the "Launch categories" requirement changes from eight categories to eleven (adds Movies & TV, Dragon Ball, and Nintendo Switch), with their content rules.

## Impact

- New data: `scripts/wordlists/movies-tv.txt`, `scripts/wordlists/dragon-ball.txt`, `scripts/wordlists/nintendo-switch.txt` (curated raw lists), plus generated `movies-tv.json`, `dragon-ball.json`, `nintendo-switch.json`; `index.json` regenerated to include all three.
- Modified code: `scripts/generate-words.ts` registers the three sources (with the per-category small-bucket threshold, and a per-category minimum length for the 4–10 ranges). The generator already supports `minWords` and `maxLength`; this adds an optional `minLength` for the Movies/Switch lower bound.
- Modified tests: the data validation test expects eleven launch categories.
- No runtime code touched — Normal/Infinite/Adventure pick these up for free; new chunks precache like the others (offline unaffected).
