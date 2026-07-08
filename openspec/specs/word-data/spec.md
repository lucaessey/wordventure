# word-data Specification

## Purpose
TBD - created by syncing change add-word-data-and-guess-engine. Update Purpose after review.

## Requirements

### Requirement: Category data schema
Each word category SHALL be a static JSON file in `src/data/categories/` with the shape `{ id, displayName, minLetters, maxLetters, wordsByLength }`, where `wordsByLength` maps string word-lengths to arrays of words. All words in a bucket MUST have exactly that bucket's length, and every bucket key MUST fall within `[minLetters, maxLetters]`.

#### Scenario: Category file is well-formed
- **WHEN** a category JSON file is loaded and validated
- **THEN** it contains `id`, `displayName`, `minLetters`, `maxLetters`, and `wordsByLength`, every word in bucket `"N"` has length N, and every bucket key K satisfies `minLetters <= K <= maxLetters`

#### Scenario: No empty length buckets
- **WHEN** the generator emits a category file
- **THEN** every bucket present in `wordsByLength` is non-empty, and length buckets below the generator's minimum word count are omitted entirely

### Requirement: Launch categories
The project SHALL ship eight category files: Original, Pokemon, Minecraft, Brawl Stars, Animals, Countries, Food, and Sports. Each category's letter range SHALL be derived from what its word list actually supports; ranges MAY differ per category (e.g., Original spans 4–14 while a franchise category spans a narrower range).

The Food category SHALL contain a broad mix of foods, dishes, fruits, vegetables, and snacks; it SHALL be generic only (no brand names); its range SHALL be 3–10 letters with at least 20 words per length; multi-word dishes SHALL be normalized to letters-only (e.g. HOTDOG) or excluded.

The Sports category SHALL contain athletic activities themselves (e.g. SKI, GOLF, RUGBY, SOCCER, HOCKEY, LACROSSE), not teams; its declared range SHALL be 3–10 letters; because it is a naturally small curated list, it SHALL include every real entry rather than pad with obscure ones, and its length buckets MAY fall below the generator's usual minimum word count (a length bucket MAY be small).

#### Scenario: All eight categories present
- **WHEN** the app's category data is enumerated
- **THEN** exactly the eight launch categories are found, each with a valid schema and a non-empty word list

#### Scenario: Food density
- **WHEN** the Food category file is inspected
- **THEN** it spans 3–10 letters with at least 20 words in each length bucket, and every word is generic (no brands) and normalized to uppercase A–Z

#### Scenario: Sports is complete rather than padded
- **WHEN** the Sports category file is inspected
- **THEN** it contains athletic activities (not teams) within the 3–10 declared range, keeping every real entry even where a length bucket is small

### Requirement: English guess dictionary
The project SHALL include a shared English guess dictionary sourced from a public-domain word list, bucketed by word length covering lengths 3 through 14, stored as static committed JSON. It is used only to validate guesses, never to draw answers.

#### Scenario: Dictionary covers all playable lengths
- **WHEN** the dictionary data is inspected
- **THEN** a non-empty bucket exists for every length from 3 to 14

### Requirement: Word normalization
All stored words and all typed guesses SHALL be normalized by one shared function: strip spaces, hyphens, and apostrophes; remove accents (Unicode decomposition, drop combining marks); uppercase. Entries whose normalized form contains any character outside A–Z (e.g., digits) SHALL be excluded from generated data; such input SHALL be treated as invalid at guess time.

#### Scenario: Multi-word and accented entries normalize
- **WHEN** the entries "Mr. Mime", "Poké Ball", and "sea-horse" are normalized
- **THEN** they become "MRMIME", "POKEBALL", and "SEAHORSE"

#### Scenario: Entries with digits are excluded
- **WHEN** an entry such as "Porygon2" is processed by the generator
- **THEN** it is excluded from the generated category file

#### Scenario: Stored words are already normalized
- **WHEN** any generated category or dictionary file is inspected
- **THEN** every word consists only of uppercase A–Z characters

### Requirement: Static offline word data
All word data SHALL be generated at authoring time by a committed script and committed to the repository as static JSON. The app SHALL NOT fetch word data from any API at runtime.

#### Scenario: Regenerating data is reproducible
- **WHEN** the generation script is run against the committed raw word lists
- **THEN** it deterministically produces the committed category and dictionary JSON files

#### Scenario: No runtime network dependency
- **WHEN** the app runs with no network access
- **THEN** all category and dictionary data is available from the bundle
