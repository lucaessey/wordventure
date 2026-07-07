## ADDED Requirements

### Requirement: GitHub Pages deployment on push
Pushing to `main` SHALL trigger a GitHub Actions workflow that installs dependencies, runs the test suite, builds the production bundle, and publishes it to GitHub Pages using the official Pages actions. The deployed app SHALL be served with an asset base path matching the repository name.

#### Scenario: Push publishes the app
- **WHEN** a commit is pushed to main and the workflow succeeds
- **THEN** the current build is live at the GitHub Pages URL with all assets loading correctly

#### Scenario: Failing tests block deployment
- **WHEN** the test suite fails in the workflow
- **THEN** nothing is published and the previously deployed version remains live
