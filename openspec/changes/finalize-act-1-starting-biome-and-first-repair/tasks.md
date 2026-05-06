# Tasks: Finalize Act 1 starting biome and first repair

## 1. TDD And Regression Guards

- [x] Identify existing hub, center, challenge board and route-gate behavior that
  must not regress.
- [x] Add or update a focused test for destroyed hub discovery.
- [x] Add or update a focused test for challenge/request board unlock.
- [x] Add or update a focused test for material requirement display.
- [x] Add or update a focused test for helper-character request availability.
- [x] Add or update a focused test that material turn-in consumes items once.
- [x] Add or update a focused test for hub repair completion flag.
- [x] Add or update a focused test for next-route unlock after repair.
- [x] Record the focused verification command for this slice:
  `npm run test -- tests/storyBeatSystem.test.js tests/questLog.test.js tests/progression.test.js tests/biomeProgressionData.test.js`

## 2. Story Context

- [x] Define what the shared hub represents.
- [x] Define why the region cannot progress until the hub is repaired.
- [x] Define helper character motivation.
- [x] Define how material gathering teaches community repair.
- [x] Define how the repaired hub changes NPC dialogue.
- [x] Define how the starting biome opens the larger journey.

## 3. Architecture Ownership

- [x] Assign hub repair to Quest State Machine plus repair catalog.
- [x] Store material requirements in Flyweight Catalogs.
- [x] Use Factory / Builder for repaired hub visual state if needed.
- [x] Use UI Presenter for missing-material and repair-confirmation text.
- [x] Confirm region gate is owned by Scenario System.
- [x] Confirm Input System must not own repair or route-gate flags.
- [x] Confirm this slice must not change camera, stage, render frame or scene flow.

## 4. Content Decisions

- [x] Finalize destroyed hub/center location.
- [x] Finalize discovery interaction.
- [x] Finalize challenge/request board equivalent.
- [x] Finalize Act 1 important request: first shared hub repair.
- [x] Finalize Act 1 important request: initiation/challenge objective if required.
- [x] Finalize Act 1 general request pack: habitat invite, comfort raise, helper
  material conversion and blocked-wall route.
- [x] Finalize Act 1 recipe pack: hub repair kit, simple building pieces, storage,
  community utility and first shop/environment-level unlocks.
- [x] Finalize Act 1 material tier: natural materials plus first processed building
  materials.
- [x] Finalize repair kit or repair action.
- [x] Finalize required materials.
- [x] Finalize helper-character unlock.
- [x] Finalize helper-character request.
- [x] Finalize repair confirmation.
- [x] Finalize repaired visual/dialogue state.
- [x] Finalize next route/gate unlock.
- [x] Finalize `root-signal` or equivalent starting-biome completion handoff.

## 5. Validation

- [x] Confirm this OpenSpec change exists under
  `openspec/changes/finalize-act-1-starting-biome-and-first-repair`.
- [x] Confirm this promotion step does not change gameplay/runtime/source behavior.
- [x] Run focused tests added by this implementation slice.
- [x] Run `npm run architecture:graph` after implementation changes.
- [x] Run build after implementation changes.
