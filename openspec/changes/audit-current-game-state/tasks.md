# Tasks: Audit current game state

## 1. Scope Guard

- [x] Keep this change documentation-only.
- [x] Do not alter gameplay, runtime, camera, input, scene flow, render frame,
  existing tests or content data.
- [x] Use targeted search before reading files.
- [x] Stop the audit before it becomes a full project read.

## 2. Source Map

- [x] Locate current story state factory and flag owner.
- [x] Locate current story quest, item, recipe, region, NPC, interactable and
  barrier catalogs.
- [x] Locate current habitat catalog.
- [x] Locate current move catalog.
- [x] Locate current flow controller.
- [x] Locate existing focused tests that can guard future TDD slices.
- [x] Defer story beat and dialogue ownership mapping to a follow-up audit only if
  a later slice needs it.
- [x] Defer runtime interaction handler mapping to a follow-up audit only if a
  content slice needs it.

## 3. Current Content Inventory

- [x] Record current high-level counts for quests, items, recipes, regions, NPCs,
  interactables, resources, barriers, habitats and moves.
- [x] Record which habitats and moves are currently active vs planned.
- [x] Record that current world regions are spatial regions, not final biome
  progression definitions.
- [x] Produce a detailed quest-by-quest classification only after the story bible
  slice is approved.
- [x] Produce a detailed item/recipe classification only after the recipe taxonomy
  slice is approved.

## 4. Architecture Notes

- [x] Record current system ownership candidates.
- [x] Record architecture graph status and hub-risk findings at a summary level.
- [x] Identify high-risk systems that should not be changed by content tasks.
- [x] Convert ownership candidates into an architecture pattern map in the next
  roadmap slice.

## 5. TDD Gate For Future Work

- [x] Identify existing tests that can anchor future behavior-preservation work.
- [x] For each future implementation slice, write or update the focused failing
  test before changing implementation.
- [x] For each future implementation slice, document the regression guard and
  focused verification command in that slice's task list.

## 6. Validation

- [x] Confirm the audit files exist under `openspec/changes/audit-current-game-state`.
- [x] Confirm no gameplay/source/test files changed as part of this audit.
- [x] Confirm the final answer reports this as a documentation-only audit.
