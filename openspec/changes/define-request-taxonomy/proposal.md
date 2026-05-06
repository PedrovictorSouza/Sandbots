# Change: Define request taxonomy

## Why

The game needs a clear request taxonomy before adding more quests. Without explicit
request kinds, optional comfort work can accidentally become required for credits,
planned placeholders can become invisible blockers, and final macro-biome progress
can become hard to reason about.

This change defines the request classification contract for future content slices.

## What Changes

- Define the canonical request kinds: `important`, `general`, `tutorial`,
  `optional` and `debug`.
- Define which request kinds may block credits or macro-biome completion.
- Define request archetypes used by the roadmap.
- Require every required request to map to a macro-biome and character arc.
- Require planned requests to follow the placeholder policy and stay out of required
  progression.

## Non-Goals

- Do not rewrite existing quest data in this change.
- Do not implement new quests or request UI.
- Do not rename existing quest ids.
- Do not change runtime quest completion behavior.

## Preflight

- Objective: create a small taxonomy contract for requests.
- Existing context: `finish-game-roadmap` already describes important and general
  request behavior; `define-story-bible` requires required quests to map to a
  macro-biome and character arc.
- Smallest safe change: add OpenSpec documentation only.
- Files not to touch: gameplay source, runtime files and tests.
- Risk: future quest data can silently block credits if kind and progression impact
  are not explicit.
- Size: small.

## Request Kinds

| Kind | Purpose | May Block Credits? |
| --- | --- | --- |
| `important` | Multi-step story-critical request for macro-biome repair, final tokens or credits readiness. | Yes. |
| `general` | Shorter support request for comfort, abilities, recipes, habitats, environment level or local flavor. | No, unless promoted by a later spec. |
| `tutorial` | Onboarding request that teaches input, UI, movement or a first loop. | Yes only during onboarding, not as final credits filler. |
| `optional` | Side content, character depth, collection, decor or mastery challenge. | No. |
| `debug` | Developer-only or test-only request. | No. |

## Request Archetypes

Allowed archetypes are:

- `major-repair`
- `environmental-restoration`
- `initiation-challenge`
- `celebration-mood`
- `ability-unlock`
- `habitat-home`
- `crafting-cooking`
- `escort-follow`
- `delivery-show-item`
- `collection`
- `debug`

## Required Metadata

Future request definitions should record:

- Stable id.
- Kind.
- Archetype.
- Macro-biome id or `global`.
- Character arc id or `system`.
- Completion flag or token impact.
- Whether the request may block credits.
- Placeholder state when unfinished.
- Reward category, if any.

## Progression Rules

- Only `important` requests may be included in credits requirements by default.
- `tutorial` requests may gate onboarding but should not be used as hidden credits
  requirements.
- `general`, `optional` and `debug` requests must not block credits.
- A `planned` request must not block macro-biome completion or credits.
- Any request that grants a required macro-biome token must be `important`.
- Any required request must map to one of the four story-bible macro-biomes unless
  it is explicitly `global`.

## Recommended Next Slices

1. Add a small request taxonomy data module and tests.
2. Add tests that optional and general requests are excluded from credits blockers.
3. Add tests that important requests require a macro-biome and character arc.
