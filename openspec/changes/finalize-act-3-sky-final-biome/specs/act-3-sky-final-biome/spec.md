# act-3-sky-final-biome Specification

## ADDED Requirements

### Requirement: Skyforge Spires Requires Both Intermediate Signals

Skyforge Spires SHALL stay locked until both Tidefall Coast and Granite Ridge have
contributed their completion signals.

#### Scenario: Final region is missing one intermediate token

- **GIVEN** either `tide-signal` or `forge-signal` is missing
- **WHEN** the Skyforge Spires gate is evaluated
- **THEN** the final region MUST remain locked
- **AND** feedback MUST name the missing macro-biome goal.

#### Scenario: Final region opens

- **GIVEN** both `tide-signal` and `forge-signal` are present
- **WHEN** final-region gates are evaluated
- **THEN** Skyforge Spires MAY become available
- **AND** the gate MUST be owned by the Scenario System.

### Requirement: Late Traversal Progression Is Explicit

Skyforge Spires SHALL use platform/lift and late traversal progression through
explicit quest state or scenario gates, not implicit camera or input changes.

#### Scenario: Platform progression starts

- **GIVEN** the player enters Skyforge Spires
- **WHEN** Aero introduces the traversal problem
- **THEN** platform or lift progression MUST become available through scenario or
  quest state
- **AND** UI feedback MUST name the next traversal requirement.

#### Scenario: Late traversal ability unlocks

- **GIVEN** the player completes the required traversal mentor step
- **WHEN** the late traversal ability reward is granted
- **THEN** the ability MUST record source, use case, controls hint and validation
  target
- **AND** repeated reward interactions MUST NOT duplicate flags or rewards.

### Requirement: Beacon Repair Is Staged

The final large-building repair SHALL have explicit stages with requirements,
helper dependencies and visible progress.

#### Scenario: Stage 1 repair is inspected

- **GIVEN** the player reaches the beacon repair
- **WHEN** stage 1 requirements are inspected
- **THEN** the game MUST list required materials, helpers and completion reward
- **AND** missing requirements MUST be presented without advancing quest state.

#### Scenario: Intermediate repair stage completes

- **GIVEN** a beacon repair stage has all requirements
- **WHEN** the player confirms the stage repair
- **THEN** materials and helper contributions MUST be consumed or recorded once
- **AND** the next beacon stage MUST become available through quest state.

#### Scenario: Final repair stage completes

- **GIVEN** all beacon repair stages are complete
- **WHEN** Tova confirms the final repair
- **THEN** the final-region completion flag MUST be set once
- **AND** `sky-signal` MUST become available for credits readiness.

### Requirement: Return Gate Unlocks After Final Region Completion

Completing Skyforge Spires SHALL unlock a return path without resetting final-region
progress.

#### Scenario: Return gate opens

- **GIVEN** the final-region completion flag or `sky-signal` is present
- **WHEN** return gates are evaluated
- **THEN** the return route MUST become available
- **AND** revisiting Skyforge Spires MUST preserve completed repair stages.

### Requirement: High-Risk Systems Stay Out Of This Slice

This slice SHALL not change camera, stage, render frame, input ownership, scene
flow or runtime boot.

#### Scenario: Sky/final work appears to need high-risk changes

- **GIVEN** a final-region requirement appears to need high-risk traversal, camera,
  stage, render-frame or scene-flow changes
- **WHEN** the implementation scope is reviewed
- **THEN** that high-risk work MUST be split into a separate spec
- **AND** this slice MUST remain focused on scenario gates, quest state, repair
  catalogs, presenters, ability definitions and focused tests.
