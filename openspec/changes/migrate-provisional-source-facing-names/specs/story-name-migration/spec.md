# story-name-migration Specification

## ADDED Requirements

### Requirement: Provisional Names Are Inventoried Before Rename

Every migration from provisional source-facing names to final story names SHALL
start with a targeted inventory.

#### Scenario: Naming migration is planned

- **GIVEN** existing code, tests or content contain a provisional name
- **WHEN** a future task proposes a final replacement
- **THEN** the task MUST list each affected source id, display label, dialogue
  string, quest title, item name, recipe name, asset-facing name and test fixture
- **AND** it MUST classify each affected entry as player-facing copy, stable source
  id, save-facing id, asset reference or test fixture.

### Requirement: Copy Changes Are Separate From Stable Id Changes

Player-facing copy migrations SHALL be scoped separately from stable source id or
save-facing id migrations unless a dedicated compatibility plan exists.

#### Scenario: Display label can change without changing ids

- **GIVEN** a provisional player-facing label has a final replacement
- **WHEN** the source id does not need to change for gameplay
- **THEN** the migration SHOULD change only display copy
- **AND** stable ids SHOULD remain unchanged.

#### Scenario: Stable id must change

- **GIVEN** a stable source id or save-facing id must be replaced
- **WHEN** the migration is implemented
- **THEN** the task MUST document the old id, new id, compatibility plan and
  rollback risk
- **AND** focused tests MUST prove existing behavior or saved state compatibility.

### Requirement: Naming Migrations Preserve Gameplay Behavior

Naming migrations SHALL preserve existing behavior and avoid high-risk systems.

#### Scenario: Migration is implemented

- **GIVEN** a naming migration changes copy, ids or references
- **WHEN** the migration is validated
- **THEN** focused tests MUST show quest availability, rewards, completion flags,
  inventory behavior and route gates still behave as before
- **AND** the migration MUST NOT change camera, input, render frame, stage, scene
  flow or broad runtime orchestration.

### Requirement: Naming Migration Does Not Add Final Content

Naming migrations SHALL not be combined with final quest, NPC, recipe, biome,
ability or ending implementation.

#### Scenario: Final content is needed during rename

- **GIVEN** a rename reveals missing final content
- **WHEN** the migration scope is reviewed
- **THEN** final content MUST be split into its own implementation spec
- **AND** the naming migration MUST remain behavior-preserving.
