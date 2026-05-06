# Change: Finish game roadmap

## Why

The game needs a concrete definition of "finished" before more content is added.
The reference walkthrough gives a useful structure: a mentor-led opening, ability
unlocks, habitat discovery, NPC requests, regional repair goals, area gates, major
story requests, and a credits condition. Without a scoped roadmap, implementation can
drift into broad scene/runtime changes or disconnected content.

This change defines the final-game contract so future work can be split into small,
verifiable slices.

## What Changes

- Define the full story progression from opening tutorial to end credits.
- Define content pillars: characters, requests, habitats, abilities, crafting,
  regional repair goals, gates, reminders and post-story sandbox state.
- Require an evolving story context so each implemented task strengthens one
  coherent beginning-to-ending narrative.
- Require an evolving architecture pattern map so implementation work is organized
  around explicit game systems and design patterns.
- Split finalization into implementable phases that can be delivered without
  rewriting camera, render frame, stage, input or scene-flow systems.
- Define acceptance scenarios for each major game loop.

## Non-Goals

- Do not implement final content in this change.
- Do not copy reference-game text, quest names, characters, copyrighted art, or exact
  dialogue.
- Do not change global runtime, camera, render frame, stage, input or scene flow as
  part of roadmap creation.
- Do not require every optional side request before defining the credits path.

## Design Direction

The final game should feel like an exploration-and-repair sandbox with story pressure:

- The player restores small local habitats.
- Restored habitats attract characters.
- Characters unlock requests, abilities, recipes or traversal options.
- Abilities open blocked routes and solve local environmental problems.
- The final game follows four macro-biomes, matching the reference structure.
- Each macro-biome has one major repair/celebration/restoration goal.
- Completing the required macro-biome goals unlocks the final sequence.
- After credits, the island remains playable as a sandbox.

## Roadmap Matrix

| Phase | Macro-Biome Role | Core Unlock | Major Goal | Completion Gate |
| --- | --- | --- | --- | --- |
| Act 1 | Starting wasteland / tutorial biome | First restoration ability, request log, workbench, first home/den | First companion chain and first shared hub repair | Water/beach and ridge/crafting routes open after the starting-biome token |
| Act 2A | Water/beach biome | Water traversal, cleanup or light/energy ability | Restore flooded/blocked infrastructure and biome energy/mood | Water/beach completion token contributes to final-biome unlock |
| Act 2B | Ridge/crafting biome | Heavy-object, cooking or hard-rock ability | Rescue local specialist and complete celebration/party repair | Ridge/crafting completion token contributes to final-biome unlock |
| Act 3 | Sky/final traversal biome | Glide/lift/platform traversal and advanced building materials | Complete multi-stage large-building repair | Final token/rank enables ending sequence |
| Ending | Whole island | Final challenge readiness | Credits and completion flag | Post-story sandbox remains available |

## Biome Progression Model

The final game should support exactly four macro-biomes, not eleven top-level
regions. Smaller map areas may exist as internal zones, but the player-facing
progression and content planning should use these four biome slots:

| Biome Role | Unlock Model | Completion Contribution |
| --- | --- | --- |
| Starting biome | Available at game start | Teaches restoration, habitats, requests, crafting, home building and first hub repair |
| Water/beach biome | Opens after starting-biome main request/rank token | Restores water/energy problem and grants one final-biome unlock token |
| Ridge/crafting biome | Opens after starting-biome main request/rank token | Restores material/crafting/community problem and grants one final-biome unlock token |
| Sky/final biome | Opens after both intermediate biome tokens are earned | Tests late traversal, staged repair and final readiness |

Each biome owns habitat availability, local character roster, local environment
level, local shop/recipe thresholds, local gates and local completion token. Some
habitats or characters may require biome-specific conditions such as weather, time,
environment level or story flags.

Current internal map ids may be mapped into these macro-biomes as sub-zones. They
should not become additional player-facing biome requirements.

## Request Taxonomy

The reference material maps cleanly into two request classes:

- **Important requests:** multi-step story-critical requests required for credits.
  These should own region completion, major repairs, major environmental restoration,
  final tokens, and credits readiness.
- **General requests:** shorter comfort/progression requests. These can unlock
  abilities, recipes, habitats, NPC comfort, region environment level, and optional
  world flavor, but should not silently become credits blockers unless promoted to
  important requests.

| Request Type | Examples Of Shape | Roadmap Use |
| --- | --- | --- |
| Major repair | rebuild hub, rebuild multi-floor structure, restore shared town object | Important request |
| Environmental restoration | make rain, brighten region, clean flood/mud, create waterfall | Important request or regional milestone |
| Initiation/challenge | gather category of resources, prove region readiness | Important request |
| Celebration/mood | raise mood/energy/light by points, prepare community event | Important request |
| Ability unlock | learn water, cut, smash, surf, strength, glide-like move | General request that can gate important request |
| Habitat/home | create habitat, invite character, build house, add furniture | General request and environment-level support |
| Crafting/cooking | make salad, bread, hamburger, concrete, bookcase, lamps | General request or material prerequisite |
| Escort/follow | follow NPC, bring NPC to object, guide slow character, inspect location | General request or important request step |
| Delivery/show item | bring berry, honey, toy, feather, alarm clock, material | General request and comfort support |

Credits readiness should require a curated set of important requests plus explicit
environment/comfort thresholds. It should not require every general request.

## Recipe And Item Taxonomy

The recipe list should be treated as an economy design input, not as a literal
backlog to copy. The final game needs a smaller authored recipe catalog with clear
unlock sources and act relevance.

| Recipe Axis | Roadmap Categories |
| --- | --- |
| Item category | furniture, misc/decor, outdoor props, utilities, buildings, blocks, other/special |
| Unlock source | first workbench use, request reward, story milestone, shop threshold, region environment level, collection count, first material pickup, world pickup, random/daily source, challenge reward |
| Progression role | required story item, habitat ingredient, comfort item, repair material, traversal utility, decoration/flavor, post-story collectible |
| Economy tier | starter natural materials, beach/clay/glass materials, ridge/ore/cooking materials, sky/concrete/advanced metal materials, rare/post-story materials |

Required story recipes should stay few and readable. Decorative variants can exist as
optional catalog entries unlocked by shop/environment/collection progress.

## Implementation Strategy

Future implementation should prefer content/data-first changes:

- Add quest data, dialogue data, habitat definitions and reward definitions first.
- Add small controllers only when existing systems cannot express the content.
- Treat camera, render frame, stage, input and scene-flow changes as high-risk tasks
  that require separate specs.
- Preserve already implemented behavior by default; existing passing behavior should
  be treated as a contract unless a spec explicitly changes it.
- Use TDD for each implementation slice: write or update the focused failing test
  first, implement the smallest change, then make the test pass.
- Validate each slice with focused tests before broader smoke/e2e checks.

## Ongoing Work Rules

Every future task that advances the final game should update two tracks:

- **Story context:** what changed in the fiction, which character/region arc it
  belongs to, why the player cares, and how it connects to the ending.
- **Architecture pattern map:** which game system owns the behavior, which design
  pattern is being used, and which boundaries must not be crossed.

Every future implementation slice should also include:

- **Regression guard:** which existing behavior must remain unchanged.
- **TDD evidence:** which test failed first, which implementation made it pass, and
  which focused command verified it.

Initial architecture vocabulary:

| Pattern / System | Responsibility |
| --- | --- |
| Input System | Converts keyboard/gamepad actions into game intents without owning story state. |
| Scene/Scenario System | Owns region setup, scene transitions, gates and high-level progression boundaries. |
| Quest State Machine | Tracks request availability, progress, completion and next-step guidance. |
| State Factories | Create default runtime/story/session state without hidden mutations. |
| Flyweight Data Catalogs | Store reusable definitions for NPCs, habitats, items, moves and recipes. |
| Factory / Builder | Creates characters, props, habitats, repairs and placed objects from data. |
| Strategy | Selects render/update/interaction behavior without branching through global code. |
| Observer/Event Queue | Lets quest, UI and feedback systems react to gameplay events without direct coupling. |
| Repository / Registry | Provides stable lookups for quests, items, characters, habitats and regions. |
| UI Presenter | Converts state into HUD/dialogue/request-log output without owning game rules. |
