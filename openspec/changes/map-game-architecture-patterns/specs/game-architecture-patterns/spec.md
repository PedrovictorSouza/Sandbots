# game-architecture-patterns Specification

## ADDED Requirements

### Requirement: Systems Have Explicit Ownership

Future implementation slices SHALL identify the owning system before editing code.

#### Scenario: Content slice is planned

- **GIVEN** a future task adds a quest, recipe, biome, character, habitat or move
- **WHEN** implementation is planned
- **THEN** the task MUST name the owning system and pattern
- **AND** it MUST avoid unrelated systems.

### Requirement: Content Uses Flyweight Catalogs First

Content definitions SHALL prefer immutable data catalogs before runtime logic.

#### Scenario: New content is added

- **GIVEN** a new request, recipe, biome, character arc, habitat or placeholder is
  introduced
- **WHEN** a data catalog can express it
- **THEN** the content SHOULD be added as immutable catalog data with focused tests.

### Requirement: High-Risk Systems Require Separate Specs

Camera, render frame, stage, input, scene flow, runtime boot and broad game loop
changes SHALL be treated as high risk.

#### Scenario: Content task needs high-risk changes

- **GIVEN** a content-focused task appears to require a high-risk system change
- **WHEN** the implementation scope is reviewed
- **THEN** the work MUST be split into a separate high-risk spec
- **AND** the content slice MUST remain data-first where possible.

### Requirement: UI Presentation Does Not Own Rules

UI presenters SHALL derive visible state from gameplay state but not own progression
rules.

#### Scenario: Request log displays progress

- **GIVEN** the request log displays active, completed or missing goals
- **WHEN** the user opens the UI
- **THEN** the UI MUST read quest/scenario state
- **AND** it MUST NOT mutate completion, rewards or route gates.
