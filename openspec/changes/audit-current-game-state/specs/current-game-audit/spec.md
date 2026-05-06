# current-game-audit Specification

## ADDED Requirements

### Requirement: Audit Is Documentation Only

The current-game audit SHALL describe existing systems without changing runtime
behavior, gameplay content, tests, rendering, input, camera, stage or scene flow.

#### Scenario: Audit is created

- **GIVEN** the audit change is added
- **WHEN** the repository diff is reviewed
- **THEN** only OpenSpec audit documentation is changed
- **AND** no gameplay source file is modified by this change.

### Requirement: Current Content Inventory Is Recorded

The audit SHALL record the current known inventory of implemented and planned
content before new final-game content is added.

#### Scenario: Content counts are listed

- **GIVEN** the current exported catalogs are inspected
- **WHEN** the audit summarizes them
- **THEN** it records counts for story quests, item definitions, recipes, world
  regions, NPCs, interactables, resource nodes, dynamic barriers, habitats and
  moves
- **AND** it distinguishes active habitat and move entries from planned entries.

### Requirement: Ownership Boundaries Are Identified

The audit SHALL identify the likely owner systems for story state, quest data,
habitats, moves, flow, UI, input, rendering and runtime interaction behavior.

#### Scenario: Future task chooses an implementation owner

- **GIVEN** a future final-game task needs to add content
- **WHEN** the task is scoped
- **THEN** it can reference the audit to choose a primary owner system
- **AND** it does not need to inspect the whole project first.

### Requirement: Existing Behavior Is Preserved By Default

The audit SHALL treat implemented behavior as a contract unless a future spec
explicitly changes it.

#### Scenario: Future content slice is planned

- **GIVEN** an existing quest, flag, input, scene, render or UI behavior already
  has passing coverage
- **WHEN** a future implementation slice touches nearby code
- **THEN** the slice MUST name the regression guard before editing
- **AND** it MUST use TDD with a focused failing test before implementation.

### Requirement: High-Risk Systems Are Separated

The audit SHALL mark camera, render frame, stage, input, scene flow and broad
runtime interaction changes as high risk.

#### Scenario: Content work wants to touch a high-risk system

- **GIVEN** a future task is primarily about quests, characters, recipes, habitats
  or story content
- **WHEN** that task appears to require camera, render frame, stage, input, scene
  flow or broad runtime changes
- **THEN** the work MUST be split into a separate high-risk spec
- **AND** the content task MUST remain data-first where possible.

### Requirement: Audit Feeds The Final-Game Roadmap

The audit SHALL identify the next safe slices needed to finish the game without
breaking implemented systems.

#### Scenario: Next step is selected

- **GIVEN** the audit has identified current content shape and risks
- **WHEN** roadmap work continues
- **THEN** the next task SHOULD be a small data/spec slice such as story bible,
  biome progression model, request taxonomy or recipe taxonomy
- **AND** implementation of final playable content SHOULD wait until those
  contracts are testable.
