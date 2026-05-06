# Change: Audit current game state

## Why

Before adding the remaining characters, requests, regions, recipes and ending path,
we need a small, factual map of what the game already implements. The project already
has active story, quest, habitat, move, UI, runtime and test systems. Adding final
content without an audit would risk overwriting working behavior or pushing broad
changes into camera, input, render frame or scene flow.

This change creates the first audit slice for the final-game roadmap. It is a
documentation-only step: it does not change gameplay, data, tests or runtime code.

## What Changes

- Add an OpenSpec audit for current quests, flags, regions, items, recipes, NPCs,
  interactables, habitats, moves and tests.
- Record the likely ownership boundaries for story, quest, habitat, movement,
  scene flow, input, rendering and UI systems.
- Identify the safest next implementation slices for finishing the game with TDD.
- Record risky coupling points that should not be refactored during content work.

## Non-Goals

- Do not implement new game content in this change.
- Do not change `gameplayContent.js`, runtime files, scene flow, input, camera,
  renderer, stage, UI overlays or tests.
- Do not rename existing story flags, quests, NPC ids, item ids or region ids.
- Do not consolidate systems yet, even when the audit finds duplication.

## Preflight

- Objective: create a read-only current-state audit to guide the next OpenSpec
  tasks.
- Files likely involved: `gameplayContent.js`, `story/progression.js`,
  `app/sandbox/habitatData.js`, `app/sandbox/moveData.js`, `gameFlow.js`, tests
  under `tests/`.
- Smallest safe change: add OpenSpec documentation only.
- Files not to touch: all gameplay/runtime/source/test files.
- Risk: the game has several overlapping systems for story, quest events, story
  beats, dialogue and runtime flags. Implementation should wait until the audit is
  accepted.
- Size: medium as an audit, small as a file change because it only adds docs.

## Initial Audit Findings

These findings come from targeted search and small reads, not from a full project
audit.

| Area | Current Observation |
| --- | --- |
| Story state | `story/progression.js` owns `createStoryState()` and initializes many Act 1 / early hub flags. |
| Main story catalog | `gameplayContent.js` currently exports 16 `STORY_QUESTS`. The visible route is a placeholder five-act arc: Tangrowth, Aunty, Bufo, Willow and dinner. |
| Items and recipes | `gameplayContent.js` exports 23 item definitions and 6 placeholder recipes. Current recipes are starter/placeholder focused. |
| Regions | `gameplayContent.js` exports 11 world regions. These are spatial regions, not yet the final biome progression model. |
| NPCs and interactables | `gameplayContent.js` exports 4 NPCs, 8 interactables, 25 resource nodes and 6 dynamic barriers. |
| Habitats | `app/sandbox/habitatData.js` exports 11 habitats: 3 active and 8 planned. Current biome ids include `ash-wilds` and `bleak-shore`. |
| Moves | `app/sandbox/moveData.js` exports 14 moves: 2 active and 12 planned. Active move presentation is concentrated on Water Gun and Leafage. |
| Flow | `gameFlow.js` has a small explicit flow controller: start, intro, cinematic, tutorial and gameplay. |
| Tests | The repo already has focused tests for quest systems, story beats, habitats, moves, game flow, input, runtime flags, UI, camera, render frame and world systems. |
| Architecture graph | `docs/architecture-cycle-graph.md` reports 119 nodes, 187 directed edges, 0 cycles and 9 hub-risk findings. |

## Initial Risk Register

| Risk | Why It Matters | Safe Handling |
| --- | --- | --- |
| Runtime flag mutation is spread through gameplay runtime and story systems. | New content could accidentally depend on hidden side effects. | Add focused tests around one slice before touching flags. |
| `gameplayContent.js` mixes item, region, recipe, quest, NPC, interactable and barrier data. | It is convenient but can become a large hub. | Keep new data slices small; extract only behind a separate refactor spec. |
| Final roadmap biomes do not map 1:1 to current world region ids. | Biome progression could be confused with spatial labels. | Introduce biome model only through a TDD data slice after this audit. |
| Many habitats and moves are planned. | UI may display future concepts that are not playable. | Separate catalog completeness from playable unlocks. |
| Camera, render frame, stage and input are high-risk systems. | Content work should not destabilize game feel. | Treat changes there as separate specs with focused regression tests. |

## Recommended Next Slices

1. Create a source-of-truth story bible for the original game fiction, replacing
   direct reference-game names with this project's characters, regions and stakes.
2. Add a biome progression data spec and test for starting biome, two parallel
   intermediate biomes, final biome and credits gate.
3. Add a request taxonomy test that distinguishes important requests from general
   requests without changing current quest behavior.
4. Add a recipe taxonomy/catalog test that classifies current recipes and prepares
   expansion by unlock source, category, progression role and economy tier.
5. Only after those data tests pass, implement the first final-content slice.
