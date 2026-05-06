# Tasks: Finalize ending and post-story

## 1. TDD And Regression Guards

- [x] Identify existing final quest and end-state behavior that must not regress.
- [x] Add or update a focused test that credits do not trigger early.
- [x] Add or update a focused test that credits trigger after required goals.
- [x] Add or update a focused test for final completion flag.
- [x] Add or update a focused test for post-story sandbox availability.
- [x] Add or update a focused test for mentor reminder naming missing goals.
- [x] Add or update a smoke test that reaches final completion through scripted
  state.
- [x] Record the focused and smoke verification commands for this slice:
  - Focused: `npm run test -- tests/finalReadinessData.test.js`
  - Smoke: `npm run test -- tests/finalCompletionSmoke.test.js`

## 2. Story Context

- [x] Define final required goals list.
- [x] Define final mentor/council reminder text.
- [x] Define final interaction setup.
- [x] Define ending cutscene emotional payoff.
- [x] Define credits state.
- [x] Define post-story fiction.

## 3. Architecture Ownership

- [x] Assign final readiness check to Quest State Machine or Scenario System.
- [x] Store final required goal list in catalog/registry data.
- [x] Use UI Presenter for missing-goal feedback.
- [x] Keep credits state separate from optional post-story activity state.
- [x] Confirm final interaction wiring must not make input handlers own story flags.
- [x] Confirm camera, stage, render frame and scene flow changes need separate
  high-risk specs if credits presentation requires them.

## 4. Content Decisions

- [x] Define all required important requests for credits.
- [x] Define which general requests can remain optional.
- [x] Define required comfort/environment-level thresholds for credits, if any.
- [x] Define which recipe categories remain optional/post-story.
- [x] Define which rare recipes are completion rewards rather than credits blockers.
- [x] Define final interaction location/character.
- [x] Define final readiness check.
- [x] Define missing-goal feedback.
- [x] Define ending cutscene trigger.
- [x] Define credits playback or credits state transition.
- [x] Define final completion flag.
- [x] Define post-story sandbox state.
- [x] Define repeatable post-story activities.

## 5. Validation

- [x] Confirm this OpenSpec change exists under
  `openspec/changes/finalize-ending-and-post-story`.
- [x] Confirm this promotion step does not change gameplay/runtime/source behavior.
- [x] Run focused tests added by this implementation slice.
- [x] Run final completion smoke test after implementation changes.
- [x] Run `npm run architecture:graph` after implementation changes.
- [x] Run build after implementation changes.
