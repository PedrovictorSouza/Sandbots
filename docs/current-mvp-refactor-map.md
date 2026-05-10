# Current MVP Refactor Map

This document records the current Small Island MVP context and the safest refactor direction. It is intentionally narrow: it should guide incremental work without forcing a broad rewrite.

## Current MVP Loop

Small Island is currently a cozy restoration and construction game.

The active loop is:

1. The player explores the island.
2. The player collects resources such as sturdy sticks, leaves, and carbon ore.
3. Companion abilities transform the world:
   - Squirtle restores dry ground, flowers, and thirsty trees with Water Gun.
   - Bulbasaur creates living landscape objects with Leafage.
   - Charmander burns white ground with Fire and consumes carbon.
   - Timburr supports construction through the build specialty.
4. The player uses the Workbench to turn resources and recipes into buildables.
5. The player previews and places buildables in the world.
6. Larger construction uses construction feedback, helper creatures, and a timed build state.
7. Finished buildings become part of the island, support furnishing, and can become homes.
8. The Pokemon Center PC presents missions, rewards, and meta-progression.

The important design pattern is:

```txt
restore world -> create habitat -> unlock/helper creature -> use ability -> gather resources -> build -> furnish/home -> unlock next goal
```

## Current Source-Of-Truth Map

These files currently hold the main responsibility for the MVP:

| Area | Current source | Notes |
| --- | --- | --- |
| Item, recipe, creature, kit, and resource definitions | `gameplayContent.js` | This is the closest thing to a content database. New content should start here. |
| Story flags, inventory, construction deposits, and progression helpers | `story/progression.js` | This is the mutable progression model. It is powerful but flag-heavy. |
| Player-facing field tasks and story beats | `app/story/storyBeatData.js` | This currently reflects the real MVP checklist better than `questData`. |
| Formal quest event definitions | `app/quest/questData.js` | This overlaps with field tasks and should not be expanded until ownership is clarified. |
| Runtime orchestration | `app/bootstrap/createApplicationRuntime.js` | Owns save/load, UI callbacks, mission routing, and several gameplay actions. |
| Per-frame gameplay/update/render orchestration | `app/runtime/gameLoop.js` | High-risk file. It contains too many domains and should be reduced in small slices. |
| Grid/building primitives | `app/gameplay/gridBuildingSystem.js` | This is the right direction for scalable placement and occupancy. |
| World validation and spatial helpers | `world/islandWorld.js` | Owns terrain/building validation and nearby-target queries. |
| Gameplay interaction helpers | `world/gameplayInteractions.js` | Good place for pure gameplay actions and context target resolution. |
| HUD, PC, settings, and modal surfaces | `app/ui/*`, `app/settings/*` | UI should consume snapshots/state instead of owning gameplay rules. |

## Refactor Boundaries

The refactor should not begin by rewriting `gameLoop.js`.

Instead, each new slice should extract one domain while preserving the current API used by runtime code.

Safe module boundaries:

| Domain | Target direction |
| --- | --- |
| Buildable definitions | Keep in `gameplayContent.js`; expose normalized buildable records. |
| Placement and occupancy | Move toward `app/gameplay/gridBuildingSystem.js` as the single source for cell, footprint, validation, and registered placed objects. |
| Construction lifecycle | Extract from runtime into a small service that owns pending/building/complete state and construction effects metadata. |
| Resource collection and respawn | Extract collection, pickup feedback, and respawn policies into a resource runtime module. |
| Companion ability execution | Keep ability definitions data-driven; move move-specific side effects behind explicit handlers. |
| UI presentation | UI should read derived state and emit user intent, not mutate story flags directly. |
| Audio | Route music, object music, and SFX through one audio runtime module. |

## Do Not Touch Broadly

Avoid broad changes to these systems unless a task specifically targets them:

- Camera.
- Render frame.
- Stage scale.
- Scene flow.
- Intro/cinematic flow.
- Core input mapping.
- Low-level WebGL renderer.

Those systems are tightly coupled to the game feel and fixed PSX presentation.

## Naming Debt

`leafDen` is now player-facing `House`.

Do not do a global rename yet. That would be high risk because `leafDen` exists in save data, story flags, placement code, UI, model instances, and tests.

Safe migration path:

1. Keep stable internal ids such as `leafDen` for save compatibility.
2. Expose player-facing labels through content definitions.
3. Add new generic concepts around it, such as `home`, `building`, or `playerHouse`.
4. Only migrate ids after a save compatibility adapter exists.

## Quest/Task Ownership Problem

There are two progression layers:

- `SMALL_ISLAND_QUESTS` in `app/quest/questData.js`.
- Field tasks/story beats in `app/story/storyBeatData.js`.

For the current MVP, field tasks appear to be the more accurate player-facing source.

Short-term rule:

- Do not add new MVP checklist behavior to `questData` unless it is also wired to field tasks.
- Prefer adding current mission copy and task logic to `storyBeatData`.
- Treat `questData` as a formal event system candidate until the two systems are unified.

## Build System Target

The scalable target is:

```txt
player input
-> build intent
-> grid cell / world position
-> placement database
-> occupancy validation
-> preview state
-> confirm/cancel/rotate
-> placed object record
-> save data
-> renderer/UI snapshot
```

Every placed Workbench object should eventually pass through the same route:

- Train House.
- Solar Station.
- House.
- Future furniture and placeables.

The Workbench should create build intents or inventory kits. It should not own placement rules.

## First Safe Code Slices

Recommended order:

1. Create a `buildableCatalog` facade over the existing item/recipe/building kit data.
2. Route Train House, Solar Station, and House labels/assets through that facade without changing behavior.
3. Add tests for the facade so future content can be added without touching runtime.
4. Extract construction state helpers for House into a module while keeping `leafDen` save fields unchanged.
5. Move placement validation calls behind `gridBuildingSystem` one buildable at a time.
6. Extract resource collection/respawn helpers after placement is stable.
7. Only then reduce `gameLoop.js` by replacing inline blocks with these modules.

## Validation Strategy

Every refactor slice should have a narrow validation target:

- Data facade: unit tests only.
- Construction helpers: unit tests plus one smoke test.
- Placement helpers: unit tests for footprint, occupied cells, cancel, rotate, and save record.
- Runtime wiring: `npm run build` and focused gameplay tests.

Avoid large visual or runtime changes without a smoke test.
