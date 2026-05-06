# Tasks: New Early-Game UX, Saving, Onboarding, Settings And Player Identity Flow

## 1. Proposal Scope

- [x] Create OpenSpec change under `openspec/changes/new-features`.
- [x] Define narrative rule that helper robots are dormant/reactivated, not
  magical spawns.
- [x] Split implementation into smaller feature slices.
- [x] Confirm this proposal step does not change runtime behavior.

## 2. Autosave Slice

- [ ] Define autosave event names and payloads.
- [ ] Add focused tests for autosave trigger selection.
- [ ] Implement autosave trigger dispatch for task completion.
- [ ] Implement autosave trigger dispatch for new ability learned.
- [ ] Implement autosave trigger dispatch for robot reactivation.
- [ ] Implement autosave trigger dispatch for first required ability use.
- [ ] Implement autosave trigger dispatch for player name confirmation.
- [ ] Implement autosave trigger dispatch for major system unlocks.
- [ ] Add a non-blocking "Saving..." HUD indicator in the upper-left corner.
- [ ] Verify save indicator does not obscure dialogue-critical content.

## 3. Settings Slice

- [ ] Define settings schema with camera, volume, language and accessibility
  groups.
- [ ] Add default settings state.
- [ ] Add Select button route to open Settings from the beginning.
- [ ] Add a focused test that Select opens Settings before tutorial completion.
- [ ] Add Settings menu shell with expandable rows and safe cancel/close.
- [ ] Persist settings through the save/profile layer.

## 4. First Chopper Cinematic Slice

- [ ] Define one-shot first Chopper cinematic state flag.
- [ ] Add fade-out, camera framing and fade-in as a narrow scene transition.
- [ ] Ensure the first Chopper dialogue starts only after fade-in completes.
- [ ] Add focused tests or presenter/state tests for one-shot cinematic gating.
- [ ] Verify the change does not alter normal camera behavior after the opening.

## 5. Player Name Slice

- [ ] Define player profile state and default/fallback display name.
- [ ] Add first Chopper dialogue beat that requests the player's name.
- [ ] Implement traditional virtual keyboard name input.
- [ ] Support keyboard and gamepad navigation, selection, delete and confirm.
- [ ] Persist the confirmed name.
- [ ] Add dialogue interpolation for NPC lines that address the player.
- [ ] Add tests for confirmed name, fallback name and persistence.

## 6. FieldDex Slice

- [ ] Define FieldDex unlock flag and first discovery beat.
- [ ] Add Chopper or world event copy that explains the device in-world.
- [ ] Reveal FieldDex controls only after the discovery beat.
- [ ] Add focused tests that the FieldDex cannot be opened before unlock unless
  debug/test mode explicitly allows it.
- [ ] Add first FieldDex entry or empty-state copy tied to the discovered object.

## 7. Early Freedom Window Slice

- [ ] Define the first required taught action completion event.
- [ ] Add optional over-completion window after the required count is reached.
- [ ] Let the player continue the same action briefly before Chopper advances.
- [ ] Add a check-in or timeout condition so tutorial progression cannot stall
  permanently.
- [ ] Add tests for required completion, optional window and eventual advance.

## 8. Robot Reactivation Slice

- [ ] Identify each early robot's dormant discovery source.
- [ ] Add narrative copy for detection, repair and reactivation.
- [ ] Add explicit reactivation flags for early helpers.
- [ ] Add visual/audio/state feedback for reactivation.
- [ ] Add tests that helper robots become available through reactivation state,
  not silent spawn side effects.

## 9. Validation

- [ ] Run focused tests for each implementation slice.
- [ ] Run `npm run build` after implementation changes.
- [ ] Use browser/manual playthrough verification for the full new-game opening.
- [ ] Confirm any camera, input, stage, render frame or scene-flow expansion is
  split into its own focused change if it grows beyond this spec.

