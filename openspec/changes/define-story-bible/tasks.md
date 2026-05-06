# Tasks: Define story bible

## 1. Story Contract

- [x] Define original campaign premise.
- [x] Define four target macro-biomes and stable ids.
- [x] Define completion token for each required macro-biome.
- [x] Define beginning, middle, end and post-story structure.
- [x] Define required character roles.
- [x] Define story rules for future slices.
- [x] Keep this change documentation-only.

## 2. Follow-Up Specs

- [x] Create `define-biome-progression-data` to turn the four macro-biomes into a
  tested data catalog.
- [x] Create `define-request-taxonomy` to classify required, general, tutorial,
  optional and debug requests.
- [x] Create `define-recipe-item-taxonomy` to classify recipes, materials,
  placeholders and economy tiers.
- [x] Create a migration spec for replacing provisional source-facing names only
  after tests protect existing behavior.

## 3. Future Implementation Tasks

- [x] Add tests that exactly four player-facing macro-biomes exist.
- [x] Add tests that the final macro-biome requires `tide-signal` and
  `forge-signal`.
- [x] Add tests that credits require `root-signal`, `tide-signal`, `forge-signal`
  and `sky-signal`.
- [x] Add tests that optional requests do not block credits.
- [x] Add tests that each required quest maps to one macro-biome and one character
  arc.

## 4. Validation

- [x] Confirm this OpenSpec change exists under
  `openspec/changes/define-story-bible`.
- [x] Confirm no gameplay/source/test files are changed by this story bible.
