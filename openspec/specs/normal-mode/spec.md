# normal-mode Specification

## Purpose
TBD - created by syncing change add-normal-mode. Update Purpose after review.

## Requirements

### Requirement: Length selection within category range
After choosing a category, the player SHALL choose a word length. Only lengths for which the category has a word bucket SHALL be offered. Choosing a length SHALL start a game with a random answer drawn from that category's bucket for that length.

#### Scenario: Offered lengths match the category
- **WHEN** the length picker for a category is shown
- **THEN** exactly the lengths present in that category's `wordsByLength` are offered

#### Scenario: Starting a game
- **WHEN** the player picks a length
- **THEN** a game starts whose answer is a word from that category at that length

### Requirement: Fixed guess count from balance
A Normal game SHALL allow a fixed number of guesses defined by the balance value `normal.guessCount` (initially 6; tune in playtesting). When all guesses are used without finding the answer, the game SHALL end as a loss and reveal the answer.

#### Scenario: Loss reveals the answer
- **WHEN** the player uses all `normal.guessCount` guesses without guessing the answer
- **THEN** the game ends as a loss and the answer is shown

### Requirement: Board and tile feedback
The game SHALL display a board of `normal.guessCount` rows sized to the word length. Submitted guesses SHALL show per-letter green/yellow/gray feedback exactly as scored by the guess engine, and the in-progress row SHALL show the letters typed so far.

#### Scenario: Submitted guess is colored
- **WHEN** a valid guess is submitted
- **THEN** its row shows the engine's green/yellow/gray feedback for each letter

#### Scenario: Typing fills the current row
- **WHEN** the player types letters
- **THEN** they appear left-to-right in the current row, up to the word length

### Requirement: Keyboard input
The game SHALL provide an on-screen A–Z keyboard with enter and backspace, whose keys reflect the engine's best-known state per letter. Physical keyboard input SHALL be supported with identical behavior.

#### Scenario: Keyboard reflects letter knowledge
- **WHEN** guesses have been scored
- **THEN** each on-screen key shows that letter's best-known state (green, yellow, gray, or unknown)

#### Scenario: Physical keyboard parity
- **WHEN** the player uses a physical keyboard (letters, Enter, Backspace)
- **THEN** behavior is identical to tapping the on-screen keys

### Requirement: Invalid guess rejection
Submitting a guess that fails engine validation SHALL shake the current row, show a "not in word list" (or "not enough letters") message, and consume no guess. The typed letters SHALL remain so the player can edit them.

#### Scenario: Unknown word shakes at no cost
- **WHEN** the player submits a word that is in neither the English dictionary nor the category list
- **THEN** the row shakes with a "not in word list" message and the remaining guess count is unchanged

#### Scenario: Incomplete word rejected
- **WHEN** the player presses enter with fewer letters than the word length
- **THEN** the guess is rejected at no cost

### Requirement: Win, loss, and replay
Guessing the answer SHALL end the game as a win with a celebration message. After a win or loss the player SHALL be offered: play again (same category and length, new random answer) or return home to change category. Replays SHALL be unlimited with no daily word mechanic.

#### Scenario: Winning
- **WHEN** a submitted guess equals the answer
- **THEN** the game ends as a win and play-again / home options are shown

#### Scenario: Play again draws a fresh word
- **WHEN** the player chooses play again
- **THEN** a new game starts in the same category and length with a newly drawn random answer
