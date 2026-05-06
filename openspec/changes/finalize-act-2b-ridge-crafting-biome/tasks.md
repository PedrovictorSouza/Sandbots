# Tasks: Finalize Act 2B ridge/crafting biome

## 1. TDD And Regression Guards

- [x] Identify existing crafting, material and world-break behavior that must not
  regress.
- [x] Add or update a focused test for Granite Ridge entry gate condition.
- [x] Add or update a focused test for heavy-object interaction request.
- [x] Add or update a focused test for specialist rescue availability and
  completion.
- [x] Add or update a focused test for cooking/crafting power-up progress.
- [x] Add or update a focused test for hard-rock or advanced traversal ability.
- [x] Add or update a focused test for celebration/party progress.
- [x] Add or update a focused test for region completion token.
- [x] Add or update a focused test that Granite Ridge grants `forge-signal`.
- [x] Record the focused verification command for this slice:
  `npm run test -- tests/biomeProgressionData.test.js tests/storyQuestData.test.js tests/characterArcData.test.js tests/finalReadinessData.test.js tests/companionAbilities.test.js`

## 2. Story Context

- [x] Define ridge region conflict.
- [x] Define specialist rescue emotional purpose.
- [x] Define why crafting mastery matters.
- [x] Define celebration/party as community proof.
- [x] Define how this region prepares the final repair.

## 3. Architecture Ownership

- [x] Assign heavy-object and hard-rock interactions to world/action systems.
- [x] Store recipes and materials in Flyweight Catalogs.
- [x] Use Strategy for powered-up action variants if needed.
- [x] Use Quest State Machine for specialist rescue and celebration progress.
- [x] Use UI Presenter for material, recipe and celebration feedback.
- [x] Confirm Scenario System owns region entry and next-gate behavior.
- [x] Confirm no render-frame changes are needed for content-only work.
- [x] Confirm this slice must not change camera, stage, input or scene flow.

## 4. Content Decisions

- [x] Finalize ridge region entry.
- [x] Finalize local hub restoration.
- [x] Finalize Act 2B important request: regional celebration/mood goal.
- [x] Finalize Act 2B general request pack: cooking, powered-up action, specialist
  rescue, heavy-object movement and cave investigation.
- [x] Finalize Act 2B recipe pack: cutting/cooking tools, oven/furnace, party items,
  stage/decor, stronger construction pieces and ridge-style blocks.
- [x] Finalize Act 2B material tier: ore, ingots, volcanic/stone materials, cooking
  ingredients and party materials.
- [x] Finalize heavy-object request.
- [x] Finalize specialist rescue chain.
- [x] Finalize cooking/crafting recipe chain.
- [x] Finalize powered-up ability.
- [x] Finalize advanced traversal or hard-rock blocker.
- [x] Finalize celebration/party setup.
- [x] Finalize celebration materials.
- [x] Finalize region completion token.
- [x] Finalize `forge-signal` completion token handoff.

## 5. Validation

- [x] Confirm this OpenSpec change exists under
  `openspec/changes/finalize-act-2b-ridge-crafting-biome`.
- [x] Confirm this promotion step does not change gameplay/runtime/source behavior.
- [x] Run focused tests added by this implementation slice.
- [x] Run `npm run architecture:graph` after implementation changes.
- [x] Run build after implementation changes.
