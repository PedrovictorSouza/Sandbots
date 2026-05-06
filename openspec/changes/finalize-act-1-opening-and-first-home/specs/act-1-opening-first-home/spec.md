# act-1-opening-first-home Specification

## ADDED Requirements

### Requirement: Opening Path Has Stable Progression

The Act 1 opening path SHALL move from first control to first home/den through
explicit quest-state transitions.

#### Scenario: Player begins the final opening

- **GIVEN** a new game starts in the Act 1 opening path
- **WHEN** the player completes the first movement/control objective
- **THEN** the mentor interaction MUST become available through quest state
- **AND** input handlers MUST NOT set story flags directly.

#### Scenario: Mentor requests first restoration

- **GIVEN** the mentor has introduced the island problem
- **WHEN** the player accepts the first restoration objective
- **THEN** the quest state MUST identify the target habitat, required action and
  next mentor reminder
- **AND** the UI presenter MUST render that guidance from state.

### Requirement: First Ability Unlock Is Protected

The first required ability SHALL have one grant source, one controls hint and a
duplicate reward guard.

#### Scenario: First ability unlocks

- **GIVEN** the player completes the required mentor or companion step
- **WHEN** the ability reward is granted
- **THEN** the ability MUST become available once
- **AND** the request log or equivalent UI MUST show how to use it.

#### Scenario: Ability reward is revisited

- **GIVEN** the first ability is already unlocked
- **WHEN** the player repeats the rewarding interaction
- **THEN** the game MUST preserve the unlocked state
- **AND** it MUST NOT duplicate rewards, flags or completion events.

### Requirement: First Habitat Reveals First Companion

The first restored habitat SHALL be the proof that restoration attracts helpers.

#### Scenario: First habitat is restored

- **GIVEN** the player completes the first restoration objective
- **WHEN** the habitat discovery event resolves
- **THEN** the first companion MUST become available through cataloged spawn or
  discovery data
- **AND** a companion request MUST appear in the request log.

### Requirement: First Home Uses Starter Crafting

The first home/den objective SHALL use starter materials, a simple recipe and a
placeable object without requiring broad crafting or economy changes.

#### Scenario: First recipe unlocks

- **GIVEN** the player reaches the first home/den step
- **WHEN** the workbench or recipe source is available
- **THEN** the starter recipe MUST be unlockable with natural Act 1 materials
- **AND** missing-material feedback MUST come from UI presenter state.

#### Scenario: First placeable completes home objective

- **GIVEN** the player crafts or receives the first required placeable
- **WHEN** it is placed in the valid home/den target
- **THEN** the home objective MUST complete once
- **AND** the Act 1 celebration beat MUST become available.

### Requirement: High-Risk Systems Stay Out Of This Slice

This slice SHALL not change camera, stage, render frame, input ownership, scene
flow or runtime boot.

#### Scenario: Implementation appears to need high-risk changes

- **GIVEN** an opening or first-home requirement appears to need high-risk system
  changes
- **WHEN** the implementation scope is reviewed
- **THEN** the high-risk work MUST be split into a separate spec
- **AND** this slice MUST remain focused on quest state, catalog data, presenters
  and focused tests.
