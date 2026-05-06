# Change: Finalize Act 1 opening and first home

## Why

Act 1 needs a narrow implementation slice that turns the existing opening, mentor,
first companion, first ability, first habitat and first home loop into the stable
start of the final game. The current project already has opening movement, Chopper,
early restoration, active Water Gun and Leafage abilities, habitat discovery,
workbench/crafting support and request-log UI pieces. This change scopes the final
opening path before any code changes.

## What Changes

- Define the first final-game opening path from first control to first home/den.
- Add focused tests before changing implementation.
- Keep current opening/tutorial behavior stable unless this spec explicitly changes
  it.
- Assign each part of the slice to the owning architecture system.
- Define the first mentor, companion, ability, request-log, recipe, placeable and
  celebration targets for implementation.

## Non-Goals

- Do not implement the larger Act 1 hub repair in this slice.
- Do not open Tidefall Coast, Granite Ridge or Skyforge Spires.
- Do not change camera, input, render frame, stage, scene flow or runtime boot.
- Do not rename provisional ids; use the naming migration spec for that.
- Do not replace current assets or add new 3D model orientation work.

## Preflight

- Objective: scope the first final playable path as a small TDD slice.
- Likely files for future implementation: quest data/system tests, story beat data,
  habitat data, request log presenter, recipe/crafting tests and current story data
  catalogs.
- Smallest safe change now: add OpenSpec docs only and mark this planned slice as
  promoted.
- Files not to touch now: gameplay runtime, camera, input, render frame, stage,
  scene flow, renderer and asset loaders.
- Risk: opening work touches tutorial, UI, story flags, abilities and crafting; each
  behavior must be protected by a focused test before implementation.
- Size: medium as an implementation slice, small for this promotion step.

## Story Context

The player enters Ash Wilds unsure whether the island can recover. Chopper asks for
one small proof of life: restore a dead patch and follow the response. The first
restored habitat reveals Sprig, the first companion request teaches that care brings
helpers back, and the first home/den proves the island can become livable instead
of merely passable.

This slice foreshadows the ending by making the first home a small version of the
final beacon: a repaired place that gathers signals, people and purpose.
