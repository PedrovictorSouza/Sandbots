# Change: Define biome progression data

## Why

The story bible defines four macro-biomes, but future gameplay code needs a small
data contract for ids, completion tokens, entry requirements and credits readiness.
This change turns the story-bible structure into tested data without integrating it
into runtime gates yet.

## What Changes

- Add a pure macro-biome data catalog.
- Add helpers for biome lookup, entry requirements and missing tokens.
- Add helper for credits signal readiness.
- Keep intermediate water/beach and ridge/crafting biomes parallel after the
  starting token.

## Non-Goals

- Do not connect this data to runtime gates yet.
- Do not modify current `WORLD_REGIONS`.
- Do not change existing quests, flags, UI, camera, input, scene flow or rendering.

## Preflight

- Objective: make the four macro-biome contract testable.
- Existing context: `define-story-bible` defines the target ids and tokens.
- Smallest safe change: pure data module plus focused test.
- Risk: mixing player-facing macro-biomes with current internal spatial regions.
- Size: small.

## Implemented Data

| Macro-Biome | Token | Entry Requirement |
| --- | --- | --- |
| `ash-wilds` | `root-signal` | none |
| `tidefall-coast` | `tide-signal` | `root-signal` |
| `granite-ridge` | `forge-signal` | `root-signal` |
| `skyforge-spires` | `sky-signal` | `tide-signal`, `forge-signal` |

Credits readiness requires all four completion tokens.
