# final-game-roadmap Specification

## ADDED Requirements

### Requirement: Final Game Structure

The game MUST define a complete story path from opening interaction to credits
without requiring optional side content.

#### Scenario: Four macro-biomes form a complete arc

- **GIVEN** the final roadmap is accepted
- **WHEN** a developer reads the required story path
- **THEN** it MUST include exactly four player-facing macro-biomes: starting
  wasteland/tutorial, water or beach, ridge or crafting, and sky or final traversal
- **AND** the first repair hub MUST belong to the starting macro-biome, not a fifth
  macro-biome
- **AND** the required path MUST still include an ending sequence.

#### Scenario: Optional content is separate from credits path

- **GIVEN** a side request, optional character request or optional feature exists
- **WHEN** the player does not complete it
- **THEN** the required credits path MUST remain completable unless that content is
  explicitly marked as required.

### Requirement: Four Macro-Biome Completion Model

Each macro-biome MUST have a clear completion model built from discovery,
requests, ability or recipe unlocks, and one major repair/story goal.

The model MUST support a starting biome, two intermediate biomes that can be
unlocked in parallel after the starting-biome main request, and a final biome that
requires completion tokens from both intermediate biomes.

Internal map zones MAY exist, but they MUST map into one of the four macro-biomes
and MUST NOT become additional top-level biome requirements.

#### Scenario: Macro-biome has required completion checklist

- **GIVEN** the player enters a macro-biome
- **WHEN** the macro-biome state is inspected
- **THEN** it MUST expose required goals for local hub discovery, local request
  chain, biome-specific mechanic unlock, major repair/story goal, and biome
  completion flag.

#### Scenario: Macro-biome gate depends on explicit completion

- **GIVEN** a gate or route leads to a later macro-biome
- **WHEN** the player has not completed the required previous macro-biome goals
- **THEN** the gate MUST stay locked or blocked with a clear in-world hint.

#### Scenario: Macro-biome completion unlocks next route

- **GIVEN** the player completes a macro-biome's required major goal
- **WHEN** the next route is available
- **THEN** the game MUST unlock the route and update mentor/request-menu guidance.

#### Scenario: Intermediate biomes unlock in parallel

- **GIVEN** the player completes the starting biome's required main request and rank
  or equivalent story token
- **WHEN** biome gates are evaluated
- **THEN** both intermediate biome routes MAY become available
- **AND** the player may complete them in either order.

#### Scenario: Final biome requires both intermediate tokens

- **GIVEN** the final biome route is evaluated
- **WHEN** either intermediate biome completion token is missing
- **THEN** the final biome MUST remain locked with a clear hint naming the missing
  macro-biome goal
- **AND** it MUST unlock only after both intermediate biome completion tokens are
  earned.

#### Scenario: Biome owns local availability rules

- **GIVEN** a habitat, character, recipe, shop item or request is biome-specific
- **WHEN** its availability is evaluated
- **THEN** the rule MUST include biome id plus any required environment level,
  weather, time, story flag, rank token or local completion condition.

### Requirement: Character And Request Roster

The final game MUST define the characters required for the main story and the
requests each one can introduce.

#### Scenario: Required character has a role

- **GIVEN** a character is required for the main story
- **WHEN** the roster is audited
- **THEN** the character MUST have a region, role, unlock condition, request
  contribution, reward or ability contribution, and completion state.

#### Scenario: Yellow-bubble equivalent marks story progress

- **GIVEN** a character can advance the main story
- **WHEN** that character has a pending required interaction
- **THEN** the game MUST show a consistent story-progress affordance
- **AND** interacting with the character MUST advance only the intended request or
  story beat.

#### Scenario: Mentor can summarize the next goal

- **GIVEN** the player has an active required request
- **WHEN** the player talks to the mentor/reminder character
- **THEN** the mentor MUST summarize the next actionable goal without changing the
  quest state.

### Requirement: Ability Unlock Chain

The game MUST define a required ability chain where each ability opens specific
content and has a validation target.

#### Scenario: Ability has source and use case

- **GIVEN** an ability is part of the required path
- **WHEN** the ability is unlocked
- **THEN** the game MUST record who grants it, what request grants it, what blocked
  content it opens, and which tests verify it.

#### Scenario: Ability unlock is not granted twice

- **GIVEN** the player repeats the interaction that granted an ability
- **WHEN** the ability is already unlocked
- **THEN** the game MUST preserve the unlocked state
- **AND** it MUST NOT duplicate rewards, flags or request completion events.

#### Scenario: Ability-gated obstacle explains missing ability

- **GIVEN** the player interacts with an obstacle that requires a locked ability
- **WHEN** the ability has not been unlocked
- **THEN** the game MUST show a short hint pointing toward the relevant request or
  region.

### Requirement: Habitat And Discovery Loop

The final game MUST preserve the loop where environmental restoration discovers
habitats, habitats attract characters, and characters unlock requests.

#### Scenario: Habitat has recipe and discovery source

- **GIVEN** a habitat is required by the main path
- **WHEN** the habitat definition is audited
- **THEN** it MUST include required placed objects or tiles, discovery source,
  attracted character or reward, and related request id.

#### Scenario: Required habitat discovery is deterministic

- **GIVEN** the player places the required habitat ingredients in a valid layout
- **WHEN** the habitat system evaluates the area
- **THEN** the habitat MUST be discovered once
- **AND** the related character/request availability MUST update predictably.

### Requirement: Crafting, Materials And Repair

The final game MUST define material requirements and helper-character conversions
for all required repairs.

The recipe catalog MUST classify every authored recipe by item category, unlock
source, progression role and economy tier.

Allowed recipe categories are furniture, misc/decor, outdoor props, utilities,
buildings, blocks and other/special. Allowed unlock sources are first workbench use,
request reward, story milestone, shop threshold, region environment level,
collection count, first material pickup, world pickup, random/daily source and
challenge reward.

#### Scenario: Required repair has material contract

- **GIVEN** a required building, bridge, hub, lift, station or final structure must
  be repaired
- **WHEN** the repair is inspected
- **THEN** it MUST list required materials, helper characters if any, time/waiting
  behavior if any, and the exact completion reward.

#### Scenario: Material turn-in is transactional

- **GIVEN** the player has enough materials for a required repair
- **WHEN** the player confirms the repair
- **THEN** materials MUST be consumed once
- **AND** completion flags and rewards MUST be applied once.

#### Scenario: Missing materials are explained

- **GIVEN** the player attempts a repair without enough materials
- **WHEN** the repair UI or dialogue responds
- **THEN** it MUST show the missing material requirements without advancing the
  request.

#### Scenario: Recipe has progression role

- **GIVEN** a recipe is added to the authored catalog
- **WHEN** the recipe is audited
- **THEN** it MUST be classified as required story item, habitat ingredient, comfort
  item, repair material, traversal utility, decoration/flavor or post-story
  collectible.

#### Scenario: Required story recipe is explicitly marked

- **GIVEN** a recipe is needed to complete a required request, gate, repair or
  credits path
- **WHEN** the recipe is added
- **THEN** it MUST be marked as required
- **AND** the unlock source MUST be deterministic enough for the required story path.

#### Scenario: Optional decorative recipe does not block credits

- **GIVEN** a recipe is decorative, cosmetic, random, daily-shop, collection-count or
  post-story focused
- **WHEN** the player has not unlocked it
- **THEN** credits readiness MUST NOT depend on that recipe unless another spec
  explicitly promotes it to required.

#### Scenario: Material tier matches act progression

- **GIVEN** a required act recipe is added
- **WHEN** its materials are selected
- **THEN** the materials SHOULD belong to that act's economy tier or an earlier tier
- **AND** late-tier materials MUST NOT appear in early required recipes unless the
  story explicitly introduces that material first.

### Requirement: Quest Log And Guidance

The final game MUST keep required requests discoverable through an in-game request
log or equivalent guidance.

Requests MUST be classified as important, general, tutorial, optional or debug.
Important requests are story-critical and may be required for credits. General
requests are shorter tasks that may raise comfort, environment level, unlock
abilities, grant recipes or add flavor, but they MUST NOT become credits blockers
unless explicitly promoted to important requests.

#### Scenario: Required request appears in request log

- **GIVEN** a required request becomes available
- **WHEN** the player opens the request log or equivalent UI
- **THEN** the request MUST appear with objective text, current progress, target
  character or location, and reward if known.

#### Scenario: Completed request remains stable

- **GIVEN** a required request is completed
- **WHEN** the player reloads or revisits the character
- **THEN** the completion state MUST remain stable
- **AND** follow-up dialogue or next request availability MUST match the completed
  state.

#### Scenario: Important request is credits-relevant

- **GIVEN** a request is classified as important
- **WHEN** final readiness is calculated
- **THEN** the request MAY be included in the credits requirements
- **AND** the request MUST expose completion state and missing-goal guidance.

#### Scenario: General request supports progression without silently blocking credits

- **GIVEN** a request is classified as general
- **WHEN** the player skips that request
- **THEN** credits readiness MUST NOT depend on it unless another spec explicitly
  promotes that request to important
- **AND** the request MAY still grant comfort, environment level, recipes, abilities
  or optional rewards.

#### Scenario: Request archetype is recorded

- **GIVEN** a request is added or audited
- **WHEN** it is documented
- **THEN** it MUST record an archetype such as repair, environmental restoration,
  initiation/challenge, celebration/mood, ability unlock, habitat/home,
  crafting/cooking, escort/follow or delivery/show-item.

### Requirement: Comfort And Environment Progression

The final game MUST define how general requests contribute to character comfort,
regional environment level and progression thresholds.

#### Scenario: General request can raise comfort

- **GIVEN** the player completes a general request for a character
- **WHEN** the reward is applied
- **THEN** the character comfort MAY increase
- **AND** the same completion MUST NOT apply the comfort reward twice.

#### Scenario: Region environment level is derived from local progress

- **GIVEN** a region uses an environment-level threshold
- **WHEN** local comfort, habitat or repair progress changes
- **THEN** the region environment level MUST update from explicit inputs
- **AND** any shop, gate or important-request unlock tied to that level MUST be
  explainable to the player.

### Requirement: Ending And Post-Story State

The game MUST define an explicit credits trigger and a safe post-story sandbox state.

#### Scenario: Credits trigger after required important goals

- **GIVEN** all required regional major goals, required hub repairs, and required
  final challenges are complete
- **WHEN** the player performs the final story interaction
- **THEN** the ending sequence MUST play
- **AND** the game MUST set a final completion flag.

#### Scenario: Credits do not trigger early

- **GIVEN** one or more required important goals are incomplete
- **WHEN** the player reaches the final interaction location
- **THEN** credits MUST NOT play
- **AND** the game MUST explain the next missing required goal.

#### Scenario: Post-story keeps sandbox available

- **GIVEN** credits have completed
- **WHEN** the player returns to the game
- **THEN** the island MUST remain playable
- **AND** optional requests, habitats, collection, decorating or exploration may
  continue without resetting the completed story state.

### Requirement: Narrative Context Is Maintained

Every finalization slice MUST preserve and extend a coherent story context from the
opening tutorial through the ending.

#### Scenario: Story slice records narrative purpose

- **GIVEN** a future task adds or changes a required quest, character, region,
  ability unlock, repair, cutscene or ending beat
- **WHEN** the task is completed
- **THEN** the change MUST record its narrative purpose
- **AND** it MUST explain how it connects to the current act, the character arc and
  the final ending.

#### Scenario: Character request supports an arc

- **GIVEN** a required character introduces a request
- **WHEN** the request is added to the roadmap or implementation
- **THEN** the request MUST define what the character wants, what the player repairs
  or restores, what changes afterward, and why that matters later.

#### Scenario: Region story has setup and payoff

- **GIVEN** a required region is finalized
- **WHEN** its story context is reviewed
- **THEN** it MUST have a setup, local conflict, mechanical unlock, major payoff and
  connection to the credits path.

#### Scenario: New content does not become disconnected filler

- **GIVEN** a new optional or required content slice is proposed
- **WHEN** it does not strengthen a character arc, region arc, mechanic tutorial,
  repair loop or ending requirement
- **THEN** it SHOULD be deferred or reframed before implementation.

### Requirement: Architecture Pattern Map Is Maintained

Every finalization slice MUST identify the game system and design pattern that owns
the behavior being added or changed.

#### Scenario: Slice declares owning system

- **GIVEN** a future task changes gameplay behavior, quest progression, dialogue,
  UI, state, rendering, input, scenes, inventory, habitats or characters
- **WHEN** the task is scoped
- **THEN** it MUST name the owning system
- **AND** it MUST avoid spreading the behavior across unrelated systems.

#### Scenario: Slice declares design pattern

- **GIVEN** a future task adds reusable behavior or data
- **WHEN** the task is scoped
- **THEN** it MUST identify the relevant pattern, such as state machine, state
  factory, flyweight/catalog, factory/builder, strategy, observer/event queue,
  registry/repository or UI presenter.

#### Scenario: Input remains an input system

- **GIVEN** a task changes keyboard or gamepad handling
- **WHEN** the input system is updated
- **THEN** it MUST translate physical controls into game intents
- **AND** it MUST NOT own quest state, story flags or scene progression.

#### Scenario: Scenario system owns region progression boundaries

- **GIVEN** a task changes gates, region transitions, scenario setup or major act
  progression
- **WHEN** the scenario/scene system is updated
- **THEN** it MUST own the high-level progression boundary
- **AND** lower-level world, input, UI and rendering modules MUST remain consumers of
  explicit state or events.

#### Scenario: Catalog data stays reusable

- **GIVEN** a task adds NPC, item, habitat, move, recipe or quest definitions
- **WHEN** those definitions are stored
- **THEN** they SHOULD use flyweight/catalog-style data
- **AND** runtime-specific mutable state MUST live outside the reusable catalog.

#### Scenario: Architecture graph is used before risky coupling

- **GIVEN** a task would add a dependency across runtime, scene, input, rendering,
  camera, UI or content boundaries
- **WHEN** the dependency is proposed
- **THEN** the architecture graph SHOULD be checked
- **AND** new directed cycles MUST be avoided unless a separate high-risk spec
  justifies them.

### Requirement: Safe Implementation Boundaries

Finalization work MUST preserve sensitive game systems unless a separate high-risk
spec explicitly authorizes those changes.

Already implemented behavior MUST be preserved by default. A future change may alter
existing behavior only when the OpenSpec change explicitly names the behavior being
changed and provides replacement acceptance criteria.

#### Scenario: Content-only slice avoids runtime rewrites

- **GIVEN** a future implementation slice adds dialogue, quest data, habitat data,
  rewards or region requirements
- **WHEN** the slice is implemented
- **THEN** it SHOULD avoid changing camera, render frame, stage, input and global
  scene-flow code.

#### Scenario: High-risk system change requires separate spec

- **GIVEN** a future slice requires camera, render frame, stage, input, runtime boot
  or scene-flow changes
- **WHEN** the work is scoped
- **THEN** it MUST be split into its own OpenSpec change with focused validation.

#### Scenario: Existing behavior has a regression guard

- **GIVEN** a future task extends existing quests, characters, habitats, input,
  rendering, camera, scene flow, inventory, UI or story state
- **WHEN** the task is scoped
- **THEN** it MUST identify the existing behavior that should remain unchanged
- **AND** validation MUST include the focused tests that protect that behavior.

#### Scenario: Existing behavior changes only by explicit contract

- **GIVEN** a future task needs to change existing behavior
- **WHEN** the task is proposed
- **THEN** the OpenSpec change MUST name the old behavior, the new intended behavior,
  migration risk and replacement tests before implementation begins.

### Requirement: TDD Workflow Is Required

Every future implementation slice MUST follow a test-first workflow.

#### Scenario: Test fails before implementation

- **GIVEN** a future slice has clear acceptance criteria
- **WHEN** implementation begins
- **THEN** a focused unit, integration or smoke test MUST be added or updated first
- **AND** that test SHOULD fail for the expected reason before production code is
  changed.

#### Scenario: Implementation is minimal after failing test

- **GIVEN** the focused test fails for the expected reason
- **WHEN** production code or content is changed
- **THEN** the change MUST be the smallest change that satisfies the test and the
  OpenSpec acceptance criteria
- **AND** unrelated refactors MUST be avoided.

#### Scenario: Slice is not complete until focused tests pass

- **GIVEN** the implementation change is made
- **WHEN** the slice is considered complete
- **THEN** the focused test command MUST pass
- **AND** any required regression tests for unchanged behavior MUST pass or the
  remaining risk MUST be documented.
