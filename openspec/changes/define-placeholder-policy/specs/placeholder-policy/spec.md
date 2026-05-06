# placeholder-policy Specification

## ADDED Requirements

### Requirement: Placeholders Have Explicit Lifecycle State

Every placeholder introduced by future work SHALL declare a lifecycle state before it
is used by gameplay, UI, tests or content data.

Allowed states are `planned`, `prototype`, `stub`, `temporary-art` and `final`.

#### Scenario: Planned content is cataloged

- **GIVEN** a future quest, item, recipe, habitat, move, character or asset is known
  but not playable
- **WHEN** it is added to a catalog
- **THEN** it MUST be marked as `planned`
- **AND** it MUST NOT be required for credits, macro-biome completion or required
  route unlocks.

#### Scenario: Prototype content is temporarily playable

- **GIVEN** a placeholder is used to validate a playable loop
- **WHEN** it can affect quest progress, rewards, gates or completion flags
- **THEN** it MUST be marked as `prototype`
- **AND** its owning spec MUST explicitly allow the progression impact
- **AND** focused tests MUST cover that impact.

### Requirement: Placeholders Have Replacement Metadata

Every placeholder SHALL record why it exists, who owns it and what must happen before
it can be considered final.

#### Scenario: Placeholder is reviewed

- **GIVEN** a placeholder appears in a content catalog or asset registry
- **WHEN** a developer reviews it
- **THEN** they MUST be able to identify its stable id, owner system, purpose,
  replacement condition, player visibility and progression impact.

### Requirement: Planned Placeholders Do Not Block Required Progress

Planned placeholders SHALL be excluded from required progression until a later spec
promotes them to prototype or final content.

#### Scenario: Credits gate evaluates required work

- **GIVEN** the credits or final-biome gate checks required completion
- **WHEN** planned quests, planned habitats, planned moves, planned recipes or
  planned characters exist
- **THEN** those planned entries MUST NOT count as missing required work
- **AND** the player MUST still be able to complete the required path.

### Requirement: Player-Facing UI Separates Available And Planned Content

UI that exposes catalogs SHALL distinguish available playable content from planned
or placeholder content.

#### Scenario: Request or codex UI lists content

- **GIVEN** a catalog contains both active and planned entries
- **WHEN** the player opens the relevant UI
- **THEN** active/playable entries MAY be shown as actionable
- **AND** planned entries MUST NOT be shown as actionable unless a debug or design
  mode explicitly opts in.

### Requirement: Temporary Assets Are Isolated

Temporary art, audio or model placeholders SHALL be replaceable without changing
camera, input, render frame, stage, scene-flow or unrelated gameplay systems.

#### Scenario: Temporary model is replaced

- **GIVEN** a required character or object uses a temporary asset
- **WHEN** the final asset is integrated
- **THEN** the replacement SHOULD be limited to data, asset path or local model
  orientation metadata
- **AND** any required yaw/orientation offset MUST be explicit and local to that
  asset.

### Requirement: Placeholder Promotion Uses TDD

Promoting a placeholder into required playable content SHALL use TDD.

#### Scenario: Placeholder becomes required

- **GIVEN** a planned or prototype placeholder is promoted into required progression
- **WHEN** implementation begins
- **THEN** a focused failing test MUST be added or updated first
- **AND** the implementation MUST make that test pass with the smallest scoped
  change
- **AND** the owning task MUST document the regression guard.
