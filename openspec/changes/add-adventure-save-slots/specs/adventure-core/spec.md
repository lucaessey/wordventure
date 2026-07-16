## MODIFIED Requirements

### Requirement: Save and resume
Adventure SHALL provide two independent save slots. The full run state (difficulty, level, lives, coins, settings, current puzzle including the answer and all guesses) SHALL be snapshotted after every guess to the localStorage key of the slot the run belongs to; the two slots SHALL use distinct keys and never overwrite each other. The first slot SHALL use the original single-save key so a pre-existing run appears as slot 1 without migration. The Adventure setup screen SHALL show both slots: for each occupied slot it SHALL offer Continue — showing that slot's saved difficulty, level, lives, and coins — and restore that run exactly, including a partially guessed puzzle; an empty slot SHALL offer starting a new run. Starting a new run in a slot SHALL replace only that slot's save; run over or victory SHALL clear only the slot the run belongs to. A run SHALL remain bound to its slot for its lifetime, including retry after it ends. A save whose shape is not recognized — including a difficulty outside the set of Adventure difficulties — SHALL be discarded without crashing; the set of valid difficulties SHALL cover every selectable Adventure difficulty.

#### Scenario: Snapshot after every guess
- **WHEN** any guess is accepted
- **THEN** the persisted snapshot for that run's slot reflects the run state including that guess

#### Scenario: Two runs persist independently
- **WHEN** a run is in progress in slot 1 and a different run is started and played in slot 2
- **THEN** both slots hold their own run and continuing either restores that run unchanged

#### Scenario: Resume mid-puzzle
- **WHEN** the app is closed mid-level and reopened
- **THEN** the slot's Continue restores the same difficulty, level, lives, coins, answer, and prior guesses

#### Scenario: A pre-existing single save appears as slot 1
- **WHEN** a save written under the original single-save key exists and the setup screen opens
- **THEN** that run is offered as slot 1's Continue

#### Scenario: Starting a new run replaces only its slot
- **WHEN** the player starts a new run in one slot while the other slot holds a run
- **THEN** only the chosen slot's save is replaced and the other slot's run is untouched

#### Scenario: Death clears only that slot
- **WHEN** a run ends in defeat or victory
- **THEN** that run's slot is cleared and the setup screen no longer offers Continue for it, while the other slot is unaffected

#### Scenario: Every difficulty resumes
- **WHEN** a run on any selectable difficulty (including Extra Hard and Super Hard) is saved and reloaded
- **THEN** the save passes validation and is offered for Continue

#### Scenario: Corrupt save discarded
- **WHEN** a slot's stored snapshot cannot be parsed or fails shape validation
- **THEN** the setup screen behaves as if that slot is empty
