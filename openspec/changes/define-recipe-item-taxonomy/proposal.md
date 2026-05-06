# Change: Define recipe and item taxonomy

## Why

The final game needs many objects, materials, recipes and decorations, but not every
object should be treated as required progression. A clear recipe/item taxonomy keeps
story-critical items small, lets decorative catalogs grow safely, and prevents
placeholder recipes from blocking credits.

## What Changes

- Define item categories used by future recipe catalogs.
- Define recipe unlock sources.
- Define progression roles for recipes and items.
- Define economy tiers by macro-biome phase.
- Define validation rules for required story recipes and optional decorative items.

## Non-Goals

- Do not replace existing `PLACEHOLDER_RECIPES` yet.
- Do not implement crafting UI changes.
- Do not change inventory, rewards, resource nodes or runtime crafting behavior.
- Do not import the full reference recipe list into the game.

## Preflight

- Objective: create a tested taxonomy for future recipe/item work.
- Existing context: `finish-game-roadmap` defines recipe axes; current source has a
  small placeholder recipe catalog.
- Smallest safe change: add OpenSpec documentation, then a pure data module and
  focused tests.
- Files not to touch: runtime crafting, UI, inventory and existing content data.
- Risk: broad recipe imports could overwhelm progression or make optional decor
  required.
- Size: small.

## Taxonomy Axes

| Axis | Allowed Values |
| --- | --- |
| Item category | `furniture`, `misc`, `outdoor`, `utility`, `building`, `block`, `material`, `special` |
| Unlock source | `first-workbench`, `request-reward`, `story-milestone`, `shop-threshold`, `environment-level`, `collection-count`, `first-material-pickup`, `world-pickup`, `random-daily`, `challenge-reward`, `debug` |
| Progression role | `required-story-item`, `habitat-ingredient`, `comfort-item`, `repair-material`, `traversal-utility`, `decoration-flavor`, `post-story-collectible`, `debug` |
| Economy tier | `starter-natural`, `coast-clay-glass`, `ridge-ore-cooking`, `sky-concrete-advanced`, `rare-post-story`, `debug` |

## Rules

- Required story recipes must have a specific macro-biome id or `global`.
- Required story recipes must not be `planned`.
- Decorative/flavor recipes must not block credits.
- Post-story collectibles must not be required before credits.
- Debug recipes must not appear in normal player progression.
- Large optional catalogs should be added after the required progression path is
  already testable.

## Recommended Next Slices

1. Add a taxonomy data module and tests.
2. Add metadata to current placeholder recipes in a migration slice.
3. Add recipe packs per macro-biome only after the required path for that
   macro-biome is specified.
