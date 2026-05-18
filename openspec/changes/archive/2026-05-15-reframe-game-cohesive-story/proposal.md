# Change: reframe-game-cohesive-story

## Why

Sandbots must stop reading like a provisional Pokemon-inspired prototype and become
one coherent original game: bots restoring a small planet so humans can eventually
live there. Current systems already contain useful work for camera, UI, building,
placement, dialogue and progression, but player-facing names and some quest logic
still mix old external-IP language with the new colony premise.

## What Changes

- Establish a narrative source of truth for Sandbots.
- Map external-IP-derived user-facing terms to original Sandbots terminology.
- Replace visible Pokemon-style names, labels, dialogue and quest copy in safe
  vertical slices.
- Preserve useful systems and avoid broad runtime or save-facing renames until
  references are mapped.
- Rebuild early progression into a causal colony-restoration chain where each
  objective follows from a visible machine, bot, resource or world rule.

## Non-Goals

- Do not rename save-facing or asset-facing ids in the first pass.
- Do not rewrite camera, renderer, input, stage or scene orchestration as part of
  copy migration.
- Do not add large new mechanics before the existing content is coherent.
- Do not remove working systems just because their current names are provisional.

## Preflight

- Objective: reframe the current game into an original Sandbots colony-builder /
  outpost-restoration experience.
- Likely files: story/content data, dialogue data, quest data, item labels, HUD
  copy, Codex/Pokedex presentation and narrative docs.
- Smallest safe first change: create the change spec, narrative bible and
  terminology map before touching broad visible content.
- Do not touch in the first pass: render frame, camera internals, input bindings,
  grid placement, asset loading, save migrations and scene flow.
- Risks: broad symbol renames can break saves, tests and progression flags; visible
  content can be changed safely before source ids.
- Size: large. Must be implemented through small reversible slices.
