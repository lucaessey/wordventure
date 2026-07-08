## Why

More categories means more variety across all three modes (Normal, Infinite, Adventure) at zero engine cost — every mode already loads categories generically from the committed data and the metadata index. Food and Sports are broadly appealing themes for a father-son audience and slot into the existing pipeline with no new code paths.

## What Changes

- Add a **Food** category: a broad mix of foods, dishes, fruits, vegetables, and snacks — generic only, no brands. Range 3–10 letters with 20+ words per length. Multi-word dishes are normalized to letters-only (e.g. "hot dog" → HOTDOG) or excluded by the existing normalization.
- Add a **Sports** category: the activities themselves (SKI, GOLF, RUGBY, SOCCER, HOCKEY, LACROSSE), not teams. Naturally a small list — declared range 3–10, including every real entry rather than padding with obscure ones (buckets may fall below the generator's usual minimum-count threshold, so the threshold is relaxed or bypassed for this curated list).
- Both categories use the existing schema (`{ id, displayName, minLetters, maxLetters, wordsByLength }`), uppercase A–Z normalization, and length bucketing. They flow through the committed generator (`scripts/generate-words.ts`) into `src/data/categories/` and the `index.json` metadata, so they appear automatically in every category picker.
- No UI, engine, balance, or persistence changes — this is data plus a curated word list.

## Capabilities

### New Capabilities

None — no new behavior; existing category machinery consumes the new data.

### Modified Capabilities

- `word-data`: the "Launch categories" requirement changes from six categories to eight (adds Food and Sports), with their content rules.

## Impact

- New data: `scripts/wordlists/food.txt` and `scripts/wordlists/sports.txt` (curated raw lists), plus generated `src/data/categories/food.json` and `sports.json`; `index.json` regenerated to include both.
- Modified code: `scripts/generate-words.ts` registers the two sources; the minimum-words-per-bucket threshold is made per-category (or bypassed) so the deliberately small Sports list keeps every real entry.
- Modified tests: the data validation test expects eight launch categories.
- No runtime code touched — Normal/Infinite/Adventure pick these up for free.
- Deploy: the two new category chunks are precached like the others; offline play unaffected.
