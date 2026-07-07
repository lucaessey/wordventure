## MODIFIED Requirements

### Requirement: Home screen category grid
The home screen SHALL present the available game modes (Normal and Infinite) as large selectable cards, with room for future modes. Selecting Normal SHALL show the category grid screen: all available categories as boxes in a scrollable grid, using the category metadata index (id, display name, letter range) without loading full word lists. Selecting a category SHALL navigate to that category's length picker. Selecting Infinite SHALL show the Infinite run setup screen.

#### Scenario: Modes shown on home
- **WHEN** the app opens to the home screen
- **THEN** Normal and Infinite appear as selectable mode cards

#### Scenario: Normal leads to the category grid
- **WHEN** the player selects Normal
- **THEN** all six launch categories appear as selectable boxes in a scrollable grid

#### Scenario: Category selection navigates
- **WHEN** the player taps a category box
- **THEN** the length picker for that category is shown

#### Scenario: Infinite leads to run setup
- **WHEN** the player selects Infinite
- **THEN** the Infinite setup screen (difficulty and theme) is shown

### Requirement: Screen navigation
The app SHALL navigate between its screens (home, Normal's category grid, length picker, and game; Infinite's setup and run) without a page reload, and SHALL provide a way to return from any screen back toward home.

#### Scenario: Back from length picker
- **WHEN** the player is on a length picker and goes back
- **THEN** the category grid screen is shown

#### Scenario: Leave a game
- **WHEN** the player exits a Normal game or an Infinite run in progress
- **THEN** they return toward home and the abandoned round or run has no lasting effect beyond already-recorded high scores
