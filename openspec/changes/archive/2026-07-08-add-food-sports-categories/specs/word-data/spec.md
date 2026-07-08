## MODIFIED Requirements

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
