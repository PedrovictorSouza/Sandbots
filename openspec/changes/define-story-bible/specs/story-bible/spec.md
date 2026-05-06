# story-bible Specification

## ADDED Requirements

### Requirement: Story Uses Four Macro-Biomes

The final campaign SHALL use exactly four player-facing macro-biomes.

#### Scenario: Macro-biome ids are reviewed

- **GIVEN** the story bible is accepted
- **WHEN** a future implementation defines player-facing biome data
- **THEN** it MUST include `ash-wilds`, `tidefall-coast`, `granite-ridge` and
  `skyforge-spires`
- **AND** it MUST NOT add additional top-level macro-biomes without a new spec.

### Requirement: Campaign Has Beginning Middle End And Post-Story

The story bible SHALL define a complete campaign arc that can end in credits while
leaving the sandbox playable afterward.

#### Scenario: Required campaign path is inspected

- **GIVEN** the campaign path is reviewed
- **WHEN** the required macro-biome sequence is traced
- **THEN** `ash-wilds` MUST teach restoration, habitats, requests, crafting, home
  building and first hub repair
- **AND** `tidefall-coast` and `granite-ridge` MUST be completable as intermediate
  macro-biomes
- **AND** `skyforge-spires` MUST require both intermediate completion tokens before
  final repair and credits.

### Requirement: Required Characters Have Story Roles

Every required character SHALL have a narrative role, macro-biome connection and
progression contribution before implementation.

#### Scenario: Character is promoted into required content

- **GIVEN** a character appears in a required quest or required macro-biome gate
- **WHEN** the character is reviewed
- **THEN** the story bible or owning spec MUST define their target name, story role,
  macro-biome, progression contribution and completion payoff.

### Requirement: Completion Tokens Represent Story Payoff

Macro-biome completion tokens SHALL represent story resolution, not only technical
flags.

#### Scenario: Macro-biome completion token is granted

- **GIVEN** a required macro-biome major goal is completed
- **WHEN** the completion token is granted
- **THEN** the world, dialogue, UI or route guidance MUST reflect why that
  macro-biome is repaired enough to contribute to the ending.

### Requirement: Reference Material Is Structure Only

Reference-game material SHALL be used only for structural planning.

#### Scenario: New final content is authored

- **GIVEN** a future task adds names, dialogue, quest text, character identity,
  location labels or item labels
- **WHEN** the content is reviewed
- **THEN** it MUST be original to this project
- **AND** it MUST NOT copy reference-game names, exact request names, dialogue or
  character identities.

### Requirement: Existing Provisional Content Is Migrated Safely

Existing provisional source names and story labels SHALL remain untouched until a
dedicated migration spec protects behavior with tests.

#### Scenario: Provisional name should become final

- **GIVEN** existing code contains a provisional or reference-like source-facing
  name
- **WHEN** future work wants to replace it
- **THEN** the work MUST be scoped as a migration
- **AND** it MUST preserve existing gameplay behavior through focused tests
- **AND** it MUST avoid broad runtime, camera, input, render frame, stage or
  scene-flow changes.

### Requirement: Future Slices Maintain Story Context

Every future final-game implementation slice SHALL update story context.

#### Scenario: Quest or content slice is implemented

- **GIVEN** a future task adds or changes required gameplay content
- **WHEN** that task is completed
- **THEN** its tasks or documentation MUST state which macro-biome, character arc,
  story problem and ending payoff it supports.
