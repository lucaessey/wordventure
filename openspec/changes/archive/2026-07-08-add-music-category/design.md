## Context

The word-data pipeline (`scripts/generate-words.ts`) reads curated raw lists from `scripts/wordlists/`, normalizes to uppercase A–Z, buckets by length, drops buckets under a per-category minimum, computes `minLetters`/`maxLetters`, and writes committed JSON plus `index.json`. All three game modes consume categories generically from that index. Prior additions (Food, Sports, then Movies/Dragon Ball/Switch) established the per-category `minWords`, `minLength`, and `maxLength` knobs. Music is another curated single-word franchise-style list in the same mold — id `music`, range 3–10.

## Goals / Non-Goals

**Goals:**

- Music: single-word artist names and song titles mixed, range 3–10, durable-first curation.
- Single-word only; strip accents/apostrophes/punctuation to A–Z.
- Reproducible through the committed generator; appears automatically in all pickers.

**Non-Goals:**

- No engine/UI/balance/persistence changes.
- No multi-word artists or titles mashed into one token — skip them.
- Not touching the other eleven categories or the English dictionary.

## Decisions

### Reuse existing generator knobs

Music registers with `minWords: 1` (curated small-bucket allowance, like Sports/Movies) and `maxLength: 10`. It uses the default minimum length (3) since real single-word music entries exist at length 3 (SIA, ABBA is 4; RAP-era one-worders, plus 3-letter song words). No new generator code — this change is data plus one source-list entry.

### Normalization is already correct

The shared `normalizeWord` strips spaces, hyphens, apostrophes, and accents, uppercases, and excludes anything left outside A–Z. So BEYONCÉ → BEYONCE, P!NK → PINK (the `!` makes it non-A–Z after stripping? no — `!` is not in the strip set, so "P!NK" would fail the A–Z test and be excluded). To honor the requested P!NK → PINK, the raw list stores the already-cleaned token (PINK), not the stylized form — curation writes clean spellings, and normalization is the safety net. Digits (e.g. a title like "7 RINGS") make an entry non-A–Z and are excluded; such titles are simply skipped (single-word rule already excludes "7 rings" anyway).

### Curation

- **Artists (single-word)**: DRAKE, ADELE, EMINEM, QUEEN, ABBA, RIHANNA, BEYONCE, SIA, LORDE, USHER, PINK, SHAKIRA, MADONNA, PRINCE, STING, SEAL, ENYA, BJORK, LIZZO, HALSEY, MARSHMELLO, COLDPLAY (band, one word), NIRVANA, METALLICA, AEROSMITH, RADIOHEAD, MUSE, OASIS, BLUR, GORILLAZ, EMINEM, KESHA, SZA, JAYZ→ has no letters issue (JAYZ), CIARA, NELLY, AKON, PITBULL, FLO→ obscure. Favor durable + a few current.
- **Song titles (single-word)**: HELLO, HALO, FLOWERS, THRILLER, ROAR, HUMBLE, HAPPY, SORRY, HELLO, FIREWORK, ROYALS, STAY, LEVITATING, PERFECT, YESTERDAY, IMAGINE, RESPECT, VOGUE, THRILLER, BELIEVER, RADIOACTIVE, VIVA→ "Viva la Vida" multi. Single-word only.
- Mix both into one `music.txt`. Skip multi-word (Taylor Swift, Bruno Mars, "Uptown Funk", "Blinding Lights"). Where a title/artist is naturally multi-word, drop it rather than concatenate. Durable-first with a handful of current names (LIZZO, SZA, HALSEY, DOJA→ "Doja Cat" multi, use DOJA? it's part of a two-word name; skip to honor single-word-artist rule — DOJA alone isn't the artist).

Trademarked/real names: fine for a personal father-son project, consistent with the existing franchise categories. Noted, accepted.

### Generator wiring and test

Register `music` in the generator's source list; regenerate to emit `music.json` and a 12-entry `index.json`. The data validation test's expected-id list grows to twelve; existing schema/normalization assertions already cover the new file. Add a Music range check (3–10, single normalized tokens) mirroring the other curated categories.

## Risks / Trade-offs

- [Thin buckets at length extremes (few 3- or 10-letter single-word music entries)] → Accepted per curated-complete approach; `minWords: 1` makes it explicit and the spec notes small buckets are allowed.
- ["Durable vs current" and "recognizable" are curation judgments, not code rules] → Enforced by authoring carefully; adjustments are one-line edits to the committed `.txt`.
- [Some entries double as common English words (QUEEN, PRINCE, HELLO, HAPPY, STAY, SEAL, MUSE, ROAR)] → Fine as answers; they're legitimately artists/titles and remain valid guesses.

## Open Questions

- Exact per-length counts and the final enumeration are authoring choices settled while building the list; the requirements (single-word, mixed artists + titles, durable-first, range 3–10, curated-complete) are the contract, the specific entries are not.
