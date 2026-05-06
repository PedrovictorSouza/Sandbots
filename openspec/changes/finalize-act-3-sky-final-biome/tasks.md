# Tasks: Finalize Act 3 sky/final biome

## 1. TDD And Regression Guards

- [x] Identify existing scene transition, platform and traversal behavior that must
  not regress.
- [x] Add or update a focused test for Skyforge Spires entry gate condition.
- [x] Add or update a focused test that the final region remains locked until both
  `tide-signal` and `forge-signal` are earned.
- [x] Add or update a focused test for lift/platform progression.
- [x] Add or update a focused test for glide or late traversal unlock.
- [x] Add or update a focused test for large-building repair stage 1.
- [x] Add or update a focused test for large-building repair stage 2.
- [x] Add or update a focused test for large-building repair final stage.
- [x] Add or update a focused test for final-rank or `sky-signal` acquisition.
- [x] Add or update a focused test for return gate unlock.
- [x] Record the focused verification command for this slice:
  `npm run test -- tests/skyforgeRepairData.test.js tests/biomeProgressionData.test.js tests/moveData.test.js tests/characterArcData.test.js tests/finalReadinessData.test.js`

## 2. Story Context

- [x] Define why the final region is elevated or separated.
- [x] Define traversal mentor role.
- [x] Define final builder/master character motivation.
- [x] Define why the large repair needs prior-region mastery.
- [x] Define final proof before credits.

## 3. Architecture Ownership

- [x] Assign region and platform gates to Scenario System.
- [x] Store building repair stages in Flyweight Catalogs.
- [x] Use Quest State Machine for staged large-building progression.
- [x] Use UI Presenter for staged repair requirements.
- [x] Treat traversal/camera changes as separate high-risk specs if needed.
- [x] Confirm Input System must not own route, traversal or repair flags.
- [x] Confirm render-frame/stage changes are out of scope for this content slice.

## 4. Content Decisions

- [x] Finalize sky/final region entry.
- [x] Finalize platform/lift interaction.
- [x] Finalize glide or late traversal ability.
- [x] Finalize Act 3 important request: staged large-building repair.
- [x] Finalize Act 3 general request pack: late traversal follow request, material
  processing, cave/exploration request and furniture/bookcase/decor request.
- [x] Finalize Act 3 recipe pack: lift/platform pieces, concrete processing,
  advanced utility/electronic items, large-building parts and final-region decor.
- [x] Finalize Act 3 material tier: concrete, advanced metals, glass, rare machine
  parts and final-token materials.
- [x] Finalize final region habitats.
- [x] Finalize required final-region characters.
- [x] Finalize large-building stage requirements.
- [x] Finalize helper-character dependencies.
- [x] Finalize final rank/token.
- [x] Finalize `sky-signal` completion token handoff.
- [x] Finalize return gate.
- [x] Finalize final region completion.

## 5. Validation

- [x] Confirm this OpenSpec change exists under
  `openspec/changes/finalize-act-3-sky-final-biome`.
- [x] Confirm this promotion step does not change gameplay/runtime/source behavior.
- [x] Run focused tests added by this implementation slice.
- [x] Run `npm run architecture:graph` after implementation changes.
- [x] Run build after implementation changes.
