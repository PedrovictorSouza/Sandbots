# act-2a-water-beach-biome Specification

## ADDED Requirements

### Requirement: Tidefall Coast Entry Uses Scenario Gates

Tidefall Coast SHALL open only after the starting macro-biome completion handoff is
available, and it SHALL remain parallel with Granite Ridge.

#### Scenario: Coast route is still locked

- **GIVEN** the player has not completed the starting macro-biome repair handoff
- **WHEN** the Tidefall Coast route gate is evaluated
- **THEN** the route MUST remain locked or blocked with a clear hint
- **AND** the gate MUST be owned by the Scenario System.

#### Scenario: Coast route opens in parallel

- **GIVEN** the starting macro-biome completion handoff is present
- **WHEN** intermediate route gates are evaluated
- **THEN** Tidefall Coast MAY become available
- **AND** Granite Ridge MUST NOT be made unavailable by choosing Tidefall Coast.

### Requirement: Coast Cleanup Has Explicit Progress

Tidefall Coast SHALL expose cleanup progress for blocked flow, flooded spaces or
dim infrastructure.

#### Scenario: Cleanup request starts

- **GIVEN** the player reaches the local guide beat
- **WHEN** Nami introduces the regional problem
- **THEN** a cleanup or environmental restoration request MUST become available
  through quest state
- **AND** UI feedback MUST name the current cleanup target.

#### Scenario: Cleanup progress updates

- **GIVEN** the player clears a flood, blockage, broken bridge or light/energy target
- **WHEN** the action is accepted
- **THEN** cleanup progress MUST update through quest state or explicit events
- **AND** repeated actions MUST NOT double-count completion.

### Requirement: Local Ability Opens Water/Beach Progression

The water/beach ability slot SHALL solve a visible local problem before becoming a
general tool.

#### Scenario: Local ability unlocks

- **GIVEN** the player completes the required local guide or cleanup step
- **WHEN** the ability reward is granted
- **THEN** the ability MUST record source, use case, controls hint and validation
  target
- **AND** the request log or equivalent UI MUST explain the next useful target.

#### Scenario: Ability-gated obstacle explains missing ability

- **GIVEN** the player reaches a water/beach obstacle before unlocking the local
  ability
- **WHEN** the player attempts the obstacle
- **THEN** the game MUST show a short hint pointing toward the relevant local
  request
- **AND** quest state MUST remain unchanged.

### Requirement: Tidefall Completion Grants Final-Biome Token

Completing Tidefall Coast SHALL grant `tide-signal` and contribute to final-biome
readiness without blocking Granite Ridge.

#### Scenario: Major restoration completes

- **GIVEN** all required Tidefall Coast cleanup, infrastructure and local character
  steps are complete
- **WHEN** the major regional request completes
- **THEN** the region completion flag MUST be set once
- **AND** `tide-signal` MUST become available for final-biome gate checks.

#### Scenario: Final biome still needs both intermediate tokens

- **GIVEN** `tide-signal` is present but `forge-signal` is missing
- **WHEN** the final biome gate is evaluated
- **THEN** the final biome MUST remain locked
- **AND** feedback MUST name Granite Ridge as the missing macro-biome goal.

### Requirement: High-Risk Systems Stay Out Of This Slice

This slice SHALL not change camera, stage, render frame, input ownership, scene
flow or runtime boot.

#### Scenario: Water/beach work appears to need high-risk changes

- **GIVEN** a Tidefall Coast requirement appears to need high-risk system changes
- **WHEN** the implementation scope is reviewed
- **THEN** the high-risk work MUST be split into a separate spec
- **AND** this slice MUST remain focused on scenario gates, quest state, catalog
  data, presenters, explicit events and focused tests.
