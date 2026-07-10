## MODIFIED Requirements

### Requirement: Home screen category grid
The home screen SHALL present the available game modes (Normal, Infinite, and Adventure) as large selectable cards, with room for future modes. Selecting Normal SHALL show the category grid screen: all available categories as boxes in a scrollable grid, using the category metadata index (id, display name, letter range) without loading full word lists. Selecting a category SHALL navigate to that category's length picker. Selecting Infinite SHALL show the Infinite run setup screen. Selecting Adventure SHALL show the Adventure setup screen. The home screen SHALL also show a trophy icon in its top-left that opens the Trophy Room; the icon SHALL NOT overlap or conflict with any back button or other top-left navigation (on the home screen the top-left is otherwise empty).

#### Scenario: Modes shown on home
- **WHEN** the app opens to the home screen
- **THEN** Normal, Infinite, and Adventure appear as selectable mode cards

#### Scenario: Normal leads to the category grid
- **WHEN** the player selects Normal
- **THEN** all launch categories appear as selectable boxes in a scrollable grid

#### Scenario: Category selection navigates
- **WHEN** the player taps a category box
- **THEN** the length picker for that category is shown

#### Scenario: Infinite leads to run setup
- **WHEN** the player selects Infinite
- **THEN** the Infinite setup screen (difficulty and theme) is shown

#### Scenario: Adventure leads to its setup
- **WHEN** the player selects Adventure
- **THEN** the Adventure setup screen (category options and Continue when a save exists) is shown

#### Scenario: Trophy icon opens the Trophy Room
- **WHEN** the player taps the trophy icon in the home screen's top-left
- **THEN** the Trophy Room is shown, and the icon did not overlap any back button

### Requirement: Screen navigation
The app SHALL navigate between its screens (home, Normal's category grid, length picker, and game; Infinite's setup and run; Adventure's setup and run; the Trophy Room) without a page reload, and SHALL provide a way to return from any screen back toward home. On screens that display a back button in the top-left, the trophy icon SHALL NOT be placed in that same position.

#### Scenario: Back from length picker
- **WHEN** the player is on a length picker and goes back
- **THEN** the category grid screen is shown

#### Scenario: Leave a game
- **WHEN** the player exits a Normal game or an Infinite run in progress
- **THEN** they return toward home and the abandoned round or run has no lasting effect beyond already-recorded high scores

#### Scenario: Leave an Adventure run
- **WHEN** the player exits an Adventure run in progress
- **THEN** they return toward home and the run remains resumable from its last saved snapshot

#### Scenario: Back from the Trophy Room
- **WHEN** the player goes back from the Trophy Room
- **THEN** the home screen is shown, and the Trophy Room's back button occupies the top-left without a conflicting trophy icon
