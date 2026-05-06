# Change: Define placeholder policy

## Why

The final-game roadmap needs room for temporary objects, unfinished assets and
planned content while the game is still being completed. Placeholders are useful for
TDD and content planning, but unmanaged placeholders can accidentally block credits,
leak into player-facing UI as finished content, or force broad refactors when final
assets arrive.

This change defines how placeholders may be used without breaking implemented
systems or confusing planned content with playable content.

## What Changes

- Define placeholder lifecycle states for content, assets and UI.
- Require every placeholder to declare an owner, purpose, replacement condition and
  progression impact.
- Forbid unfinished placeholders from blocking credits or required macro-biome
  completion unless a spec explicitly marks them as playable temporary content.
- Require TDD around any placeholder that affects quest progress, gates, rewards,
  inventory, recipes, habitats, moves or UI availability.
- Define how placeholders should be replaced without touching unrelated systems.

## Non-Goals

- Do not add or replace placeholder assets in this change.
- Do not implement new status fields in source code yet.
- Do not change current `PLACEHOLDER_RECIPES`, habitat statuses or move statuses.
- Do not alter gameplay, camera, input, render frame, stage, scene flow or runtime
  behavior.

## Preflight

- Objective: create a small specification for safe placeholder usage.
- Existing signals: `PLACEHOLDER_RECIPES` in `gameplayContent.js`, `planned` status
  in habitat and move catalogs, and audit notes warning that planned content can be
  confused with playable unlocks.
- Smallest safe change: add OpenSpec documentation only.
- Files not to touch: gameplay source, runtime files and tests.
- Risk: if future placeholders are not tagged, they may become invisible blockers
  in quests, gates or credits.
- Size: small.

## Placeholder Model

Use placeholders only when they help ship a verified slice. Each placeholder should
fit one lifecycle state:

| State | Meaning | May Block Required Progress? |
| --- | --- | --- |
| `planned` | Known future content with no playable behavior yet. | No. |
| `prototype` | Temporary playable implementation used to validate a loop. | Only if the owning spec says so and tests cover it. |
| `stub` | Technical stand-in needed for tests, UI layout or data wiring. | No. |
| `temporary-art` | Visual/audio stand-in for an implemented object or character. | Yes, only if gameplay behavior is final and asset swap is isolated. |
| `final` | Content is production-ready for the current milestone. | Yes, when the spec requires it. |

## Required Metadata

Future placeholders should record:

- Stable id.
- Placeholder state.
- Owner system or catalog.
- Reason it exists.
- Replacement condition.
- Whether it is visible to players.
- Whether it can affect required progression.
- Regression guard or focused test when it affects gameplay.

## Current Project Fit

- `PLACEHOLDER_RECIPES` should remain treated as temporary recipe catalog data until
  recipe taxonomy work decides which entries become final.
- Habitat and move entries with `planned` status should not become required credits
  blockers.
- Final macro-biome work may use prototype objects, but each prototype must be tied
  to one small spec and one focused test.
- Temporary art should be replaceable by data or asset path changes, not by camera,
  renderer, input or scene-flow changes.

## Recommended Next Slices

1. Add placeholder metadata to the recipe taxonomy slice.
2. Add tests that planned habitats and moves are excluded from required progression.
3. Add a temporary-art registry only when a final-content slice actually needs
   missing assets.
