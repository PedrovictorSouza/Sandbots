# Tasks: Motion Readability And Impact Polish

## 1. Proposal Scope

- [x] Create OpenSpec change under
  `openspec/changes/motion-readability-impact-polish`.
- [x] Define that this is cozy motion readability, not a combat system.
- [x] Split implementation into small runtime-safe slices.
- [x] Identify `gameLoop`, camera, renderer and input hooks as future high-risk
  integration points.

## 2. Motion Preset And Controller Slice

- [x] Add focused tests for preset lookup and impact frame progression.
- [x] Add named motion impact preset ids and timing/intensity constants.
- [x] Add `water-gun-hit` preset with freeze, recovery, jolt, pulse and
  camera-readable metadata.
- [x] Add additional reusable presets for tile restore, robot bump, workbench
  craft, task completion and crash impact.
- [x] Implement a delta-time motion impact controller.
- [x] Keep target updates adapter-based through `applyMotionImpact(frame)`.
- [x] Confirm unknown presets fail safely.

## 3. Water Gun Runtime Hook Slice

- [ ] Identify the single existing Water Gun hit event to own the first runtime
  trigger.
- [ ] Add adapter support for applying motion frames to the selected target.
- [ ] Trigger `water-gun-hit` without changing Water Gun gameplay rules.
- [ ] Add focused tests for the selected hook or adapter behavior.
- [ ] Verify the hit pose is readable and does not obscure tile targeting.

## 4. Workbench And Crafting Slice

- [ ] Trigger `workbench-craft` after a confirmed craft.
- [ ] Keep the workbench modal flow unchanged.
- [ ] Add focused test coverage for craft trigger dispatch.

## 5. Task Completion Slice

- [ ] Trigger `task-complete` from the existing task-completion feedback path.
- [ ] Keep current sound and HUD completion copy behavior intact.
- [ ] Add focused tests for dispatch without duplicate task completion events.

## 6. Crash And Character Reaction Slice

- [ ] Identify the existing crash impact timing owner.
- [ ] Trigger `crash-impact` without rewriting camera choreography.
- [ ] Add robot/NPC bump reactions only through actor-owned adapters.
- [ ] Verify opening readability manually because camera and scene flow are
  high-risk.

## 7. Validation

- [x] Run focused tests for the implemented controller slice.
- [x] Run `npm run build` after implementation changes.
- [ ] Use browser/manual verification for each runtime hook slice.
- [ ] Stop and split if integration requires broad game loop, camera or renderer
  rewrites.
