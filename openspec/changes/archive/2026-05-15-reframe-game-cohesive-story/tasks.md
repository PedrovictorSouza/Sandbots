# Tasks

## 1. Audit Existing Game

- [x] Inspect current scene flow, dialogue, HUD, progression, quest, asset and input systems.
- [x] Identify current external-IP-derived references and high-risk internal ids.
- [x] Identify stable systems to preserve: camera/cinematic work, HUD, dialogue runtime, input mapping, placement/grid and asset loading.
- [x] Identify fragile systems to change through adapters first: save-facing ids, source symbols, broad runtime flags and scene flow.

## 2. Create Narrative Source Of Truth

- [x] Create an original Sandbots narrative bible.
- [x] Define the original premise, player role, outpost/colony setting and tone.
- [x] Define allowed and forbidden naming patterns.
- [x] Define world rules for power, water, soil, machines, bots, resources and construction.
- [x] Define quest-writing rules.

## 3. Create Terminology Map

- [x] Map old external-IP-derived terms to original replacements.
- [x] Separate visible renames from risky internal code renames.
- [x] Preserve compatibility aliases where risky.
- [x] Document rename reasons.

## 4. Remove External IP References

- [x] Replace visible Pokemon-style names and references in the first playable arc.
- [x] Replace creature-based copy with bot, machine, worker, drone or module logic.
- [x] Replace ability labels with original system capabilities.
- [x] Replace comments/docs that tell future agents to use external-IP logic.
- [x] Verify no visible text still references Pokemon or Pokemon-like naming.

## 5. Rebuild Progression Into A Causal Chain

- [x] Rewrite early game progression so each task follows from a visible colony need.
- [x] Ensure each objective uses actual objects, machines, resources or systems.
- [x] Remove disconnected generated objectives.
- [x] Teach one system at a time.
- [x] Ensure each quest unlocks or explains the next mechanic.

## 6. Refactor Content And Quest Code

- [x] Move hardcoded narrative strings into content definitions when touched.
- [x] Keep quest data separate from quest execution logic.
- [x] Keep dialogue content separate from dialogue rendering.
- [x] Add small validation helpers where useful.
- [x] Remove duplicated content logic in small slices.

## 7. Preserve And Improve Existing Game Design

- [x] Preserve working scene transitions.
- [x] Preserve useful cinematic/camera work.
- [x] Preserve HUD and dialogue progress unless directly broken.
- [x] Preserve asset-loading improvements.
- [x] Preserve the grid/building direction.
- [x] Improve naming, flow and clarity around these systems.

## 8. Safe Implementation Pass

- [x] Only change code that is understood.
- [x] Prefer small vertical slices over broad speculative rewrites.
- [x] Avoid ambiguous source renames.
- [x] Run focused checks after each meaningful change.
- [x] Leave clear notes for deferred risky work.

## 9. Final Validation

- [x] Verify the game has a coherent original premise.
- [x] Verify intro and tutorial communicate the new direction.
- [x] Verify early quests make semantic sense.
- [x] Verify no external IP references remain in visible content.
- [x] Verify code is cleaner than before.
- [x] Verify existing design progress was preserved.
