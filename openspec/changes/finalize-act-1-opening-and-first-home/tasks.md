# Tasks: Finalize Act 1 opening and first home

## 1. TDD And Regression Guards

- [x] Identify existing opening/tutorial behavior that must not regress.
- [x] Add or update a focused test for first mentor interaction availability.
- [x] Add or update a focused test for first ability unlock.
- [x] Add or update a focused test for duplicate first-ability reward prevention.
- [x] Add or update a focused test for first habitat discovery.
- [x] Add or update a focused test for first companion request appearing in the
  request log.
- [x] Add or update a focused test for first recipe/workbench unlock.
- [x] Add or update a focused test for first placed-object objective completion.
- [x] Record the focused verification command for this slice:
  `npm run test -- tests/questSystem.test.js tests/questLog.test.js tests/storyBeatSystem.test.js`

## 2. Story Context

- [x] Define opening scene purpose.
- [x] Define why the mentor asks the player to restore the first habitat.
- [x] Define first companion's need/request.
- [x] Define how the first ability changes the player's relationship to the world.
- [x] Define why the first home/den matters emotionally.
- [x] Define how Act 1 foreshadows the final restoration.

## 3. Architecture Ownership

- [x] Assign opening progression to Quest State Machine.
- [x] Assign starting state creation to State Factory.
- [x] Assign mentor and companion definitions to Flyweight Catalogs.
- [x] Assign player and NPC spawning to Factory / Builder.
- [x] Assign tutorial UI and request-log text to UI Presenter.
- [x] Confirm Input System must not own story flags.
- [x] Confirm this slice must not change camera, stage, render frame or scene flow.

## 4. Content Decisions

- [x] Finalize starting avatar/customization decision.
- [x] Finalize mentor intro dialogue.
- [x] Finalize first ability name, source and controls hint.
- [x] Finalize first habitat ingredients and discovery source.
- [x] Finalize first companion spawn/unlock condition.
- [x] Finalize first companion request objective.
- [x] Finalize first request-log entry.
- [x] Finalize Act 1 general request pack: first restore request, first delivery
  request, first follow request and first home/habitat request.
- [x] Finalize Act 1 starter recipe pack: workbench item, first seat/table, first
  outdoor fire/rest item, first bed/home item and first personal marker.
- [x] Finalize Act 1 starter material tier as natural materials only unless a
  focused test justifies otherwise.
- [x] Finalize first reward and duplicate reward guard.
- [x] Finalize workbench interaction.
- [x] Finalize simple recipe.
- [x] Finalize first placeable object.
- [x] Finalize first home/den completion.
- [x] Finalize Act 1 celebration beat.

## 5. Validation

- [x] Confirm this OpenSpec change exists under
  `openspec/changes/finalize-act-1-opening-and-first-home`.
- [x] Confirm this promotion step does not change gameplay/runtime/source behavior.
- [x] Run focused tests added by this implementation slice.
- [x] Run build after implementation changes.
