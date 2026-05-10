# Change: Add PSX Distance Fog

## Why

Small Island is moving toward a colder, foggier planet while keeping its cozy
repair identity. The world needs atmospheric distance fade that supports the
low-poly/PSX direction, reduces distant visual clutter and avoids abrupt world
pop-in. The effect must stay readable for gameplay and must not wash out HUD,
dialogue, quest tracker, prompts or menus.

This is a rendering-atmosphere proposal only. Fog touches renderer, scene
configuration and gameplay readability, so implementation should be split into
small verified slices.

## What Changes

- Add a configurable PSX-style distance fog contract for world rendering.
- Require scene or preset-level fog settings with named values for enabled,
  color, near distance, far distance and intensity.
- Keep UI and overlay layers visually unaffected by fog.
- Preserve readability for the player, active NPCs, objective markers,
  interaction prompts and valid ability targets.
- Keep the direction simple, dense and stylized instead of volumetric or
  expensive.

## Non-Goals

- Do not implement full volumetric lighting.
- Do not rewrite camera, stage, input, quest or UI systems as part of this
  proposal.
- Do not make default gameplay feel like a full horror-mode visual rewrite.
- Do not hide progression-critical objects behind fog.
- Do not place unexplained fog numbers directly in render logic.

## Preflight

- Objective: define the rendering-atmosphere rules for PSX distance fog.
- Likely files for future implementation: renderer/world draw path, scene
  configuration, session presets, focused renderer tests or visual smoke.
- Smallest safe change now: OpenSpec documentation only.
- Files not to touch now: camera, gameplay rules, input, quest progression,
  stage sizing and UI layout.
- Risk: renderer integration is high-risk because it can affect readability and
  every scene. Implementation must be incremental.
- Size: large as a full feature, small for this proposal slice.

## Implementation Strategy

1. Add named fog preset data and tests for default/preset resolution.
2. Apply fog only in the world render path, not DOM/UI overlay paths.
3. Add a default gameplay fog preset and allow scene overrides.
4. Verify player/NPC/objective/target readability at near interaction distance.
5. Run focused tests, build and browser visual smoke before tuning.
