# act-2b-ridge-crafting-biome Specification

## ADDED Requirements

### Requirement: Granite Ridge Entry Uses Scenario Gates

Granite Ridge SHALL open only after the starting macro-biome completion handoff is
available, and it SHALL remain parallel with Tidefall Coast.

#### Scenario: Ridge route is still locked

- **GIVEN** the player has not completed the starting macro-biome repair handoff
- **WHEN** the Granite Ridge route gate is evaluated
- **THEN** the route MUST remain locked or blocked with a clear hint
- **AND** the gate MUST be owned by the Scenario System.

#### Scenario: Ridge route opens in parallel

- **GIVEN** the starting macro-biome completion handoff is present
- **WHEN** intermediate route gates are evaluated
- **THEN** Granite Ridge MAY become available
- **AND** Tidefall Coast MUST NOT be made unavailable by choosing Granite Ridge.

### Requirement: Ridge Progress Has Explicit Crafting And Rescue Steps

Granite Ridge SHALL expose progress for heavy-object work, specialist rescue and
crafting/cooking mastery.

#### Scenario: Specialist rescue starts

- **GIVEN** the player reaches the local ridge problem
- **WHEN** Mica's rescue chain becomes available
- **THEN** quest state MUST expose the rescue objective, required action and reward
- **AND** UI feedback MUST name the current rescue or material target.

#### Scenario: Crafting mastery progresses

- **GIVEN** the player crafts, cooks or processes a required ridge material
- **WHEN** the action is accepted
- **THEN** crafting progress MUST update through quest state or explicit events
- **AND** repeated actions MUST NOT double-count completion.

### Requirement: Powered-Up Action Opens Ridge Progression

The ridge ability slot SHALL solve a visible heavy-object, hard-rock or advanced
traversal problem before becoming a general tool.

#### Scenario: Ridge ability unlocks

- **GIVEN** the player completes the required specialist, crafting or rescue step
- **WHEN** the ability reward is granted
- **THEN** the ability MUST record source, use case, controls hint and validation
  target
- **AND** the request log or equivalent UI MUST explain the next useful blocker.

#### Scenario: Ability-gated blocker explains missing ability

- **GIVEN** the player reaches a ridge blocker before unlocking the local ability
- **WHEN** the player attempts the blocker
- **THEN** the game MUST show a short hint pointing toward the relevant local
  request
- **AND** quest state MUST remain unchanged.

### Requirement: Celebration Converts Repair Into Community Proof

Granite Ridge SHALL complete through a celebration or mood goal that proves crafting
restores community, not only routes.

#### Scenario: Celebration progress starts

- **GIVEN** the specialist rescue and core material steps are complete
- **WHEN** Riff introduces the celebration goal
- **THEN** a celebration/mood request MUST become available
- **AND** required party materials or crafted items MUST be explicit.

#### Scenario: Celebration completes

- **GIVEN** celebration requirements are complete
- **WHEN** the player confirms or witnesses the celebration
- **THEN** the region completion flag MUST be set once
- **AND** `forge-signal` MUST become available for final-biome gate checks.

### Requirement: Final Biome Still Requires Both Intermediate Tokens

Completing Granite Ridge SHALL grant `forge-signal` without bypassing Tidefall Coast.

#### Scenario: Final biome still needs Tidefall Coast

- **GIVEN** `forge-signal` is present but `tide-signal` is missing
- **WHEN** the final biome gate is evaluated
- **THEN** the final biome MUST remain locked
- **AND** feedback MUST name Tidefall Coast as the missing macro-biome goal.

### Requirement: High-Risk Systems Stay Out Of This Slice

This slice SHALL not change camera, stage, render frame, input ownership, scene
flow or runtime boot.

#### Scenario: Ridge/crafting work appears to need high-risk changes

- **GIVEN** a Granite Ridge requirement appears to need high-risk system changes
- **WHEN** the implementation scope is reviewed
- **THEN** the high-risk work MUST be split into a separate spec
- **AND** this slice MUST remain focused on scenario gates, quest state, material
  catalogs, world/action handlers, presenters, strategies and focused tests.
