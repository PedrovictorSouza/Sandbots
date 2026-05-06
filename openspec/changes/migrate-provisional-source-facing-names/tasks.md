# Tasks: Migrate provisional source-facing names

## 1. Migration Contract

- [x] Define naming migration scope.
- [x] Require behavior-preserving tests before renaming.
- [x] Separate player-facing copy changes from stable source id changes.
- [x] Keep this change documentation-only.

## 2. Future Migration Tasks

- [x] Defer inventory of provisional source ids, display labels, dialogue, quest
  text, item names, recipe names and asset-facing names until a dedicated
  migration implementation slice.
- [x] Defer classification of each entry as player-facing copy, stable source id,
  save-facing id, asset reference or test fixture until the migration slice.
- [x] Require focused tests for every player-facing label before that label
  changes.
- [x] Require compatibility or migration tests before changing any save-facing or
  stable source id.
- [x] Require copy-only labels to be renamed first while stable ids remain
  untouched when possible.
- [x] Require every intentional id rename to document the old id, new id,
  compatibility plan and rollback risk.

## 3. Regression Guards

- [x] Naming migrations must not change quest availability, rewards, completion
  flags, inventory behavior or route gates.
- [x] Naming migrations must not touch camera, input, render frame, stage, scene
  flow or broad runtime orchestration.
- [x] Naming migrations must not add new final-game content in the same slice.
- [x] Naming migrations must preserve existing behavior through focused tests and
  build validation.

## 4. Validation

- [x] Confirm this OpenSpec change exists under
  `openspec/changes/migrate-provisional-source-facing-names`.
- [x] Confirm no gameplay/source/test files are changed by this migration spec.
