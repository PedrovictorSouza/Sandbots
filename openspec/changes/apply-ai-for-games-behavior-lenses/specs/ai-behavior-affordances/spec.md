# ai-behavior-affordances Specification

## ADDED Requirements

### Requirement: World Objects Must Declare Gameplay Affordances

Objects that affect interaction, placement, restoration, bot behavior or quests MUST
declare their relevant gameplay affordances in data or a small adapter layer.

#### Scenario: Placement preview checks a world object

- **GIVEN** the player previews a buildable object on the grid
- **WHEN** the preview overlaps an existing world object
- **THEN** placement validation MUST use the existing object's blocker or
  placement affordance
- **AND** it MUST NOT ignore the object because it lacks a special-case name check.

#### Scenario: Player approaches an interactable bot

- **GIVEN** a bot can be talked to or used for a task
- **WHEN** the player enters its interaction range
- **THEN** the bot MUST expose a talk or interaction affordance
- **AND** the trigger range MUST be explainable from the bot's role and visible
  footprint.

### Requirement: Concrete Actions Must Connect Input To World Meaning

Player actions MUST be represented as concrete actions with target types,
requirements, world effects and feedback.

#### Scenario: Player uses a field tool

- **GIVEN** the player uses a field tool on a target
- **WHEN** the target matches the tool's concrete action contract
- **THEN** the action MUST produce a world effect
- **AND** it MUST emit appropriate feedback such as sound, visual state, HUD,
  quest progress or camera intent.

#### Scenario: Player uses an action on the wrong target

- **GIVEN** the player uses an action on an invalid target
- **WHEN** the action cannot run
- **THEN** the game MUST provide a short failure reason or no-target response
- **AND** it MUST NOT silently imply that the control failed.

### Requirement: Bot Behavior Must Be Simple And Observable

Bot behavior MUST prefer explicit state machines or equivalent small state maps
before advanced AI techniques.

#### Scenario: Bot becomes available

- **GIVEN** a bot changes from dormant, hidden or blocked to available
- **WHEN** the player can now use or talk to it
- **THEN** the state change MUST have a readable cause
- **AND** the game MUST provide visible or audible payoff.

#### Scenario: Bot receives a task too early

- **GIVEN** the player attempts to use a bot before its state allows the action
- **WHEN** the action is rejected
- **THEN** the bot MUST remain in a valid state
- **AND** the player MUST receive contextual feedback rather than a silent no-op.

### Requirement: Important World Events Must Be Shareable

Important world events MUST be emitted through a small event contract so sound,
HUD, camera, quest and bot systems can react coherently.

#### Scenario: Milestone event occurs

- **GIVEN** a high-signal event such as bot awakened, kit placed, tile restored or
  quest completed occurs
- **WHEN** the event is emitted
- **THEN** it MUST include a stable event id and subject when one exists
- **AND** interested systems MAY react without directly coupling to each other.

#### Scenario: Event has narrative or gameplay importance

- **GIVEN** an event is marked medium or high importance
- **WHEN** its payload is validated in development or test
- **THEN** missing subject or position data SHOULD warn
- **AND** the warning SHOULD NOT block production runtime.

### Requirement: Behavior Work Must Avoid Unneeded AI Complexity

The game MUST NOT add advanced AI techniques unless a simpler visible behavior
cannot satisfy the player-facing need.

#### Scenario: New bot behavior is proposed

- **GIVEN** a new bot behavior is planned
- **WHEN** the behavior can be expressed as a small state machine, decision tree,
  catalog rule or event reaction
- **THEN** the implementation MUST use the simpler approach
- **AND** it MUST NOT add learning AI, GOAP, fuzzy logic or broad planners.

#### Scenario: Behavior feels unintelligent

- **GIVEN** a behavior reads poorly to the player
- **WHEN** the issue is analyzed
- **THEN** the first fix SHOULD improve cause, feedback, affordance data or state
  readability
- **AND** it SHOULD NOT start by making the hidden logic more complex.

### Requirement: Nonessential Behavior Must Respect Frame Time

Bot and ambient behavior updates MUST be scheduled according to visibility,
importance and proximity when per-frame updates are unnecessary.

#### Scenario: Bot is inactive or far from the player

- **GIVEN** a bot is not relevant to the current player action
- **WHEN** its behavior does not need frame-perfect updates
- **THEN** the update cadence MAY be reduced
- **AND** visible behavior near the player MUST remain responsive.

#### Scenario: Performance-sensitive behavior is added

- **GIVEN** a behavior adds repeated updates, scans or perception checks
- **WHEN** the implementation is planned
- **THEN** it MUST define whether it runs every frame, on event, or on a scheduled
  cadence
- **AND** the choice MUST be covered by a focused test or manual acceptance note.
