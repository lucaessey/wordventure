## Context

The word-data pipeline (`scripts/generate-words.ts`) reads curated raw lists from `scripts/wordlists/`, normalizes to uppercase A–Z, buckets by length, drops buckets under a per-category minimum, computes `minLetters`/`maxLetters`, and writes committed JSON plus `index.json`. All three game modes consume categories generically from that index, so adding a category is a data task. The Food/Sports change already added per-category `minWords` (small-bucket allowance) and `maxLength` (declared upper bound). This change adds three curated, naturally-small franchise categories in the same mold, and needs one small new knob: a per-category minimum length for the two 4–10 ranges.

## Goals / Non-Goals

**Goals:**

- Movies & TV: single-word recognizable titles, range 4–10, curated-complete (no padding).
- Dragon Ball: character names, range 3–10, 15+ per length where the source allows.
- Nintendo Switch: single-word game/franchise titles, range 4–10, curated-complete.
- All reproducible through the committed generator; appear automatically in all pickers.

**Non-Goals:**

- No engine/UI/balance/persistence changes.
- No multi-word titles mashed into one token — skip them.
- Not touching the other eight categories or the English dictionary.

## Decisions

### Per-category minimum length (new generator knob)

Movies & TV and Nintendo Switch declare a 4–10 range, but real single-word titles include 3-letter entries (e.g. ELF, the movie). To hold the declared lower bound without hand-pruning, add an optional `minLength` to the generator's `CategorySource` (mirroring the existing `maxLength`); the bucket loop runs `max(MIN_LENGTH, minLength)` … `min(MAX_LENGTH, maxLength)`. Movies/Switch set `minLength: 4`; Dragon Ball uses the default (3). A 3-letter title that exists but falls outside the declared range is simply excluded from that category (it's still valid as a guess via the English dictionary union if applicable).

### Small-bucket allowance (reuse existing knob)

All three are curated, naturally-small lists — like Sports. They set `minWords: 1` so every real entry survives rather than being dropped or padded. Small or single-entry buckets at the range edges are acceptable and expected; the spec notes this. Dragon Ball's "15+ per length where the source allows" is a soft target, not a hard floor: where a length genuinely has few canonical names, include what exists.

### Content curation and scope

- **Movies & TV**: single-word titles with broad kid/teen recognition — animated films (FROZEN, MOANA, ENCANTO, TANGLED, COCO→4, LUCA, ONWARD, BRAVE, WISH), franchises/shows (BLUEY, POKEMON, WEDNESDAY, ARCANE, GRAVITY? no—multi-word). Curation judgment at authoring time; skip anything multi-word (TOY STORY, STAR WARS) rather than concatenating. Naturally smaller — completeness over padding.
- **Dragon Ball**: canonical character names (GOKU, GOHAN, GOTEN, VEGETA, TRUNKS, PICCOLO, FRIEZA, CELL, BROLY, BULMA, KRILLIN, ROSHI, BEERUS, WHIS, NAPPA, RADITZ, YAMCHA, TIEN, CHIAOTZU, DENDE, SHENRON, MAJINBUU→ excluded if multi-token, use BUU). Aim 15+/length where names exist; short lengths (3) will be thin.
- **Nintendo Switch**: single-word franchise/title words (MARIO, ZELDA, KIRBY, LUIGI, PEACH, BOWSER, YOSHI, SPLATOON, METROID, PIKMIN, BAYONETTA, XENOBLADE, ARMS, SNIPPERCLIPS→ maybe, RINGFIT→ multi, use just single tokens). Skip multi-word titles; where a game is naturally multi-word (Animal Crossing, Mario Kart), take the recognizable single token (CROSSING? ambiguous — prefer franchise words like MARIO, ZELDA). Curation judgment.

Trademarked names (as with the existing Pokemon, Minecraft, Brawl Stars categories): fine for a personal father-son project not published to stores. Noted, accepted.

### Normalization and generator wiring

Both existing behaviors apply unchanged: the shared `normalizeWord` handles casing/stripping/exclusion, and the three sources register in the generator's list alongside the current eight, each with `minWords: 1` and `maxLength: 10` (and `minLength: 4` for Movies/Switch). Regenerate to emit the three JSON files and an 11-entry `index.json`. The data validation test's expected-id list grows to eleven; existing schema/normalization assertions already cover new files.

## Risks / Trade-offs

- [Thin buckets at range edges (e.g. a 10-letter Dragon Ball name may be rare)] → Accepted per the curated-complete approach; `minWords: 1` makes it explicit. Spec notes small buckets are allowed.
- ["Recognizable" is a curation judgment, not a code rule] → Enforced by authoring carefully; a questionable entry is a one-line edit in the committed `.txt`.
- [Some franchise entries are also common English words (ARMS, BRAVE, WISH, PEACH)] → Fine as answers; they're legitimately in the franchise and still valid guesses.

## Open Questions

- Exact per-length counts and final enumerations are authoring choices settled while building the lists; the requirements (single-word, recognizable, declared ranges, curated-complete, Dragon Ball 15+/length where possible) are the contract, the specific words are not.
