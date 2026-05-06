# Change: New Early-Game UX, Saving, Onboarding, Settings And Player Identity Flow

## Why

The first playable minutes need to feel intentional, readable and reliable
without turning into abstract tutorial screens. The player should learn through
Chopper, the island and the actions they perform in the world.

The current opening already has Chopper guidance, restoration actions, helper
robots, station work and quest HUD pieces. This change scopes a safer first-run
experience around those existing pieces while preserving the current flow until
implementation is split into focused tasks.

The narrative rule for helper robots is:

> The island is not empty. It is in standby mode.

Robots do not appear from nowhere. They are detected, found, repaired and
reactivated as part of the old island infrastructure, the accident history or
Bill and Chopper's prior work.

## What Changes

- Add an autosave contract with explicit progression triggers and a small
  "Saving..." indicator.
- Define a cinematic fade and camera setup before the first Chopper dialogue.
- Introduce FieldDex/Pokedex as an in-world discovery instead of a loose button.
- Add a first-dialogue player name prompt with a traditional virtual keyboard.
- Make NPC address copy use the confirmed player name when available.
- Make Settings available from Select at the start of the game.
- Define an expandable settings architecture for camera, volume, language and
  accessibility options.
- Add a short freedom window after the first required taught action.
- Reframe early helper robots as discovered dormant infrastructure that is
  repaired and reactivated.

## Non-Goals

- Do not implement all features in one coding pass.
- Do not replace the full save format without a migration plan.
- Do not rewrite the quest system, input system, camera system or renderer as
  part of this proposal.
- Do not add long explanatory tutorial screens.
- Do not make helper robots spawn magically or silently.
- Do not block the player in Settings before they can move unless required for
  accessibility.
- Do not change existing source-facing IDs unless a focused naming migration owns
  that change.

## Preflight

- Objective: define the first-run UX contract for saving, Chopper onboarding,
  FieldDex discovery, player identity, Settings and early freedom.
- Likely files for future implementation: save/session state modules,
  `app/runtime/gameLoop.js`, `app/bootstrap/createApplicationRuntime.js`,
  input binding/controller modules, quest/story data, HUD/panel presenters and
  new focused tests.
- Smallest safe change now: add OpenSpec documentation only.
- Files not to touch now: runtime, input, camera, stage, render frame, scene
  flow, renderer, asset loaders and save format implementation.
- Risk: implementation is large and crosses persistence, UI, input, camera,
  dialogue and quest state. Each feature needs a small owning slice with focused
  tests before code changes.
- Size: large as an implementation package, small as this proposal step.

## Implementation Strategy

Implementation should be split into independent slices:

1. Autosave event contract and indicator.
2. Settings model and Select menu shell.
3. First Chopper cinematic transition.
4. Player name input and NPC copy interpolation.
5. FieldDex narrative unlock.
6. Early freedom window after first taught action.
7. Robot discovery/reactivation framing for early helpers.

Each slice should name its owning systems, add tests first where practical and
avoid broad runtime rewrites.

