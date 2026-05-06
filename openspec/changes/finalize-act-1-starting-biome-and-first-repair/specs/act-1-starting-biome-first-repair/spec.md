# act-1-starting-biome-first-repair Specification

## ADDED Requirements

### Requirement: Shared Hub Discovery Starts The Repair Chain

The starting macro-biome SHALL expose a damaged shared hub or center before the
larger route network opens.

#### Scenario: Player discovers the damaged hub

- **GIVEN** the player has completed the opening and first-home slice
- **WHEN** the player reaches or inspects the damaged shared hub
- **THEN** an Act 1 important request MUST become available through quest state
- **AND** the request log or equivalent UI MUST describe why the hub matters.

#### Scenario: Request board becomes available

- **GIVEN** the damaged hub has been discovered
- **WHEN** the story state marks the hub as known
- **THEN** the challenge/request board equivalent MUST become visible or usable
- **AND** it MUST NOT unlock later macro-biome routes by itself.

### Requirement: Hub Repair Has A Material Contract

The first shared hub repair SHALL list required materials, helper roles and exact
completion effects before implementation.

#### Scenario: Repair requirements are displayed

- **GIVEN** the player inspects the damaged hub repair
- **WHEN** required materials are missing
- **THEN** UI presenter text MUST name the missing material requirements
- **AND** quest state MUST remain unchanged.

#### Scenario: Materials are turned in

- **GIVEN** the player has enough required materials
- **WHEN** the player confirms the repair turn-in
- **THEN** required materials MUST be consumed exactly once
- **AND** the repair progress or completion flag MUST update through quest state.

### Requirement: Helper Request Supports Community Repair

The first helper-character request SHALL teach that the hub repair is coordinated
community work.

#### Scenario: Helper request unlocks

- **GIVEN** the damaged hub repair requires helper contribution
- **WHEN** the player reaches the relevant repair step
- **THEN** the helper request MUST become available through request taxonomy data
- **AND** the helper reward or conversion MUST be explicit before turn-in.

### Requirement: Repaired Hub Opens The Larger Journey

Completing the first shared hub repair SHALL grant the starting-biome completion
handoff and unlock the next route choice through scenario gates.

#### Scenario: Hub repair completes

- **GIVEN** all required repair materials and helper steps are complete
- **WHEN** the player confirms or witnesses the final repair
- **THEN** the game MUST set the hub repair completion flag once
- **AND** NPC dialogue MUST reflect the repaired shared space.

#### Scenario: Next routes unlock

- **GIVEN** the hub repair completion flag or `root-signal` equivalent is present
- **WHEN** scenario gates evaluate the next route network
- **THEN** Tidefall Coast and Granite Ridge routes MAY become available
- **AND** gate availability MUST be owned by the Scenario System, not input handlers.

### Requirement: High-Risk Systems Stay Out Of This Slice

This slice SHALL not change camera, stage, render frame, input ownership, scene
flow or runtime boot.

#### Scenario: Repair implementation appears to need high-risk changes

- **GIVEN** a hub repair requirement appears to need high-risk system changes
- **WHEN** the implementation scope is reviewed
- **THEN** the high-risk work MUST be split into a separate spec
- **AND** this slice MUST remain focused on quest state, repair/material catalogs,
  presenters, scenario gate data and focused tests.
