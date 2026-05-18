# game-design-integrity Specification

## Purpose
TBD - created by archiving change reframe-game-cohesive-story. Update Purpose after archive.
## Requirements
### Requirement: Existing Game Design Progress Must Be Preserved

The reframe MUST build on existing design progress instead of discarding it
without reason.

#### Scenario: Existing system is working

- **GIVEN** an existing scene, HUD, dialogue, camera, movement, asset-loading,
  grid or tutorial system works
- **WHEN** the reframe is implemented
- **THEN** the system SHOULD be preserved
- **AND** improved only where it supports the new cohesive direction.

#### Scenario: Existing system conflicts with the new story

- **GIVEN** an existing system uses old terminology or external-IP-inspired names
- **WHEN** the system still provides useful game design value
- **THEN** the implementation MUST rename or recontextualize it
- **AND** MUST NOT remove it just because the old name is wrong.

### Requirement: Reframe Must Improve Player Orientation

The player MUST better understand what is happening, what they can do and why
their actions matter.

#### Scenario: Player receives the first objective

- **GIVEN** the player receives the first objective
- **WHEN** the objective is displayed
- **THEN** it MUST connect to the premise
- **AND** it MUST use visible or introduced objects
- **AND** it MUST teach one clear interaction.

#### Scenario: Player completes an objective

- **GIVEN** the player completes an objective
- **WHEN** the next objective appears
- **THEN** the transition MUST explain the consequence of the completed action
- **AND** the next objective MUST feel earned, not random.

### Requirement: Cinematic Presentation Must Support Gameplay

Camera movement, dialogue timing, character movement and cinematic beats MUST
support comprehension of the story and objectives.

#### Scenario: Cinematic introduces a task

- **GIVEN** a cinematic sequence introduces a new task
- **WHEN** the camera, character or dialogue focuses on an object
- **THEN** that object SHOULD be relevant to the next player action
- **AND** the camera SHOULD help the player understand where to go or what to use.

### Requirement: The Game Must Feel Like One Original Product

The final result MUST feel like a cohesive original game rather than a collection
of unrelated prototypes or generated fragments.

#### Scenario: Player experiences the first playable arc

- **GIVEN** the player plays through the first sequence
- **WHEN** they complete the initial tutorial/progression arc
- **THEN** the story, mechanics, UI, objects, dialogue and visual direction MUST
  feel internally consistent
- **AND** the game MUST not appear to borrow from Pokemon or another recognizable
  external franchise.
