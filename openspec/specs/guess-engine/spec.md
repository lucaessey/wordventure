# guess-engine Specification

## Purpose
TBD - created by syncing change add-word-data-and-guess-engine. Update Purpose after review.

## Requirements

### Requirement: Guess feedback coloring
The engine SHALL score a guess against an answer of equal length, marking each position green (correct letter, correct position), yellow (letter occurs in the answer at a different position), or gray (letter not available in the answer). Duplicate letters SHALL follow standard Wordle rules: a letter is marked green/yellow at most as many times as it occurs in the answer, with greens allocated first, then yellows left-to-right.

#### Scenario: Exact match is all green
- **WHEN** the guess equals the answer
- **THEN** every position is green

#### Scenario: Duplicate guess letters against a single occurrence
- **WHEN** the answer contains a letter once and the guess contains it twice with neither in the correct position
- **THEN** only the first (leftmost) occurrence is yellow and the second is gray

#### Scenario: Green consumes an occurrence before yellow
- **WHEN** the answer contains a letter once, and the guess has that letter both in the correct position and in another position
- **THEN** the correct position is green and the other occurrence is gray

#### Scenario: Letter absent from answer
- **WHEN** a guessed letter does not occur in the answer at all
- **THEN** that position is gray

### Requirement: Guess validation
The engine SHALL accept a guess as valid only if its normalized form has the required length and appears in the union of the English guess dictionary and the active category's word list for that length. Validation SHALL return a result that distinguishes a valid guess from rejection reasons (wrong length, not in word list), and an invalid guess SHALL NOT consume a guess, life, or pool unit in any mode.

#### Scenario: Dictionary word is valid
- **WHEN** the guess appears in the English dictionary bucket for the required length
- **THEN** the guess is valid

#### Scenario: Category-only word is valid
- **WHEN** the guess appears in the active category's word list but not in the English dictionary
- **THEN** the guess is valid

#### Scenario: Unknown word is rejected without cost
- **WHEN** the guess appears in neither the dictionary nor the active category's list
- **THEN** validation reports "not in word list" and no guess/life/pool unit is consumed

#### Scenario: Wrong-length guess is rejected
- **WHEN** the normalized guess length differs from the required length
- **THEN** validation rejects the guess

### Requirement: Keyboard letter state
The engine SHALL derive a best-known state per letter (green, yellow, gray, or unknown) from all scored guesses in the current puzzle, with precedence green > yellow > gray > unknown. A letter's state SHALL never downgrade as more guesses are scored.

#### Scenario: Yellow upgrades to green
- **WHEN** a letter was previously yellow and a later guess scores it green
- **THEN** the keyboard state for that letter is green

#### Scenario: Yellow does not downgrade to gray
- **WHEN** a letter is yellow in one position of a guess and gray in another position of the same or a later guess (duplicate handling)
- **THEN** the keyboard state for that letter remains yellow

### Requirement: Answer selection
The engine SHALL select answers uniformly at random from the active category's word bucket for the chosen length. Answers SHALL always come from a category list, never from the English dictionary. The random source SHALL be injectable so tests are deterministic.

#### Scenario: Answer drawn from the category bucket
- **WHEN** an answer is requested for a category and length
- **THEN** the returned word is a member of that category's bucket for that length

#### Scenario: Deterministic under injected RNG
- **WHEN** an answer is requested twice with the same seeded random source
- **THEN** the same word is returned both times

### Requirement: Pure, UI-free engine
All engine functions SHALL be pure TypeScript with no React, DOM, or storage dependencies, covered by Vitest unit tests. Given identical inputs (including any injected random source), outputs SHALL be identical.

#### Scenario: Engine module has no UI imports
- **WHEN** the engine modules are inspected
- **THEN** they import nothing from React, the DOM, or localStorage

#### Scenario: Feedback is deterministic
- **WHEN** the same guess is scored against the same answer repeatedly
- **THEN** the result is identical every time
