# release-readiness Specification

## ADDED Requirements

### Requirement: Release Readiness Runs Focused Story Checks

The final release pass SHALL run focused checks for required story progression
before broad smoke checks are treated as sufficient.

#### Scenario: Story systems are verified

- **GIVEN** all final-game implementation slices have landed
- **WHEN** release readiness begins
- **THEN** focused tests MUST cover final story data, required quest progression,
  reward and ability unlocks, required habitat discovery, inventory/material
  turn-ins and final completion.

### Requirement: Architecture Graph Remains Acyclic

The final release pass SHALL run the architecture graph and reject new directed
cycles unless a separate high-risk spec explicitly justifies them.

#### Scenario: Architecture graph is reviewed

- **GIVEN** final implementation has changed source files
- **WHEN** `npm run architecture:graph` is run
- **THEN** the report MUST show no new directed cycles
- **AND** hub-risk findings MUST be reviewed for ownership drift.

### Requirement: Build Passes Before Visual Smoke

The final release pass SHALL run build before visual/browser smoke.

#### Scenario: Build is checked

- **GIVEN** focused tests and graph checks have passed
- **WHEN** build runs
- **THEN** the build MUST complete successfully
- **AND** asset or bundling regressions MUST be fixed in their owning slice before
  release readiness continues.

### Requirement: Visual Smoke Covers Playable Route

The final release pass SHALL visually smoke the playable route when a dev server is
needed for the app.

#### Scenario: Browser smoke is run

- **GIVEN** the game needs a dev server for visual verification
- **WHEN** browser smoke runs
- **THEN** the opening route, core HUD/request-log surfaces and world render MUST
  appear without obvious blank screens or text overlap
- **AND** final completion scripted state MUST be able to reach post-story sandbox.

### Requirement: Story And Architecture Reviews Are Final Gates

The final release pass SHALL review narrative and architecture consistency after
tests/build pass.

#### Scenario: Final review finds drift

- **GIVEN** the story bible or architecture pattern map no longer matches the
  implemented game
- **WHEN** release readiness is reviewed
- **THEN** the mismatch MUST be fixed in the smallest owning OpenSpec slice
- **AND** release readiness MUST remain incomplete until the fix is verified.

### Requirement: Release Readiness Does Not Add Features

Release readiness SHALL be a verification gate, not an implementation bucket.

#### Scenario: Missing feature is discovered

- **GIVEN** a release check reveals missing gameplay, content, UI or story behavior
- **WHEN** the issue is triaged
- **THEN** the work MUST be split back into the smallest owning implementation
  slice
- **AND** release readiness MUST only record the failing check and eventual passing
  verification.
