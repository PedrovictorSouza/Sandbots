# game-narrative Specification

## ADDED Requirements

### Requirement: Game Must Have A Cohesive Original Premise

The game MUST present a clear original premise that connects the player role,
world, systems, progression, characters, objects, resources and quests.

#### Scenario: Player starts the game

- **GIVEN** the player starts a new game
- **WHEN** the intro, first dialogue or first tutorial sequence begins
- **THEN** the game MUST communicate who the player is
- **AND** where the player is
- **AND** what kind of place they are restoring, building or managing
- **AND** why the first objective matters.

#### Scenario: A quest is shown to the player

- **GIVEN** a quest appears in the HUD, dialogue, terminal or tutorial
- **WHEN** the quest asks the player to perform an action
- **THEN** the action MUST make sense according to the objects, machines,
  resources and world rules already introduced by the game.

### Requirement: Narrative Bible Must Be The Source Of Truth

The game MUST define a narrative bible or equivalent source of truth for future
story, dialogue, quest, character and terminology decisions.

#### Scenario: New narrative content is added

- **GIVEN** a new character, quest, item, system or dialogue line is added
- **WHEN** the content is implemented
- **THEN** it MUST follow the narrative bible
- **AND** it MUST not invent disconnected lore
- **AND** it MUST not contradict established world rules.

### Requirement: Quest Objectives Must Be Semantically Grounded

Quest objectives MUST be derived from actual game objects, systems, resources,
machines, UI concepts or story concepts.

#### Scenario: Quest involves watering soil

- **GIVEN** the game asks the player to water soil
- **WHEN** the quest objective is generated or displayed
- **THEN** the required steps MUST involve relevant concepts such as water,
  pumps, tanks, pipes, soil trays, irrigation, power, ice processing or moisture
  systems
- **AND** the quest MUST NOT introduce unrelated concepts such as arbitrary heat
  signatures or disconnected scanning tasks.

#### Scenario: Quest introduces a new object

- **GIVEN** a quest requires an object the player has not seen before
- **WHEN** the quest appears
- **THEN** the object MUST be introduced through dialogue, environment, UI,
  tutorial or previous progression
- **AND** the object MUST have a clear purpose in the world.

### Requirement: Progression Must Be Causal

The early game progression MUST follow a causal chain where each completed task
logically enables, teaches or unlocks the next task.

#### Scenario: Early game tutorial chain

- **GIVEN** the player is in the first playable sequence
- **WHEN** the player completes a tutorial objective
- **THEN** the next objective MUST be a logical consequence of the previous one
- **AND** the player MUST understand why the next task matters.

### Requirement: External IP References Must Be Removed

The game MUST NOT contain visible references, names, creatures, terminology or
story structures derived from Pokemon or any other external IP.

#### Scenario: User-facing content is displayed

- **GIVEN** any dialogue, HUD label, menu text, quest text, item name, character
  name, tutorial message or terminal text is displayed
- **WHEN** the player sees the content
- **THEN** it MUST use original terminology
- **AND** it MUST NOT reference Pokemon, Pokemon-like creatures,
  Pokemon-specific terms or franchise-derived names.

#### Scenario: Existing external-IP-inspired content exists in code

- **GIVEN** the codebase contains existing names inspired by external IP
- **WHEN** the content is migrated
- **THEN** user-facing labels MUST be replaced first
- **AND** internal code identifiers SHOULD only be renamed after references are
  mapped and the rename is safe.

### Requirement: Humor Must Not Break World Logic

Humor MUST preserve world logic. The game MAY use dry, absurd, melancholic or
lightly nihilistic humor, but humor MUST NOT make objectives incoherent.

#### Scenario: Dialogue jokes about a task

- **GIVEN** a dialogue line introduces or comments on a task
- **WHEN** the line uses humor
- **THEN** the joke MUST still point toward a real objective
- **AND** the player MUST understand what to do next.

### Requirement: Nomenclature Must Be Consistent

The game MUST use consistent names for characters, machines, resources, bots,
modules, UI devices and actions.

#### Scenario: A resource appears in multiple places

- **GIVEN** a resource appears in inventory, quest text, dialogue and UI
- **WHEN** the resource is referenced
- **THEN** the same canonical name MUST be used everywhere
- **AND** alternate names MUST only appear if explicitly defined as aliases.
