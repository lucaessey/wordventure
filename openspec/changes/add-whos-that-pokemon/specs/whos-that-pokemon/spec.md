## ADDED Requirements

### Requirement: Silhouette guessing round
The mode SHALL present a single round in which a Pokemon's silhouette is shown and the player guesses its name on a Wordle board of `whosThatPokemon.guessCount` (initially 6) guesses. The board width SHALL equal the answer Pokemon's name length, and each submitted guess SHALL receive full green/yellow/gray letter feedback from the shared guess engine. The mode SHALL be a single round per play with no run, streak, or persisted score.

#### Scenario: Round presents a silhouette and a sized board
- **WHEN** the mode starts a round
- **THEN** a Pokemon silhouette is shown and the board has `whosThatPokemon.guessCount` rows sized to the answer name's length

#### Scenario: Guesses get letter feedback
- **WHEN** the player submits a valid guess
- **THEN** the row shows the engine's green/yellow/gray feedback for each letter, exactly as in the other modes

#### Scenario: Single round, no carryover
- **WHEN** a round ends and the player starts another
- **THEN** a new independent round begins with no streak or score carried over

### Requirement: Guess validation for the mode
A guess SHALL be valid if it appears in the Pokemon name list OR the standard English dictionary, for the answer's length — the same union rule as the word categories. Invalid guesses SHALL be rejected with the standard "not in word list" shake and SHALL NOT consume a guess.

#### Scenario: A Pokemon name is a valid guess
- **WHEN** the player submits a Pokemon name of the correct length
- **THEN** the guess is accepted and scored

#### Scenario: A dictionary word is a valid guess
- **WHEN** the player submits an English-dictionary word of the correct length that is not a Pokemon name
- **THEN** the guess is accepted and scored

#### Scenario: Unknown word rejected at no cost
- **WHEN** the player submits a word in neither list
- **THEN** it is rejected with a shake and no guess is consumed

### Requirement: Reveal on win or exhaustion
On a correct guess, or after the final guess is used without solving, the silhouette SHALL reveal to the full-color image and the Pokemon's name SHALL be shown. After the reveal, the player SHALL be able to play another round.

#### Scenario: Reveal on a win
- **WHEN** the player guesses the Pokemon correctly
- **THEN** the full-color image and the Pokemon's name are shown

#### Scenario: Reveal on running out of guesses
- **WHEN** the player uses all guesses without solving
- **THEN** the full-color image and the Pokemon's name are shown, disclosing the answer

### Requirement: Manifest-driven entries
The mode SHALL read its Pokemon from a manifest (`src/data/whos-that-pokemon.json`) of entries `{ name, silhouetteImage, revealImage }` and SHALL work with whatever entries are present — the number of entries SHALL NOT be hardcoded anywhere. Each round's answer SHALL be drawn from the manifest. When the manifest is empty, the mode SHALL show a graceful "no Pokemon available" state rather than failing.

#### Scenario: Works with any entry count
- **WHEN** the manifest contains N entries (whether a few placeholders or a full generation)
- **THEN** the mode selects rounds from exactly those N entries with no code change

#### Scenario: Empty manifest is handled
- **WHEN** the manifest has no entries
- **THEN** the mode shows a graceful empty state and does not crash

### Requirement: Data-driven image assets with an empty seam
Pokemon images SHALL live in a dedicated assets folder (`public/pokemon/`) referenced by the manifest, and image sourcing/licensing SHALL be handled outside the game code. This change SHALL ship the assets folder empty except for a README documenting the filename convention and image format (transparent-background PNG, square, consistent size) and the single-image-plus-CSS silhouette approach. A small number of placeholder manifest entries with stand-in (non-Pokemon) images SHALL exist so the mode is testable before real art is added.

#### Scenario: README documents the convention
- **WHEN** a contributor opens `public/pokemon/README.md`
- **THEN** it states the filename convention, the required image format, and how the manifest maps entries to files

#### Scenario: Silhouette from a single image
- **WHEN** a manifest entry's silhouette and reveal point at the same transparent-background image
- **THEN** the mode renders the silhouette from that one image via a CSS filter and removes the filter on reveal, requiring no second file

#### Scenario: Real art is a file drop
- **WHEN** real images are added to `public/pokemon/` and referenced by manifest entries
- **THEN** the mode uses them with no code change
