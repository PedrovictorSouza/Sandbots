# Tasks: New Early-Game UX, Saving, Onboarding, Settings And Player Identity Flow

## 1. Proposal Scope

- [x] Create OpenSpec change under `openspec/changes/new-features`.
- [x] Define narrative rule that helper robots are dormant/reactivated, not
  magical spawns.
- [x] Split implementation into smaller feature slices.
- [x] Confirm this proposal step does not change runtime behavior.

## 2. Autosave Slice

- [x] Define autosave event names and payloads.
- [x] Add focused tests for autosave trigger selection.
- [x] Implement autosave trigger dispatch for task completion.
- [x] Implement autosave trigger dispatch for new ability learned.
- [x] Implement autosave trigger dispatch for robot reactivation.
- [x] Implement autosave trigger dispatch for first required ability use.
- [x] Implement autosave trigger dispatch for player name confirmation.
- [x] Implement autosave trigger dispatch for major system unlocks.
- [x] Add a non-blocking "Saving..." HUD indicator in the upper-left corner.
- [x] Verify save indicator does not obscure dialogue-critical content.

## 3. Settings Slice

- [x] Define settings schema with camera, volume, language and accessibility
  groups.
- [x] Add default settings state.
- [x] Add Select button route to open Settings from the beginning.
- [x] Add a focused test that Select opens Settings before tutorial completion.
- [x] Add Settings menu shell with expandable rows and safe cancel/close.
- [x] Persist settings through the save/profile layer.

## 4. First Chopper Cinematic Slice

- [x] Define one-shot first Chopper cinematic state flag.
- [x] Add fade-out, camera framing and fade-in as a narrow scene transition.
- [x] Ensure the first Chopper dialogue starts only after fade-in completes.
- [x] Add focused tests or presenter/state tests for one-shot cinematic gating.
- [x] Verify the change does not alter normal camera behavior after the opening.

## 5. Player Name Slice

- [x] Define player profile state and default/fallback display name.
- [x] Add first Chopper dialogue beat that requests the player's name.
- [x] Implement traditional virtual keyboard name input.
- [x] Support keyboard and gamepad navigation, selection, delete and confirm.
- [x] Persist the confirmed name.
- [x] Add dialogue interpolation for NPC lines that address the player.
- [x] Add tests for confirmed name, fallback name and persistence.

## 6. FieldDex Slice

- [x] Define FieldDex unlock flag and first discovery beat.
- [x] Add Chopper or world event copy that explains the device in-world.
- [x] Reveal FieldDex controls only after the discovery beat.
- [x] Add focused tests that the FieldDex cannot be opened before unlock unless
  debug/test mode explicitly allows it.
- [x] Add first FieldDex entry or empty-state copy tied to the discovered object.

## 7. Early Freedom Window Slice

- [x] Define the first required taught action completion event.
- [x] Add optional over-completion window after the required count is reached.
- [x] Let the player continue the same action briefly before Chopper advances.
- [x] Add a check-in or timeout condition so tutorial progression cannot stall
  permanently.
- [x] Add tests for required completion, optional window and eventual advance.

## 8. Robot Reactivation Slice

- [x] Identify each early robot's dormant discovery source.
- [x] Add narrative copy for detection, repair and reactivation.
- [x] Add explicit reactivation flags for early helpers.
- [x] Add visual/audio/state feedback for reactivation.
- [x] Add tests that helper robots become available through reactivation state,
  not silent spawn side effects.

## 9. Validation

- [x] Run focused tests for each implementation slice.
- [x] Run `npm run build` after implementation changes.
- [x] Use browser/manual playthrough verification for the full new-game opening.
- [x] Confirm any camera, input, stage, render frame or scene-flow expansion is
  split into its own focused change if it grows beyond this spec.
