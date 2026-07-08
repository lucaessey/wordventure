## Why

Music is a broadly appealing theme that rounds out the launch set, and like every prior category it drops into the existing pipeline at zero engine cost — the category machinery already loads everything generically from committed data and the metadata index.

## What Changes

- Add a **Music** category (`id: music`, displayName "Music"): a single mixed list of single-word music artist names (DRAKE, ADELE, EMINEM, QUEEN, ABBA, RIHANNA, BEYONCE, SIA, LORDE, USHER) and single-word song titles (HELLO, HALO, FLOWERS, THRILLER, ROAR, HUMBLE).
- **Single-word entries only** — multi-word artists and titles are skipped rather than mashed into one string. Normalization strips accents, apostrophes, and punctuation to uppercase A–Z (BEYONCÉ → BEYONCE, P!NK → PINK).
- Curation favors durable, widely recognized names over this-month's chart hits, with a few current popular ones mixed in.
- Range 3–10 letters; aim for enough per length that answers don't repeat constantly, including what genuinely exists at thin lengths rather than padding with obscure picks (small buckets acceptable).
- Uses the existing schema (`{ id, displayName, minLetters, maxLetters, wordsByLength }`), length bucketing, and generator; appears automatically in every category picker. No UI, engine, balance, or persistence changes.

## Capabilities

### New Capabilities

None — no new behavior; existing category machinery consumes the new data.

### Modified Capabilities

- `word-data`: the "Launch categories" requirement changes from eleven categories to twelve (adds Music), with its content rules.

## Impact

- New data: `scripts/wordlists/music.txt` (curated raw list), plus generated `src/data/categories/music.json`; `index.json` regenerated to include it.
- Modified code: `scripts/generate-words.ts` registers the `music` source (curated, small-bucket allowance via the existing `minWords: 1`, `maxLength: 10`).
- Modified tests: the data validation test expects twelve launch categories.
- No runtime code touched — Normal/Infinite/Adventure pick it up for free; the new chunk precaches like the others (offline unaffected).
