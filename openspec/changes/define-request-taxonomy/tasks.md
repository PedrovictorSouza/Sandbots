# Tasks: Define request taxonomy

## 1. Taxonomy Contract

- [x] Define canonical request kinds.
- [x] Define request archetypes.
- [x] Define which kinds can block credits.
- [x] Define required request metadata.
- [x] Keep this change documentation-only.

## 2. Implementation Tasks

- [x] Add request taxonomy data module with request kinds and archetypes.
- [x] Add tests that only important requests block credits by default.
- [x] Add tests that general, optional and debug requests cannot block credits.
- [x] Add tests that planned requests cannot block credits.
- [x] Add tests that token-granting requests must be important.
- [x] Add tests that required requests map to a macro-biome and character arc.

## 3. Future Integration Tasks

- [x] Audit existing quest catalogs against the taxonomy.
- [x] Add external taxonomy metadata for existing quest definitions without changing
  runtime quest data.
- [x] Defer request UI updates until taxonomy metadata exists and tests protect
  current behavior.

## 4. Validation

- [x] Confirm this OpenSpec change exists under
  `openspec/changes/define-request-taxonomy`.
- [x] Confirm no gameplay/source/test files are changed by this contract.
