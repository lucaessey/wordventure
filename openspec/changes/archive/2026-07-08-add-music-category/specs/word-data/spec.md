## MODIFIED Requirements

### Requirement: Launch categories
The project SHALL ship twelve category files: Original, Pokemon, Minecraft, Brawl Stars, Animals, Countries, Food, Sports, Movies & TV, Dragon Ball, Nintendo Switch, and Music. Each category's letter range SHALL be derived from what its word list actually supports; ranges MAY differ per category (e.g., Original spans 4–14 while a franchise category spans a narrower range).

The Food category SHALL contain a broad mix of foods, dishes, fruits, vegetables, and snacks; it SHALL be generic only (no brand names); its range SHALL be 3–10 letters with at least 20 words per length; multi-word dishes SHALL be normalized to letters-only (e.g. HOTDOG) or excluded.

The Sports category SHALL contain athletic activities themselves (e.g. SKI, GOLF, RUGBY, SOCCER, HOCKEY, LACROSSE), not teams; its declared range SHALL be 3–10 letters; because it is a naturally small curated list, it SHALL include every real entry rather than pad with obscure ones, and its length buckets MAY fall below the generator's usual minimum word count (a length bucket MAY be small).

The Movies & TV category SHALL contain single-word screen titles with broad kid/teen recognition (e.g. FROZEN, MOANA, ENCANTO, BLUEY, WEDNESDAY, POKEMON); multi-word titles SHALL be skipped rather than concatenated. Its declared range SHALL be 4–10 letters. It is a naturally small curated list: it SHALL include real recognizable titles rather than pad with obscure films, and its length buckets MAY be small.

The Dragon Ball category SHALL contain character names (e.g. GOKU, VEGETA, GOHAN, PICCOLO, FRIEZA, TRUNKS, CELL, BROLY, KRILLIN, BULMA). Its declared range SHALL be 3–10 letters, aiming for at least 15 words per length where the source allows; where a length has few canonical names, it SHALL include what exists rather than invent entries (a length bucket MAY be small).

The Nintendo Switch category SHALL contain Switch game titles and franchises expressed as single words (e.g. MARIO, ZELDA, KIRBY, SPLATOON, METROID, PIKMIN, BAYONETTA); only single-word entries SHALL be included. Its declared range SHALL be 4–10 letters. It is a naturally small curated list: it SHALL include real recognizable titles rather than pad, and its length buckets MAY be small.

The Music category SHALL contain a single mixed list of single-word music artist names (e.g. DRAKE, ADELE, EMINEM, QUEEN, ABBA, RIHANNA, BEYONCE, SIA, LORDE, USHER) and single-word song titles (e.g. HELLO, HALO, FLOWERS, THRILLER, ROAR, HUMBLE); only single-word entries SHALL be included (multi-word artists and titles SHALL be skipped rather than concatenated), and accents, apostrophes, and punctuation SHALL be stripped to uppercase A–Z (e.g. BEYONCÉ → BEYONCE, P!NK → PINK). Curation SHALL favor durable, widely recognized names over transient chart hits, with a few current names mixed in. Its declared range SHALL be 3–10 letters; it is a curated list where a length bucket MAY be small.

#### Scenario: All twelve categories present
- **WHEN** the app's category data is enumerated
- **THEN** exactly the twelve launch categories are found, each with a valid schema and a non-empty word list

#### Scenario: Food density
- **WHEN** the Food category file is inspected
- **THEN** it spans 3–10 letters with at least 20 words in each length bucket, and every word is generic (no brands) and normalized to uppercase A–Z

#### Scenario: Sports is complete rather than padded
- **WHEN** the Sports category file is inspected
- **THEN** it contains athletic activities (not teams) within the 3–10 declared range, keeping every real entry even where a length bucket is small

#### Scenario: New franchise categories are single-word and within range
- **WHEN** the Movies & TV, Dragon Ball, and Nintendo Switch category files are inspected
- **THEN** every entry is a single normalized uppercase A–Z token within that category's declared range (Movies & TV and Nintendo Switch 4–10, Dragon Ball 3–10), with no multi-word entries and small buckets permitted

#### Scenario: Music is single-word artists and titles within range
- **WHEN** the Music category file is inspected
- **THEN** every entry is a single normalized uppercase A–Z token within the 3–10 declared range, mixing artist names and song titles, with no multi-word entries and small buckets permitted
