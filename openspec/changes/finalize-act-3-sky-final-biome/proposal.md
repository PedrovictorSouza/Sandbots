# Change: Finalize Act 3 sky/final biome

## Why

The final macro-biome must test the systems learned across Ash Wilds, Tidefall
Coast and Granite Ridge without becoming a broad traversal or camera rewrite.
Skyforge Spires is the separated final space: it opens only after both intermediate
signals, uses late traversal and platform/lift progression, and culminates in a
staged beacon repair owned by Tova with guidance from Aero.

This change scopes Act 3 before implementation so final-region gates, traversal
requirements, large-building stages, helper dependencies and the `sky-signal`
handoff can be added with focused tests.

## What Changes

- Define Skyforge Spires entry from `tide-signal` and `forge-signal`.
- Define the elevated/separated final-region purpose.
- Define Aero's traversal mentor role and Tova's staged beacon repair role.
- Define platform/lift progression and late traversal ability requirements.
- Define staged large-building repair requirements and final token/rank handoff.
- Require focused tests before changing gates, traversal, staged repair or UI
  requirements.

## Non-Goals

- Do not implement credits playback or post-story sandbox in this slice.
- Do not change camera, input, render frame, stage, scene flow or runtime boot.
- Do not add physics/platform systems without a separate high-risk spec.
- Do not redesign Tidefall Coast or Granite Ridge completion.
- Do not combine this work with asset/model replacement or naming migration.

## Preflight

- Objective: scope Skyforge Spires as the final macro-biome implementation slice.
- Likely files for future implementation: scenario gate data, quest/story tests,
  staged repair catalog, late traversal ability data, UI presenter requirements and
  final readiness token data.
- Smallest safe change now: add OpenSpec documentation only.
- Files not to touch now: gameplay runtime, camera, input, render frame, stage,
  scene flow, renderer, physics/platform code and broad world/session builders.
- Risk: final-region work touches traversal, gates, staged repair, route return,
  final readiness and potentially camera/stage assumptions; implementation must be
  split into focused tests and separate high-risk specs when needed.
- Size: large as an implementation slice, small for this promotion step.

## Story Context

Skyforge Spires is elevated and separated because it is the island's final proof:
the player must reconnect what the previous regions restored before the beacon can
guide anyone. Aero tests route planning and late traversal. Tova turns prior lessons
into staged beacon repair: habitats, materials, movement, light, comfort and helpers
all matter. Completing the region grants `sky-signal`, making the ending possible.
