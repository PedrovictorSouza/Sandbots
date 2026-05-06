# Tasks: Define placeholder policy

## 1. Policy Creation

- [x] Define placeholder lifecycle states.
- [x] Define required metadata for future placeholders.
- [x] Define rules for whether placeholders can block required progression.
- [x] Define replacement expectations for temporary assets.
- [x] Keep this change documentation-only.

## 2. Future Implementation Tasks

- [x] Add placeholder metadata to recipe/item catalogs when recipe taxonomy is
  implemented.
- [x] Add placeholder metadata to habitat catalogs when biome progression is
  implemented.
- [x] Add placeholder metadata to move/ability catalogs when ability progression is
  implemented.
- [x] Add tests that `planned` placeholders do not block required progress.
- [x] Add tests that prototype placeholders can block progress only when explicitly
  allowed by their owning spec.
- [x] Add tests that placeholder player visibility must be explicit.
- [x] Add replacement task links for any temporary art or audio used by required
  content.

## 3. Regression Guards For Future Slices

- [x] Placeholder additions must not rename existing ids without a migration spec.
- [x] Placeholder additions must not change camera, input, render frame, stage or
  scene flow.
- [x] Placeholder additions must not make optional content required for credits.
- [x] Placeholder replacements must be scoped to data or asset references whenever
  possible.

## 4. Validation

- [x] Confirm this OpenSpec change exists under
  `openspec/changes/define-placeholder-policy`.
- [x] Confirm no gameplay/source/test files are changed by this policy.
