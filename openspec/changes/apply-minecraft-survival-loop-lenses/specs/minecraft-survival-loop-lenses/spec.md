# minecraft-survival-loop-lenses Specification

## ADDED Requirements

### Requirement: Early Game Systems Must Express Colony State

The early game SHALL communicate the condition of the colony and planet through
status, world feedback and interactions, not only through quest text.

#### Scenario: Player checks the HUD during early gameplay

- **GIVEN** the player is in the first playable colony area
- **WHEN** the HUD is visible
- **THEN** it SHOULD expose useful colony state such as power, water, soil,
  shelter, active tool or active bot when those values are available
- **AND** it MUST NOT duplicate the same quest title as both title and subtitle
  unless the subtitle provides new actionable guidance.

### Requirement: Early Resources Must Have Visible Purpose

Required early resources SHALL clearly connect to tools, repairs, construction,
restoration, storage or colony comfort.

#### Scenario: Player collects an early required resource

- **GIVEN** the player collects a resource during the first playable arc
- **WHEN** the resource is shown in inventory, HUD, dialogue or workbench UI
- **THEN** the game SHOULD make its near-term purpose understandable
- **AND** the resource MUST NOT exist only as filler pickup for a disconnected
  objective.

### Requirement: The Base Must Protect Progress

The starting base SHALL become a practical safe point for gathered progress.

#### Scenario: Player returns to the base with materials

- **GIVEN** the player has gathered early materials
- **WHEN** they return to the base
- **THEN** there SHOULD be a clear way to understand those materials as colony
  supplies or protected progress
- **AND** required story items MUST NOT be accidentally consumed by storage or
  cache interactions.

### Requirement: Exploration Must Be Prepared And Oriented

Short expeditions SHALL give the player a reason to prepare and a way to return
without relying on abstract text alone.

#### Scenario: Player leaves the starting base

- **GIVEN** the player starts a short expedition from the base
- **WHEN** the objective points away from the base
- **THEN** the game SHOULD provide readable landmarks, route cues, bot support,
  tool readiness or return support
- **AND** the expedition SHOULD produce more than one useful discovery when it
  is intended to teach exploration.

### Requirement: Building Site Choice Must Be Legible

Important first constructions SHALL communicate why a site is valid, invalid,
good or poor.

#### Scenario: Player previews the first habitat placement

- **GIVEN** the player has a required early habitat or shelter kit selected
- **WHEN** the placement preview is active
- **THEN** the game SHOULD show at least one placement reason such as powered,
  clear, stable, expandable or near restored soil
- **AND** confirming placement MUST consume the kit only after valid placement
- **AND** canceling placement MUST preserve the kit.

### Requirement: Workbench Categories Must Teach World Structure

The workbench SHALL organize early buildable objects by Sandbots colony systems
instead of presenting them as a disconnected item list.

#### Scenario: Player opens the workbench

- **GIVEN** buildable items or protocols are available
- **WHEN** the workbench UI is shown
- **THEN** entries SHOULD be groupable by categories such as Power, Water, Soil,
  Shelter, Bots, Tools and Materials
- **AND** player-facing copy MUST use colony protocol language rather than shop,
  buy or currency language.

### Requirement: Minecraft References Are Design Lenses, Not Source Content

Minecraft-derived tasks SHALL be translated into Sandbots' colony-restoration
world and MUST NOT copy franchise-specific mechanics without need.

#### Scenario: A task is added from this reading backlog

- **GIVEN** a future implementation task cites the Minecraft PDF reading
- **WHEN** the task is implemented
- **THEN** it MUST state the Sandbots translation of the pattern
- **AND** it MUST NOT add hunger, hostile mobs, beds, torches, mining layers or
  Minecraft-specific construction unless separately justified by Sandbots'
  design.

### Requirement: Progression Milestones Should Be Trigger-Backed

Progression milestones SHALL be connected to explicit runtime events instead of
being scattered across dialogue, HUD or one-off interaction branches.

#### Scenario: A colony milestone is completed

- **GIVEN** a milestone depends on a player action such as unlocking a tool,
  placing a kit, restoring soil, waking a bot or logging terminal viability
- **WHEN** the runtime event occurs
- **THEN** the milestone SHOULD be completed by a clear trigger contract
- **AND** completion SHOULD happen exactly once
- **AND** the HUD/dialogue layer SHOULD read the result rather than owning the
  progression mutation.

### Requirement: Workbench Interactions Must Have A Domain Contract

Workbench behavior SHALL be modeled as a colony-domain interaction before being
rendered as a modal.

#### Scenario: Player opens the workbench

- **GIVEN** the workbench UI is opened
- **WHEN** protocols, kits or blocked entries are shown
- **THEN** availability SHOULD come from a workbench/domain contract
- **AND** the modal SHOULD not directly decide recipe eligibility, item issue,
  placement preview or persistent progression flags by itself.

### Requirement: Logical Input Actions Must Be Separated From Devices

Input handling SHALL distinguish logical game actions from physical keys,
buttons and prompt labels.

#### Scenario: Player edits controls

- **GIVEN** a player changes a control binding
- **WHEN** the game displays prompts or processes input
- **THEN** the logical action SHOULD remain stable
- **AND** keyboard, mouse and gamepad bindings SHOULD be device-specific
- **AND** display labels SHOULD be resolved through the prompt resolver.

### Requirement: HUD Should Be Composed From Panel State Contracts

HUD functionality SHALL be decomposed into small panels fed by explicit state
contracts.

#### Scenario: A new HUD element is added

- **GIVEN** a new HUD element is required
- **WHEN** it is implemented
- **THEN** it SHOULD define the state it consumes
- **AND** it SHOULD avoid owning unrelated quest, input, inventory or dialogue
  mutations
- **AND** it SHOULD be testable without requiring a full rendered game frame.

### Requirement: Content Catalogs Should Be Validated

Large sets of Sandbots content SHALL live in explicit catalogs with validation
instead of being scattered through runtime logic.

#### Scenario: A new bot, tool, material, buildable or workbench protocol is added

- **GIVEN** new content is added to the game
- **WHEN** the content is reviewed or tested
- **THEN** it SHOULD declare a stable id, player-facing name, category, role and
  unlock/progression context where relevant
- **AND** validation SHOULD flag missing names, external-IP-facing terminology
  and required progression entries without context.
