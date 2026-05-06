# Change: Finalize Act 2A water/beach biome

## Why

After Ash Wilds is repaired, the player needs a parallel intermediate biome that
proves restoration can solve regional infrastructure problems, not only local home
or hub problems. Tidefall Coast is the water/beach route: flooded paths, blocked
flow and dim guidance make the region feel disconnected until cleanup and water
routing restore it.

This change scopes Act 2A before implementation so region gates, cleanup progress,
local characters, recipes, materials and the `tide-signal` completion token can be
added with focused tests.

## What Changes

- Define the Tidefall Coast entry condition from the starting-biome completion.
- Define the local environmental problem and cleanup/restoration request chain.
- Define the local guide and conflict character roles.
- Define the water traversal, cleanup or light/energy ability slot.
- Define the region completion token that contributes to final-biome unlock.
- Require focused tests before changing scenario gates, world interactions,
  request state, abilities or UI feedback.

## Non-Goals

- Do not implement Granite Ridge, Skyforge Spires or the ending.
- Do not require Tidefall Coast to be completed before Granite Ridge.
- Do not change camera, input, render frame, stage, scene flow or runtime boot.
- Do not replace water/beach assets or add new 3D model orientation work.
- Do not combine this work with naming migration.

## Preflight

- Objective: scope Tidefall Coast as the first parallel intermediate macro-biome.
- Likely files for future implementation: scenario gate data, quest/story tests,
  cleanup request data, companion ability data, recipe/material taxonomy, region
  progress UI presenters and final readiness token data.
- Smallest safe change now: add OpenSpec documentation only.
- Files not to touch now: gameplay runtime, camera, input, render frame, stage,
  scene flow, renderer and broad world/session builders.
- Risk: water/cleanup work can easily spread into world interactions, traversal,
  region transitions and rendering; each behavior must be protected by focused
  tests before implementation.
- Size: medium as an implementation slice, small for this promotion step.

## Story Context

Tidefall Coast is damaged by water in the wrong places and darkness where people
need guidance. Nami helps the player understand flow and cleanup as care work. Kelp
makes the damage personal: flooded homes and blocked infrastructure are not abstract
obstacles, they are places people cannot use. Completing the region restores the
coast signal and proves one half of the route network is ready for the final biome.
