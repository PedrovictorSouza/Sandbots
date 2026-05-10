# Change: Motion Readability And Impact Polish

## Why

Small Island already has restoration, helper robots, crash opening, Water Gun,
Leafage, crafting and task feedback. These actions work mechanically, but many
moments still need stronger visual readability: a clear first impact pose, short
holds, quick recovery, readable silhouettes and small non-mechanical variations.

This change adds a narrow motion-readability layer for cozy PSX feedback. It is
not a combat system. It should make existing world actions feel more alive
without changing core gameplay rules.

## What Changes

- Add a small data layer of named motion impact presets.
- Add a motion impact controller that can drive short reaction frames by delta
  time.
- Keep timings, intensities, ranges and durations in named constants.
- Let gameplay objects opt into reaction frames through adapters instead of
  direct mutation from the motion layer.
- Future slices may hook presets into crash impact, Water Gun hits, Leafage,
  robot/NPC bumps, tile restoration, workbench crafting and task completion.

## Non-Goals

- Do not turn the game into a fighting game.
- Do not add health, damage, hit stun, combo state or combat moves.
- Do not rewrite `gameLoop.js`, camera, renderer or input as part of the first
  slice.
- Do not create circular dependencies between motion, runtime, session objects
  and UI.
- Do not add tutorial screens. Feedback should appear in-world or through
  existing feedback surfaces.

## Preflight

- Objective: define and implement the first small, testable motion impact slice.
- Likely files: `app/motion/*`, focused unit tests, OpenSpec docs. Future runtime
  hooks may touch `app/runtime/gameLoop.js`, session actors, ground highlight,
  crafting UI or camera feedback in separate slices.
- Smallest safe implementation now: presets plus a standalone controller with
  tests.
- Files not to touch now: camera runtime, renderer, scene flow, input and the
  broad game loop.
- Risk: full feature scope crosses high-risk gameplay systems. Runtime
  integration must be done one event at a time.
- Size: large as a full feature, small for the first data/controller slice.

## Implementation Strategy

1. Add preset data and controller tests first.
2. Implement the standalone data/controller layer.
3. Validate with focused tests and build.
4. In later slices, hook one real gameplay event at a time:
   - Water Gun hit on restored/dry ground.
   - Workbench craft confirmation.
   - Quest completion pop.
   - Robot/NPC bump reaction.
   - Crash opening impact.
