# Tasks: Apply Minecraft Survival Loop Lenses

## 1. Reading Ledger

- [x] Locate and confirm `material/minecraft.pdf`.
- [x] Extract readable structure from the PDF.
- [x] Identify available useful section: Chapter 3, `Gathering Resources`.
- [x] Record first actionable design patterns from the chapter.
- [x] Locate and inspect `material/minecraft-source-code`.
- [x] Confirm source folder is too large for broad reading in one pass.
- [x] Sample high-level source structure: registries, recipes, advancements,
  input, workbench and HUD.
- [ ] Continue reading other available sections if a fuller PDF is added later.
- [ ] Append new tasks only when they are tied to a concrete source observation.

## 2. Colony Status HUD v1

Source observation: the Minecraft HUD exposes state and usable capacity.

- [x] Identify current Sandbots state values that already exist and can be shown
  safely.
- [x] Define a minimal colony status model: `power`, `water`, `soil`, `shelter`,
  `activeBot`, `activeTool`.
- [x] Add display copy that reports state instead of repeating quest text.
- [x] Keep quest text separate from colony status.
- [x] Test that HUD does not duplicate a mission title as subtitle unless a hint
  adds new information.

## 3. Colony Cache v1

Source observation: Minecraft's chest protects gathered progress and gives the
base a practical role.

- [x] Define the player-facing concept: `Colony Cache`.
- [x] Decide which existing storage/inventory data can support it without a full
  inventory rewrite.
- [x] Add a small base interaction that explains stored colony supplies.
- [x] Ensure early material gathering feeds base progress, not only personal bag
  clutter.
- [x] Test that using the cache does not consume required story items.

## 4. Resource Purpose Pass

Source observation: early resources matter because they become tools, shelter,
fuel, storage or exploration support.

- [x] List early resources currently visible in the game.
- [x] Mark each early resource as `tool`, `repair`, `build`, `fuel`,
  `restoration`, `comfort`, or `placeholder`.
- [x] Remove or relocate excess free materials near the base when they remove
  exploration purpose.
- [x] Ensure every required early resource has a visible use before it becomes a
  repeated pickup.
- [x] Add tests for current resource purpose coverage and early wood scarcity.

## 5. Base Landmark Pass

Source observation: players navigate Minecraft with visible home markers,
orientation clues and memorable structures.

- [x] Audit visible first-area landmarks: crashed ship, terminal, workbench,
  cache, bot positions and beacon candidates.
- [x] Choose one primary landmark and two secondary landmarks for the opening
  area.
- [x] Add or adjust non-invasive visual cues such as cable trails, light beacons,
  ground markings or silhouette placement.
- [x] Define landmark cues that support return navigation without relying only on HUD
  text.
- [x] Smoke test camera framing around the base after landmark changes.

## 6. First Habitat Site Choice

Source observation: choosing a building site is meaningful because terrain,
visibility, safety and nearby resources matter.

- [x] Define simple Sandbots site criteria: `powered`, `clear`, `stable ground`,
  `near workbench`, `near restored soil`, or `expandable`.
- [x] Return at least one positive and one negative placement reason for future
  preview UI.
- [x] Keep placement confirmation consuming the kit only on valid placement.
- [x] Avoid adding a full city-planning system in v1.
- [x] Test valid/invalid site feedback.

## 7. Workbench Category Pass

Source observation: inventory/build menus become understandable when categories
teach how the world is organized.

- [x] Define stable workbench categories: `Power`, `Water`, `Soil`, `Shelter`,
  `Bots`, `Tools`, `Materials`.
- [x] Assign existing workbench items/kits to categories without changing recipe
  behavior.
- [x] Rename any remaining shop/buy/currency-facing copy to protocol/issue/log
  language.
- [x] Keep internal legacy ids only where migration risk is high.
- [x] Test category ordering and visible copy.

## 8. Short Expedition Loop v1

Source observation: Minecraft turns gathering into reconnaissance: leave base,
find several useful things, return with purpose.

- [x] Define one short expedition that starts from the base and ends with a
  visible world change.
- [x] Include at least two useful discoveries, not one isolated pickup.
- [x] Include a return aid: landmark, radio completion, bot assist, shortcut or
  fade transition.
- [x] Avoid adding combat, hunger or a large map.
- [x] Test objective progression, reward visibility and autosave.

## 9. Progress Trigger Contract v1

Source-code observation: Minecraft advancements are content definitions triggered
by runtime events such as inventory changes.

- [x] List Sandbots progression events that already exist: inventory change,
  skill unlock, bot wake, placement confirmed, resource restored, terminal logged
  and habitat created.
- [x] Define a small trigger contract for colony milestones.
- [x] Keep trigger definitions separate from HUD rendering and dialogue text.
- [x] Convert one existing fragile quest completion into a trigger-backed
  milestone.
- [x] Test that completing the runtime event advances the milestone exactly once.

## 10. Workbench Container Contract v1

Source-code observation: Minecraft's crafting table is a container contract with
slots, result resolution, close cleanup and interaction validation.

- [x] Define what a Sandbots workbench interaction owns: available protocols,
  issued kits, required materials, validation and pending placement intent.
- [x] Keep recipe/protocol resolution separate from modal rendering.
- [x] Preserve existing item ids where migration risk is high.
- [x] Add validation for "can issue", "already issued", "blocked by missing
  colony state" and "preview can start".
- [x] Test House Kit and Solar Station issue/placement flows through the
  contract.

## 11. Logical Input Action Registry v1

Source-code observation: Minecraft key bindings track logical action,
category, default key and current press state.

- [x] List current Sandbots logical actions: move, interact, cancel, place,
  rotate, open bag, menu, confirm, tab next and tab previous.
- [x] Ensure each action has a category and default binding.
- [x] Keep device-specific labels inside the prompt resolver.
- [x] Add controls-menu editing on top of the logical action registry, not as
  direct DOM button hacks.
- [x] Test keyboard and gamepad bindings without changing existing defaults.

## 12. HUD Panel Composition v1

Source-code observation: Minecraft HUD is composed from distinct overlays
instead of one monolithic concern.

- [x] Inventory current HUD responsibilities: quest, prompts, status, dialogue,
  tool, inventory chips, notifications and debug.
- [x] Define panel-level state contracts for the first two HUD panels to extract.
- [x] Extract only one low-risk panel first.
- [x] Ensure panels do not duplicate quest text unless a hint adds new guidance.
- [x] Test panel state output without requiring canvas/render integration.

## 13. Validated Content Catalogs v1

Source-code observation: Minecraft keeps large content sets discoverable through
registries/catalogs.

- [x] Define which Sandbots catalogs should be explicit first: bots, tools,
  materials, buildables, field tasks and workbench protocols.
- [x] Add validators for required fields and player-facing names.
- [x] Ensure catalogs use Sandbots terminology, not external IP remnants.
- [x] Avoid broad symbol renames until references are mapped.
- [x] Test catalog validation with one positive and one intentionally invalid
  fixture.

## 14. Validation

- [x] Validate this OpenSpec change with `openspec validate
  apply-minecraft-survival-loop-lenses --strict`.
- [x] Before implementing any task above, reduce it to a small vertical slice.
- [x] Each implementation slice should touch no more than three files unless a
  new preflight justifies a larger scope.
