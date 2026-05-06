# Tasks

This file is the executable backlog for finishing the game. The top-level roadmap
stays here; when a section is ready for implementation, promote that section into its
own smaller OpenSpec change.

Rules for every implementation slice:

- Preserve already implemented behavior unless the spec explicitly changes it.
- Use TDD: write or update the focused failing test first, then implement the
  smallest passing change.
- Update story context: why this matters in the fiction, which arc it belongs to,
  and how it connects to the ending.
- Update architecture context: owning system, design pattern, dependencies added,
  and regression guards.
- Avoid camera, render frame, stage, input, runtime boot and scene-flow changes
  unless the slice has its own high-risk spec.

## 1. Roadmap Definition

- [x] Define the final-game content pillars.
- [x] Define the four required macro-biomes and their story purpose.
- [x] Define required ability unlock chain.
- [x] Define required quest categories.
- [x] Define credits and post-story completion rules.
- [x] Define ongoing story-context maintenance rules.
- [x] Define ongoing architecture-pattern maintenance rules.
- [x] Promote `audit-current-game-state` into its own OpenSpec change.
- [x] Promote `define-story-bible` into its own OpenSpec change.
- [x] Promote `map-game-architecture-patterns` into its own OpenSpec change.
- [x] Promote each act into its own implementation OpenSpec after the audit.

## 2. Planned OpenSpec Slices

- [x] `audit-current-game-state`
- [x] `define-story-bible`
- [x] `map-game-architecture-patterns`
- [x] `finalize-act-1-opening-and-first-home`
- [x] `finalize-act-1-starting-biome-and-first-repair`
- [x] `finalize-act-2a-water-beach-biome`
- [x] `finalize-act-2b-ridge-crafting-biome`
- [x] `finalize-act-3-sky-final-biome`
- [x] `finalize-ending-and-post-story`
- [x] `final-release-readiness`

## 3. Existing Game Audit

### Story And Quest Audit

- [x] List current story files and owning systems.
- [x] List current quest ids, labels, rewards and completion conditions.
- [x] Classify each current quest as important, general, tutorial, optional or debug.
- [x] Map each quest to region/act.
- [x] Map each quest to request archetype: repair, restoration, initiation,
  celebration, ability unlock, habitat/home, crafting/cooking, escort/follow or
  delivery/show-item.
- [x] List current story flags and their default values.
- [x] Identify which flags are act-specific and which are global.
- [x] Identify current mentor/reminder dialogue support.
- [x] Identify current request-log or quest-progress UI support.
- [x] Identify duplicate reward protections already implemented.
- [x] Identify save/reload assumptions for quest state.

### Biome And Zone Audit

- [x] List current biome ids, region ids, zone ids and labels.
- [x] Map current internal region/zone ids into the four target macro-biomes.
- [x] Map current unlock conditions for each macro-biome and internal zone.
- [x] Map current macro-biome completion flags and tokens.
- [x] Map current trainer-rank or equivalent progression support.
- [x] Identify whether the water/beach and ridge/crafting macro-biomes can unlock
  in parallel.
- [x] Identify current environment-level data per macro-biome or zone.
- [x] Identify biome-specific habitat, NPC and recipe conditions.
- [x] Identify current route/gate hints for locked biomes.

### Character And Model Audit

- [x] List current required NPCs and player-facing names.
- [x] List current optional NPCs.
- [x] List available 3D/2D assets per character.
- [x] Record model orientation/yaw offsets for existing 3D characters.
- [x] Identify which NPCs can move, follow, patrol or face the player.
- [x] Identify which NPCs can trigger dialogue choices.
- [x] Identify which NPCs can grant rewards, abilities or recipes.
- [x] Identify missing model/assets for final required characters.

### Habitat And World Audit

- [x] List current habitat definitions and required ingredients.
- [x] List current habitat discovery events.
- [x] List current world objects that can be restored, watered, broken or repaired.
- [x] List current blocked routes and gate-like interactions.
- [x] List current region-like spaces already represented in the map.
- [x] Identify reusable habitat layout/factory patterns.
- [x] Identify current world labels and map markers.

### Inventory, Crafting And Reward Audit

- [x] List current inventory item ids and display names.
- [x] List current recipes and crafting support.
- [x] Classify current recipes by category: furniture, misc/decor, outdoor,
  utilities, buildings, blocks or other/special.
- [x] Classify current recipe unlock sources: workbench, request reward, story
  milestone, shop threshold, environment level, collection count, first material
  pickup, world pickup, random/daily source or challenge reward.
- [x] Classify current recipes by progression role: required story item, habitat
  ingredient, comfort item, repair material, traversal utility, decoration/flavor or
  post-story collectible.
- [x] List current material gathering loops.
- [x] Classify material tiers by act: starter natural, beach/clay/glass,
  ridge/ore/cooking, sky/concrete/advanced metal and rare/post-story.
- [x] List current item turn-in or delivery mechanics.
- [x] List current ability/move ids and unlock mechanisms.
- [x] List current comfort/environment-level support.
- [x] Identify which rewards affect abilities, recipes, comfort, environment level,
  gates, buildings or final readiness.
- [x] Identify whether material consumption is transactional.
- [x] Identify tests that already protect inventory/reward behavior.

### Architecture Audit

- [x] Run `npm run architecture:graph` and review current DAG status.
- [x] Map Input System owning files.
- [x] Map Scene/Scenario System owning files.
- [x] Map Quest State Machine owning files.
- [x] Map State Factory owning files.
- [x] Map Flyweight Data Catalog owning files.
- [x] Map Factory/Builder owning files.
- [x] Map Strategy owning files.
- [x] Map Observer/Event Queue candidates.
- [x] Map Repository/Registry candidates.
- [x] Map UI Presenter owning files.
- [x] Identify high fan-in/fan-out modules that need extra regression guards.

## 4. Story Context Track

- [x] Create the story bible document or section.
- [x] Define the game premise in one paragraph.
- [x] Define the player's role and emotional motivation.
- [x] Define the mentor's motivation and limitation.
- [x] Define the island/world problem that escalates across acts.
- [x] Define why restoring habitats attracts characters.
- [x] Define why each ability matters narratively.
- [x] Define why each region's repair contributes to the ending.
- [x] Define the final conflict, final proof, or final repair.
- [x] Define post-story fiction: why the world remains open.

### Act Story Beats

- [x] Act 1 setup: player arrives, learns restoration, earns first trust.
- [x] Act 1 payoff: first home/den proves the island can recover.
- [x] Act 1 continuation: shared hub is broken and needs community repair.
- [x] Act 1 payoff: hub repair opens the larger journey.
- [x] Act 2A setup: water/flood/cleanup biome shows environmental damage.
- [x] Act 2A payoff: biome energy/mood/water route is restored.
- [x] Act 2B setup: ridge/crafting biome asks for mastery of materials.
- [x] Act 2B payoff: specialist rescue and celebration prove community strength.
- [x] Act 3 setup: final traversal biome requires all learned loops.
- [x] Act 3 payoff: large repair/final rank proves readiness.
- [x] Ending payoff: all regional repairs unlock the credits sequence.

### Character Arc Records

- [x] Define mentor arc.
- [x] Define first companion arc.
- [x] Define builder/helper character arc.
- [x] Define water-region guide arc.
- [x] Define beach-region local conflict character arc.
- [x] Define ridge-region specialist arc.
- [x] Define ridge-region celebration character arc.
- [x] Define sky-region traversal mentor arc.
- [x] Define final-region builder/master character arc.
- [x] Define final interaction character or council.

## 5. Architecture Pattern Track

### System Map

- [x] Document Input System boundaries and forbidden responsibilities.
- [x] Document Scene/Scenario System boundaries and owned transitions.
- [x] Document Quest State Machine boundaries and event inputs.
- [x] Document State Factory boundaries and default state ownership.
- [x] Document Flyweight Catalog boundaries for static definitions.
- [x] Document Factory/Builder boundaries for runtime object creation.
- [x] Document Strategy boundaries for update/render/interaction variants.
- [x] Document Observer/Event Queue boundaries for cross-system reactions.
- [x] Document Repository/Registry boundaries for stable lookups.
- [x] Document UI Presenter boundaries for HUD/dialogue/request log.

### Pattern Rules

- [x] Quest availability uses state machine rules, not ad hoc UI checks.
- [x] NPC/item/habitat/recipe definitions use catalog data where possible.
- [x] Runtime character/prop creation goes through factories/builders.
- [x] Region progression lives in scenario/scene systems, not input handlers.
- [x] Input emits intents and never mutates quest/story state directly.
- [x] UI presenters render state and never own game rules.
- [x] Cross-system changes use explicit events or narrow adapters.
- [x] New dependencies are checked against the architecture graph.

## 6. Act 1: Opening And First Home

### TDD And Regression Guards

- [x] Identify existing opening/tutorial behavior that must not regress.
- [x] Add failing test for first mentor interaction availability.
- [x] Add failing test for first ability unlock.
- [x] Add failing test for first habitat discovery.
- [x] Add failing test for first companion request appearing in the request log.
- [x] Add failing test for duplicate first-ability reward prevention.
- [x] Add failing test for first recipe/workbench unlock.
- [x] Add failing test for first placed-object objective completion.

### Story Context

- [x] Define opening scene purpose.
- [x] Define why the mentor asks the player to restore the first habitat.
- [x] Define first companion's need/request.
- [x] Define how the first ability changes the player's relationship to the world.
- [x] Define why the first home/den matters emotionally.
- [x] Define how Act 1 foreshadows the final restoration.

### Architecture

- [x] Assign opening progression to Quest State Machine.
- [x] Assign starting state creation to State Factory.
- [x] Assign mentor/companion definitions to Flyweight Catalog.
- [x] Assign player/NPC spawning to Factory/Builder.
- [x] Assign tutorial UI and request log text to UI Presenter.
- [x] Confirm no input-system ownership of story flags.

### Content And Implementation

- [x] Finalize starting avatar/customization decision.
- [x] Finalize mentor intro dialogue.
- [x] Finalize first ability name, source and controls hint.
- [x] Finalize first habitat ingredients and discovery source.
- [x] Finalize first companion spawn/unlock condition.
- [x] Finalize first companion request objective.
- [x] Finalize first request-log entry.
- [x] Finalize Act 1 general request pack: first restore request, first delivery
  request, first follow request, first home/habitat request.
- [x] Finalize Act 1 starter recipe pack: workbench item, first seat/table, first
  outdoor fire/rest item, first bed/home item and first personal marker.
- [x] Finalize Act 1 starter material tier: natural materials only unless explicitly
  justified.
- [x] Finalize first reward and duplicate reward guard.
- [x] Finalize workbench interaction.
- [x] Finalize simple recipe.
- [x] Finalize first placeable object.
- [x] Finalize first home/den completion.
- [x] Finalize Act 1 celebration beat.

## 7. Act 1: Starting Biome And First Repair

### TDD And Regression Guards

- [x] Identify existing hub/center/challenge behavior that must not regress.
- [x] Add failing test for destroyed hub discovery.
- [x] Add failing test for challenge/request board unlock.
- [x] Add failing test for material requirement display.
- [x] Add failing test for helper-character request.
- [x] Add failing test for material turn-in consuming items once.
- [x] Add failing test for hub repair completion flag.
- [x] Add failing test for next-route unlock after repair.

### Story Context

- [x] Define what the shared hub represents.
- [x] Define why the region cannot progress until the hub is repaired.
- [x] Define helper character motivation.
- [x] Define how material gathering teaches community repair.
- [x] Define how the repaired hub changes NPC dialogue.
- [x] Define how the starting biome opens the larger journey.

### Architecture

- [x] Assign hub repair to Quest State Machine plus repair catalog.
- [x] Store material requirements in Flyweight Catalog.
- [x] Use Factory/Builder for repaired hub visual state if needed.
- [x] Use UI Presenter for missing-material and repair-confirmation text.
- [x] Confirm region gate is owned by Scenario System.

### Content And Implementation

- [x] Finalize destroyed hub/center location.
- [x] Finalize discovery interaction.
- [x] Finalize challenge/request board equivalent.
- [x] Finalize Act 1 important request: first shared hub repair.
- [x] Finalize Act 1 important request: initiation/challenge objective if required.
- [x] Finalize Act 1 general request pack: habitat invite, comfort raise, helper
  material conversion, blocked-wall route.
- [x] Finalize Act 1 recipe pack: hub repair kit, simple building pieces, storage,
  community utility and first shop/environment-level unlocks.
- [x] Finalize Act 1 material tier: natural materials plus first processed building
  materials.
- [x] Finalize repair kit or repair action.
- [x] Finalize required materials.
- [x] Finalize helper-character unlock.
- [x] Finalize helper-character request.
- [x] Finalize repair confirmation.
- [x] Finalize repaired visual/dialogue state.
- [x] Finalize next route/gate unlock.

## 8. Act 2A: Water/Beach Biome

### TDD And Regression Guards

- [x] Identify existing water/cleanup/world interaction behavior that must not regress.
- [x] Add failing test for region gate entry condition.
- [x] Add failing test for broken bridge/infrastructure objective.
- [x] Add failing test for flood/blockage cleanup request.
- [x] Add failing test for water traversal or cleanup ability unlock.
- [x] Add failing test for region mood/light/energy progress.
- [x] Add failing test for major request completion.
- [x] Add failing test for next gate unlock.
- [x] Add failing test that this region grants one final-biome unlock token.

### Story Context

- [x] Define local environmental problem.
- [x] Define local guide character motivation.
- [x] Define cleanup character request chain.
- [x] Define ability unlock meaning.
- [x] Define region restoration payoff.
- [x] Define how the water/beach region contributes to the ending.

### Architecture

- [x] Assign region entry to Scenario System.
- [x] Assign cleanup progress to Quest State Machine.
- [x] Store ability and cleanup definitions in Flyweight Catalog.
- [x] Use Observer/Event Queue for environmental progress if needed.
- [x] Use UI Presenter for region progress/mood feedback.

### Content And Implementation

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
- [x] Finalize next gate unlock.

## 9. Act 2B: Ridge/Crafting Biome

### TDD And Regression Guards

- [x] Identify existing crafting/material/world-break behavior that must not regress.
- [x] Add failing test for ridge region entry.
- [x] Add failing test for heavy-object interaction request.
- [x] Add failing test for specialist rescue.
- [x] Add failing test for cooking/crafting power-up.
- [x] Add failing test for hard-rock or advanced traversal ability.
- [x] Add failing test for celebration/party progress.
- [x] Add failing test for region completion token.
- [x] Add failing test that this region grants one final-biome unlock token.

### Story Context

- [x] Define ridge region conflict.
- [x] Define specialist rescue emotional purpose.
- [x] Define why crafting mastery matters.
- [x] Define celebration/party as community proof.
- [x] Define how this region prepares the final repair.

### Architecture

- [x] Assign heavy-object and hard-rock interactions to world/action systems.
- [x] Store recipes/materials in Flyweight Catalog.
- [x] Use Strategy for powered-up action variants if needed.
- [x] Use Quest State Machine for specialist rescue and celebration progress.
- [x] Confirm no render-frame changes are needed for content-only work.

### Content And Implementation

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

## 10. Act 3: Sky/Final Biome

### TDD And Regression Guards

- [x] Identify existing scene transition/platform/traversal behavior that must not regress.
- [x] Add failing test for sky region entry.
- [x] Add failing test that sky/final region remains locked until both intermediate
  biome tokens are earned.
- [x] Add failing test for lift/platform progression.
- [x] Add failing test for glide or late traversal unlock.
- [x] Add failing test for large-building repair stage 1.
- [x] Add failing test for large-building repair stage 2.
- [x] Add failing test for large-building repair final stage.
- [x] Add failing test for final-rank or final-token acquisition.
- [x] Add failing test for return gate unlock.

### Story Context

- [x] Define why the final region is elevated or separated.
- [x] Define traversal mentor role.
- [x] Define final builder/master character motivation.
- [x] Define why the large repair needs prior-region mastery.
- [x] Define final proof before credits.

### Architecture

- [x] Assign region and platform gates to Scenario System.
- [x] Store building repair stages in Flyweight Catalog.
- [x] Use Quest State Machine for staged large-building progression.
- [x] Use UI Presenter for staged repair requirements.
- [x] Treat traversal/camera changes as separate high-risk specs if needed.

### Content And Implementation

- [x] Finalize sky/final region entry.
- [x] Finalize platform/lift interaction.
- [x] Finalize glide or late traversal ability.
- [x] Finalize Act 3 important request: staged large-building repair.
- [x] Finalize Act 3 general request pack: late traversal follow request, material
  processing, cave/exploration request, furniture/bookcase/decor request.
- [x] Finalize Act 3 recipe pack: lift/platform pieces, concrete processing,
  advanced utility/electronic items, large-building parts and final-region decor.
- [x] Finalize Act 3 material tier: concrete, advanced metals, glass, rare machine
  parts and final-token materials.
- [x] Finalize final region habitats.
- [x] Finalize required final-region characters.
- [x] Finalize large-building stage requirements.
- [x] Finalize helper-character dependencies.
- [x] Finalize final rank/token.
- [x] Finalize return gate.
- [x] Finalize final region completion.

## 11. Ending And Post-Story

### TDD And Regression Guards

- [x] Identify existing final quest/end-state behavior that must not regress.
- [x] Add failing test that credits do not trigger early.
- [x] Add failing test that credits trigger after required goals.
- [x] Add failing test for final completion flag.
- [x] Add failing test for post-story sandbox availability.
- [x] Add failing test for mentor reminder naming missing goals.
- [x] Add smoke test that reaches final completion through scripted state.

### Story Context

- [x] Define final required goals list.
- [x] Define final mentor/council reminder text.
- [x] Define final interaction setup.
- [x] Define ending cutscene emotional payoff.
- [x] Define credits state.
- [x] Define post-story fiction.

### Architecture

- [x] Assign final readiness check to Quest State Machine or Scenario System.
- [x] Store final required goal list in catalog/registry data.
- [x] Use UI Presenter for missing-goal feedback.
- [x] Keep credits state separate from optional post-story activity state.

### Content And Implementation

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

## 12. Release Readiness

- [x] Run focused unit tests for all final story systems.
- [x] Run quest progression tests for required story path.
- [x] Run reward/ability unlock tests.
- [x] Run habitat discovery tests for required habitats.
- [x] Run inventory/material turn-in tests.
- [x] Run smoke test for final completion flag.
- [x] Run `npm run architecture:graph` and confirm no new directed cycles.
- [x] Run build.
- [x] Run visual/browser smoke for the playable route if a dev server is needed.
- [x] Review story bible for beginning-to-ending consistency.
- [x] Review architecture pattern map for ownership drift.
