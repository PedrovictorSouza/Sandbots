# Change: Finalize Act 1 starting biome and first repair

## Why

After the opening proves that a home can be restored, Act 1 needs one shared repair
goal that turns personal recovery into community progress. The Ash Wilds should not
open the larger route network just because the player finished tutorial tasks; it
should open after the player repairs a visible shared hub, understands material
turn-in, and sees NPC dialogue respond to the rebuilt space.

## What Changes

- Define the first shared hub/center repair in the starting macro-biome.
- Define the challenge/request board equivalent that appears after discovery.
- Define material requirements, helper request and repair confirmation behavior.
- Define the completion flag/token handoff that unlocks the next routes.
- Require focused tests before implementation touches quest, material, UI or gate
  behavior.

## Non-Goals

- Do not implement Tidefall Coast, Granite Ridge or later routes in this slice.
- Do not redesign the opening/first-home slice.
- Do not refactor `gameplayContent.js`, `world/islandWorld.js` or runtime hubs.
- Do not change camera, input, render frame, stage, scene flow or runtime boot.
- Do not combine this work with naming migration or asset replacement.

## Preflight

- Objective: scope the first community repair as a TDD implementation slice.
- Likely files for future implementation: quest/story tests, repair/material data,
  request-log presenter, scenario gate data and current recipe/item taxonomy.
- Smallest safe change now: add OpenSpec documentation only.
- Files not to touch now: gameplay runtime, camera, input, render frame, stage,
  scene flow, renderer and broad world/session builders.
- Risk: hub repair touches material consumption, request availability, dialogue,
  route gates and completion flags; implementation must be split into focused
  tests.
- Size: medium as an implementation slice, small for this promotion step.

## Story Context

The shared hub is the first place that proves restoration is not only private. Aunty
and Chopper need the hub repaired because it gives the Ash Wilds a safe meeting
point, a request board and a reason for helpers to coordinate. Material gathering
becomes community repair: the player is no longer collecting resources for a list,
but rebuilding the place that lets the region ask for help.

Completing this repair grants the starting-biome proof needed to open the larger
journey toward Tidefall Coast and Granite Ridge.
