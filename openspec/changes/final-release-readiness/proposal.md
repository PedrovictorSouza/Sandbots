# Change: Final release readiness

## Why

After all final-game implementation slices land, the project needs one release gate
that proves the required story path, rewards, habitats, inventory/material
transactions, final completion, architecture graph, build and visual smoke still
hold together. This change scopes that final verification pass without pretending
the implementation work has already completed.

## What Changes

- Define the final release readiness checklist.
- Group focused unit, integration, smoke, graph, build and visual/browser
  validations.
- Require story bible and architecture pattern reviews before release.
- Keep release readiness as verification only, not a place for new gameplay
  features.

## Non-Goals

- Do not implement missing Act 1, Act 2, Act 3 or ending content in this slice.
- Do not change camera, input, render frame, stage, scene flow or runtime boot.
- Do not add new final-game features while performing release verification.
- Do not mark release checks complete until the commands or reviews have actually
  run after implementation.

## Preflight

- Objective: create the release verification spec for the final game path.
- Existing context: each promoted implementation slice owns its own focused tests
  and validation commands.
- Smallest safe change now: add OpenSpec documentation only.
- Files not to touch now: gameplay runtime, tests, source modules, camera, input,
  renderer, scene flow and browser automation setup.
- Risk: a final release pass can become a catch-all refactor; fixes discovered here
  must be split back into the smallest owning slice.
- Size: small as documentation, broad as eventual verification.

## Release Principle

Release readiness is a gate, not an implementation bucket. If a release check fails,
the fix should go to the smallest owning OpenSpec slice with a focused regression
test.
