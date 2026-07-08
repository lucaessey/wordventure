## Context

The word-data pipeline (`scripts/generate-words.ts`) reads curated raw lists from `scripts/wordlists/`, normalizes to uppercase A–Z, buckets by length, drops buckets under a minimum word count, computes `minLetters`/`maxLetters`, and writes committed JSON plus an `index.json` metadata file. All three game modes consume categories generically from that index, so adding a category is purely a data task — no runtime code changes. This change adds two categories with different shapes: Food (broad, must hit a density target) and Sports (curated-complete, deliberately sparse).

## Goals / Non-Goals

**Goals:**

- Food: 3–10 letters, 20+ words per length, generic (no brands), letters-only normalization.
- Sports: activities not teams, declared 3–10, include every real entry (don't pad).
- Both reproducible through the committed generator; appear automatically in all pickers.

**Non-Goals:**

- No engine/UI/balance/persistence changes.
- No brands, no team names, no franchise cross-over.
- Not touching the other six categories or the English dictionary.

## Decisions

### Per-category minimum-bucket threshold

The generator currently drops any length bucket below a global minimum word count (so a "random" answer pool is never trivially small). Food comfortably clears this (20+/length by requirement). Sports will not — there are only a handful of, say, 9- and 10-letter sports. Rather than pad Sports with obscure entries (the proposal explicitly forbids this), make the threshold **per-category**: Sports opts into a low/zero threshold so every real entry survives, while Food and the existing categories keep the standard threshold. A one-word bucket is acceptable for a curated category the player opted into; the trade-off (that length's answer is deterministic) is fine and worth a note in the spec.

### Word sourcing and curation

- **Food**: assemble from public-domain / common-knowledge food vocabulary (fruits, vegetables, dishes, snacks, staples), filtered to what normalizes cleanly to 3–10 letters. Multi-word dishes become letters-only when the result is a natural single token (HOTDOG, ICECREAM) or are excluded when the concatenation reads oddly — a curation judgment made while authoring the list, then frozen as committed text. Aim past 20/length so the committed buckets clear the density bar with margin.
- **Sports**: hand-enumerate real sports and athletic activities (SKI, GOLF, RUGBY, SOCCER, TENNIS, HOCKEY, BOXING, ROWING, SKIING, CYCLING, LACROSSE, …), activities only. Whatever the lengths land at, keep them all; declare 3–10 as the nominal range even if some interior lengths are thin or a couple of buckets are tiny.

### Normalization is already correct

Both lists ride the existing shared `normalizeWord` (strip spaces/hyphens/apostrophes, drop accents, uppercase, exclude non-A–Z). "Hot dog" → HOTDOG and "crème brûlée" → CREMEBRULEE fall out for free; anything with digits/symbols is auto-excluded. No normalization changes needed.

### Generator wiring

Register `food` and `sports` in the generator's category source list alongside the existing six, each pointing at its raw `.txt`. Regenerate to emit `food.json`, `sports.json`, and an 8-entry `index.json`. The data validation test's expected-id list grows to eight; existing schema/normalization assertions already cover the new files.

## Risks / Trade-offs

- [Sports buckets can be tiny (even size 1)] → Accepted and intended per the "include every real entry" instruction; the per-category threshold makes it explicit rather than accidental. Spec notes the small-bucket allowance.
- [Food "no brands" is a curation judgment, not a code rule] → Enforced by authoring the list carefully; a stray brand is a one-line fix in the committed `.txt`, not a schema issue.
- [Letters-only multi-word collapse can produce ambiguous tokens] → Curate at authoring time; exclude anything that reads oddly rather than forcing it.

## Open Questions

- Exact per-length Food counts and the final Sports enumeration are authoring choices settled while building the lists; the requirement (20+/length for Food; complete for Sports) is the contract, the specific words are not.
