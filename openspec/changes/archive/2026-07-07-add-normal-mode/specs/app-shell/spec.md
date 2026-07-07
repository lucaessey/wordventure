## ADDED Requirements

### Requirement: Home screen category grid
The home screen SHALL display all available categories as boxes in a scrollable grid, using the category metadata index (id, display name, letter range) without loading full word lists. Selecting a category SHALL navigate to that category's length picker.

#### Scenario: All categories shown
- **WHEN** the app opens to the home screen
- **THEN** all six launch categories appear as selectable boxes in a scrollable grid

#### Scenario: Category selection navigates
- **WHEN** the player taps a category box
- **THEN** the length picker for that category is shown

### Requirement: Screen navigation
The app SHALL navigate between home, length picker, and game screens without a page reload, and SHALL provide a way to return from any screen back toward home.

#### Scenario: Back from length picker
- **WHEN** the player is on a length picker and goes back
- **THEN** the home screen is shown

#### Scenario: Leave a game
- **WHEN** the player exits a game in progress
- **THEN** they return to the home screen and the abandoned round has no lasting effect

### Requirement: Offline installable PWA
After a first successful visit, the app SHALL load and be fully playable with no network access, and SHALL be installable (valid manifest with icons). Word data needed for play SHALL come from precached static assets, never a runtime API.

#### Scenario: Offline play after first visit
- **WHEN** the app has been loaded once and the device then goes offline
- **THEN** the app opens and a Normal game in any category can be played to completion

#### Scenario: Installable manifest
- **WHEN** the deployed app is audited for installability
- **THEN** the manifest is valid and references existing 192px and 512px icons
