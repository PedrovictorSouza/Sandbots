# Tasks: Finalize Act 2A water/beach biome

## 1. TDD And Regression Guards

- [x] Identify existing water, cleanup and world interaction behavior that must not
  regress.
- [x] Add or update a focused test for Tidefall Coast entry gate condition.
- [x] Add or update a focused test for broken bridge or infrastructure objective.
- [x] Add or update a focused test for flood/blockage cleanup request progress.
- [x] Add or update a focused test for water traversal, cleanup or light/energy
  ability unlock.
- [x] Add or update a focused test for region mood/light/energy progress.
- [x] Add or update a focused test for major request completion.
- [x] Add or update a focused test for next gate availability after completion.
- [x] Add or update a focused test that Tidefall Coast grants `tide-signal`.
- [x] Record the focused verification command for this slice:
  `npm run test -- tests/biomeProgressionData.test.js tests/storyQuestData.test.js tests/moveData.test.js tests/characterArcData.test.js tests/finalReadinessData.test.js`

## 2. Story Context

- [x] Define local environmental problem.
- [x] Define local guide character motivation.
- [x] Define cleanup character request chain.
- [x] Define ability unlock meaning.
- [x] Define region restoration payoff.
- [x] Define how the water/beach region contributes to the ending.

## 3. Architecture Ownership

- [x] Assign region entry to Scenario System.
- [x] Assign cleanup progress to Quest State Machine.
- [x] Store ability and cleanup definitions in Flyweight Catalogs.
- [x] Use Observer / Event Queue for environmental progress if needed.
- [x] Use UI Presenter for region progress, mood and missing-goal feedback.
- [x] Confirm Input System must not own cleanup, route or completion flags.
- [x] Confirm this slice must not change camera, stage, render frame or scene flow.

## 4. Content Decisions

- [x] Finalize water/beach region entry.
- [x] Finalize local mentor beat.
- [x] Finalize broken bridge/infrastructure.
- [x] Finalize Act 2A important request: regional environmental restoration.
- [x] Finalize Act 2A important request: region hub recovery.
- [x] Finalize Act 2A general request pack: cleanup, lighting/energy, delivery,
  habitat/home and water-traversal support.
- [x] Finalize Act 2A recipe pack: water cleanup utility, beach/clay/glass props,
  lights, planters, bridge/walkway pieces and local decor.
- [x] Finalize Act 2A material tier: beach, clay, glass, shells, light/energy
  components and local water-route materials.
- [x] Finalize flood/blockage cleanup mechanics.
- [x] Finalize water traversal or cleanup ability.
- [x] Finalize local habitats.
- [x] Finalize required local characters.
- [x] Finalize major region request.
- [x] Finalize region completion flag.
- [x] Finalize `tide-signal` completion token handoff.
- [x] Finalize next gate unlock behavior.

## 5. Validation

- [x] Confirm this OpenSpec change exists under
  `openspec/changes/finalize-act-2a-water-beach-biome`.
- [x] Confirm this promotion step does not change gameplay/runtime/source behavior.
- [x] Run focused tests added by this implementation slice.
- [x] Run `npm run architecture:graph` after implementation changes.
- [x] Run build after implementation changes.
