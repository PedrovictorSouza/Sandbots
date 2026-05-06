# Tasks: Final release readiness

## 1. Focused Story Verification

- [x] Run focused unit tests for final story data and readiness systems.
- [x] Run quest progression tests for the required story path.
- [x] Run reward and ability unlock tests.
- [x] Run habitat discovery tests for required habitats.
- [x] Run inventory and material turn-in tests.
- [x] Run final completion smoke test.
- [x] Record exact commands and outcomes.

## 2. Architecture And Build Verification

- [x] Run `npm run architecture:graph`.
- [x] Confirm the architecture graph has no new directed cycles.
- [x] Review hub-risk findings for ownership drift.
- [x] Run build.
- [x] Confirm no build-time asset or bundling regressions.

## 3. Visual And Playable Smoke

- [x] Run visual/browser smoke for the playable route if a dev server is needed.
- [x] Confirm the opening route loads.
- [x] Confirm core HUD/request-log surfaces render.
- [x] Confirm no obvious text overlap or blank world render in the smoke route.
- [x] Confirm final completion scripted state can reach post-story sandbox.

## 4. Narrative And Architecture Review

- [x] Review story bible for beginning-to-ending consistency.
- [x] Review each macro-biome completion signal against final readiness.
- [x] Review final required requests against request taxonomy.
- [x] Review recipe/material categories against recipe taxonomy.
- [x] Review architecture pattern map for ownership drift.
- [x] Split any discovered fixes into the smallest owning OpenSpec slice.

## 5. Validation

- [x] Confirm this OpenSpec change exists under
  `openspec/changes/final-release-readiness`.
- [x] Confirm this promotion step does not change gameplay/runtime/source behavior.
- [x] Complete release readiness only after all checks above pass after final
  implementation.
