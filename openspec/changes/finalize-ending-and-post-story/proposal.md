# Change: Finalize ending and post-story

## Why

The final game needs a clear ending trigger and a safe state after credits. The
story data already defines required macro-biome signals, missing-goal feedback,
final interaction, credits playback state and post-story sandbox state. This change
scopes the implementation work that turns those contracts into a scripted final
completion flow without making optional content block credits.

## What Changes

- Define the final completion flow from readiness check to credits playback.
- Define the final mentor/reminder behavior when goals are missing.
- Define the final interaction with the Skyforge Beacon and final builder.
- Define post-story sandbox availability after credits complete.
- Require a scripted smoke test before implementation is considered complete.

## Non-Goals

- Do not implement new macro-biomes or regional content in this slice.
- Do not change final required goals beyond the existing signal contract.
- Do not make general, optional, decorative or post-story content block credits.
- Do not change camera, input, render frame, stage, scene flow or runtime boot.
- Do not combine this work with final-region traversal/platform implementation.

## Preflight

- Objective: scope the ending and post-story implementation slice.
- Existing context: `finalReadinessData` defines required goals, feedback,
  final interaction, credits transition and post-story sandbox state.
- Likely files for future implementation: final readiness tests, quest/story
  integration tests, UI presenter tests, smoke/e2e scripted state and final
  interaction wiring.
- Smallest safe change now: add OpenSpec documentation only.
- Files not to touch now: gameplay runtime, camera, input, render frame, stage,
  scene flow, renderer and browser smoke tests.
- Risk: ending work can accidentally make optional content mandatory or reset
  completed story state; implementation must be guarded by focused and smoke tests.
- Size: medium as an implementation slice, small for this promotion step.

## Story Context

The ending is the moment the restored beacon gathers every regional signal and
proves the island can guide itself again. Credits are not a shutdown; after credits,
restoration becomes daily care. The player can keep taking optional requests,
mastering habitats, decorating, collecting and exploring without losing completed
story state.
