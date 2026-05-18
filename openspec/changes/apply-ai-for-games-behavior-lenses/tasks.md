# Tasks: Apply Artificial Intelligence for Games Behavior Lenses

## 1. Reading Ledger

Source: `material/Artificial Intelligence for Games.pdf`

- [x] Locate the PDF in `material/`.
- [x] Extract the table of contents and identify relevant chapters.
- [x] Read focused sections on complexity/perception, decision making, events,
  object knowledge, concrete actions, scheduling and AI design scope.
- [x] Reject broad AI expansion as inappropriate for Sandbots right now.
- [x] Translate useful ideas into small Sandbots implementation tasks.
- [ ] Continue reading movement/pathfinding sections only if a future bot
  movement task needs them.
- [ ] Continue reading scheduling/LOD sections before any performance-sensitive
  bot update slice.

## 2. Object Affordance Catalog v1

Source lens: object types should communicate significance to AI and gameplay.

- [ ] Inventory current object families that affect play: bots, trees, dry grass,
  restored soil, workbench kits, Solar Station, house, terminal, crates and
  resource drops.
- [ ] Define a small affordance shape with fields such as `blocksMovement`,
  `blocksPlacement`, `interactionType`, `validTools`, `buildZoneRadius`,
  `talkRange`, `questTags`, `soundEvent` and `cameraBeat`.
- [ ] Add affordances to one narrow family first, preferably buildables or early
  interactables.
- [ ] Keep existing runtime behavior unchanged until the catalog is validated.
- [ ] Test that every catalog item used by placement has blocker/placement
  metadata.
- [ ] Test that every interactable has an interaction type and player-facing
  feedback category.

## 3. Concrete Action Contract v1

Source lens: action availability must include meaning, prerequisites and effects.

- [ ] List current early actions: talk, collect, Hydro Jet, Bio-Grow, place kit,
  rotate placement, open terminal, open workbench and inspect debug collision.
- [ ] Define a concrete action shape: `id`, `verb`, `targetTypes`,
  `requirements`, `worldEffects`, `feedback`, `duration` and `failureReason`.
- [ ] Convert one action first: Hydro Jet on dry/restorable ground.
- [ ] Ensure invalid target feedback is distinct from missing-resource feedback.
- [ ] Test that the action only completes when requirements and target type match.
- [ ] Test that action completion emits the expected world effect and feedback id.

## 4. Bot State Machine v1

Source lens: most shipped game AI succeeds with simple state machines.

- [ ] Define canonical bot states: `hidden`, `dormant`, `available`, `waiting`,
  `following`, `working`, `blocked` and `complete`.
- [ ] Map Hydro Bot, Grow Bot and Chopper to only the states they actually need.
- [ ] Preserve existing bot placement, dialogue and quest flow.
- [ ] Convert one bot first, preferably Hydro Bot or Grow Bot, behind adapter
  helpers if current code is fragile.
- [ ] Test state transition causes and resulting visible availability.
- [ ] Test that a bot cannot be asked to perform a task before its state allows it.

## 5. Event Perception Bus v1

Source lens: events help when many systems need the same world knowledge.

- [ ] List high-signal Sandbots events: `botAwakened`, `toolUnlocked`,
  `tileRestored`, `kitPlaced`, `buildZoneCreated`, `questCompleted`,
  `resourceCollected`, `invalidAction` and `dialogueStarted`.
- [ ] Define event payload requirements: `id`, `type`, `subjectId`, `position`,
  `importance` and optional `questId`.
- [ ] Route one existing event through the contract without changing player
  outcome.
- [ ] Ensure sound, HUD and quest systems can respond without knowing each
  other's internals.
- [ ] Test that the event fires exactly once for the chosen milestone.
- [ ] Test that missing high-importance subject data warns in development.

## 6. Perception Window Feedback v1

Source lens: players judge behavior from the short slice they can see.

- [ ] Find one bot/world state change that currently happens with weak cause and
  effect.
- [ ] Add or reuse feedback that makes the cause readable: small motion, sound,
  HUD status, visual state, camera focus or prompt change.
- [ ] Do not add explanatory paragraph copy for this slice.
- [ ] Keep feedback proportional to importance.
- [ ] Test that the state change produces at least one visible or audible payoff.

## 7. Interaction Range And Trigger Semantics v1

Source lens: external knowledge should match the player's expectation of the
world.

- [ ] Use the collider/trigger debug toggle to inspect Grow Bot, Hydro Bot,
  Chopper, terminal, workbench, crates and buildables.
- [ ] Move trigger dimensions into affordance data where safe.
- [ ] Fix one too-tight interaction range through data/config, not global input
  hacks.
- [ ] Ensure visual body and trigger footprint have an explainable relationship.
- [ ] Test that interaction range is larger than the visual blocker for talkable
  bots when needed.

## 8. Placement Intelligence v1

Source lens: simple rules can read as intelligence if they match the world.

- [ ] Connect placement validation to object affordances instead of ad hoc object
  name checks where safe.
- [ ] Ensure dead trees, trees, bots, buildings and resource nodes all contribute
  blocker metadata.
- [ ] Preserve current green/red preview behavior.
- [ ] Keep large-object footprint preview working.
- [ ] Test that a catalog object cannot be placed over a dead tree.
- [ ] Test that Solar Station still shows its build-zone radius after placement.

## 9. Bot Scheduling And LOD v1

Source lens: execution management should protect performance.

- [ ] Inventory update loops for bots, particles, world effects and ambient
  helpers.
- [ ] Identify one bot or ambient behavior that does not need per-frame updates
  when far from the player or inactive.
- [ ] Add a tiny scheduling/LOD rule for that behavior only.
- [ ] Preserve visible behavior near the player.
- [ ] Test deterministic update cadence with a fake clock or tick counter.
- [ ] Run a build and record any manual FPS observation separately.

## 10. Quest Grounding By Action v1

Source lens: actions should communicate what world state they change.

- [ ] For each early quest objective, identify the concrete action and object
  affordance it depends on.
- [ ] Flag objectives whose title, subtitle or guidance does not connect to a
  real object/action pair.
- [ ] Do not rewrite broad story copy in this task.
- [ ] Fix only one weak objective in a future implementation slice.
- [ ] Test that quest subtitle does not repeat the title unless it adds real
  guidance.
- [ ] Test that the chosen quest is completed by the concrete runtime action, not
  by unrelated dialogue timing.

## 11. Development Validator v1

Source lens: content tools should carry behavior knowledge.

- [ ] Add validation for affordance records: required ids, known interaction
  types, known feedback events and finite numeric ranges.
- [ ] Add validation for concrete actions: known target type, at least one world
  effect or explicit no-op reason, and valid failure reason.
- [ ] Add validation for bot state maps: no transition to unknown state.
- [ ] Keep validators dev/test-facing first.
- [ ] Test one valid fixture and one intentionally invalid fixture per contract.

## 12. Validation

- [ ] Validate this OpenSpec change with
  `openspec validate apply-ai-for-games-behavior-lenses --strict`.
- [ ] Before implementing any task above, reduce it to a vertical slice touching
  no more than three files.
- [ ] Treat camera, render frame, scene flow, input and game loop as separate
  high-risk specs if a task reaches them.
- [ ] Each implementation slice must have a focused test or explicit manual
  acceptance step.
