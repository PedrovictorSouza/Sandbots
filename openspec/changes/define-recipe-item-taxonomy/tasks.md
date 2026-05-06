# Tasks: Define recipe and item taxonomy

## 1. Taxonomy Contract

- [x] Define item categories.
- [x] Define recipe unlock sources.
- [x] Define progression roles.
- [x] Define economy tiers.
- [x] Define rules for required and optional recipes.

## 2. Implementation Tasks

- [x] Add recipe/item taxonomy data module.
- [x] Add tests for allowed categories, unlock sources, progression roles and
  economy tiers.
- [x] Add tests that required story recipes need macro-biome context.
- [x] Add tests that planned recipes cannot block credits.
- [x] Add tests that decoration/flavor and post-story recipes cannot block credits.

## 3. Future Integration Tasks

- [x] Add taxonomy metadata to existing `PLACEHOLDER_RECIPES`.
- [x] Add recipe packs per macro-biome after request taxonomy and biome progression
  data are stable.
- [x] Keep decorative recipe expansion separate from required credits path.

## 4. Validation

- [x] Confirm this OpenSpec change exists under
  `openspec/changes/define-recipe-item-taxonomy`.
- [x] Confirm no crafting/runtime/source files are changed by this contract.
