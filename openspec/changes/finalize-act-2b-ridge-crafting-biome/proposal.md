# Change: Finalize Act 2B ridge/crafting biome

## Why

After Ash Wilds is repaired, the player needs a second parallel intermediate biome
that tests material mastery and community morale. Granite Ridge is the crafting
route: heavy terrain, collapsed workshop paths and tired residents require stronger
tools, rescue work, cooking and a celebration goal before the region can contribute
to the final beacon.

This change scopes Act 2B before implementation so entry gates, specialist rescue,
heavy-object interactions, crafting/cooking progress and the `forge-signal`
completion token can be added with focused tests.

## What Changes

- Define the Granite Ridge entry condition from the starting-biome completion.
- Define the ridge conflict around heavy terrain, collapsed routes and crafting
  mastery.
- Define the specialist rescue and celebration/mood request chain.
- Define the powered-up action, hard-rock or advanced traversal ability slot.
- Define the ridge recipe/material tier and region completion token.
- Require focused tests before changing world actions, material turn-in, ability
  unlocks, request state or gates.

## Non-Goals

- Do not implement Tidefall Coast, Skyforge Spires or the ending.
- Do not require Granite Ridge to be completed before Tidefall Coast.
- Do not change camera, input, render frame, stage, scene flow or runtime boot.
- Do not refactor shared crafting/runtime hubs as part of this content slice.
- Do not combine this work with naming migration or asset replacement.

## Preflight

- Objective: scope Granite Ridge as the second parallel intermediate macro-biome.
- Likely files for future implementation: scenario gate data, quest/story tests,
  material and recipe catalogs, world/action interaction tests, companion ability
  data, region progress UI presenters and final readiness token data.
- Smallest safe change now: add OpenSpec documentation only.
- Files not to touch now: gameplay runtime, camera, input, render frame, stage,
  scene flow, renderer and broad world/session builders.
- Risk: ridge/crafting work touches world breaking, heavy-object interactions,
  crafting, cooking, rescues, celebration state and route gates; implementation must
  be split into focused tests.
- Size: medium as an implementation slice, small for this promotion step.

## Story Context

Granite Ridge is heavy, blocked and tired. Mica's rescue turns stronger materials
from abstract upgrades into help for a stranded specialist. Riff reframes tools,
cooking and party materials as proof that repair is becoming culture, not only
survival. Completing the ridge grants `forge-signal` and proves the second half of
the route network is ready for the final biome.
