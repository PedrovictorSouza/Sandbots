# Sandbots Game Design Principles

This document collects design principles for Sandbots. It is a working reference for future tasks, not a fixed specification.

## How To Use This Document

- Keep tasks small and testable.
- Prefer in-world teaching over explanation screens.
- When adding a new mechanic, define its benefit, limit, feedback, and first safe use.
- Do not add broad systems from these notes without turning them into a narrow task first.
- Update this document when new design notes are provided.

## Current Direction

Sandbots is a cozy reconstruction game with light adventure structure. Helper bots restore a small devastated planet so it can support a future human colony.

The game should feel practical, reactive, and playful:

- The player learns by doing.
- The world visibly changes after work.
- Robots have clear identities tied to abilities.
- Important inputs should produce a response.
- Progress should feel additive, not punitive.

## Concept Lighthouse

The core concept should stay visible throughout development: **bots restoring a damaged tiny planet for future humans**. Features can change, names can improve, and individual systems can be rebuilt, but the project should not drift away from repair, care, viability, helper bots, and colony preparation.

Implementation rules:

- Before adding a feature, ask how it supports planetary restoration or bot-led colony work.
- Prefer improving the core loop over adding disconnected novelty.
- When a borrowed reference enters the project, translate it into Sandbots language and mechanics.
- Cut or defer work that does not strengthen restoration, building, exploration, bot identity, or colony readiness.
- Treat this concept as the project lighthouse during long development, especially when fatigue makes every direction look equally valid.

Good fit:

- A bot ability that changes the terrain and teaches what the planet needs.
- A colony protocol that unlocks construction after viability improves.
- A UI line that frames inventory, controls, or quests as damaged colony systems coming back online.

Poor fit:

- Currency/shop loops that imply a functioning civilization.
- Creature collection language that makes the bots feel like pets instead of workers.
- Random content that adds noise without supporting restoration or colony preparation.

## 1. Tutorial In The World

The game should not feel like it stops for a tutorial. It should teach while the player is already playing.

Implementation rules:

- Teach abilities through a first practical use.
- Avoid long instruction text when a world target can explain the task.
- Use prompts, robot movement, marked tiles, and environmental signals.
- Keep early failure soft.
- Reuse existing quest tracker and world prompts instead of adding new tutorial UI unless necessary.

Examples:

- Hydro Jet should have a clear dry tile or dead plant target.
- Bio-Grow should mark valid restored ground before use.
- Workbench should be introduced through an immediate recipe/action.

## 2. Input Must Respond

Important inputs should not feel dead. If the player presses a reasonable button near a relevant target, the game should either act or give clear feedback.

Implementation rules:

- Use redundant inputs for common interactions: `A / E / X` where context allows.
- Keep `RT` reserved for the selected field move.
- Prompts must show the valid buttons for the current target.
- If an action cannot happen yet, show a short reason instead of silently failing.
- Cinematics should react to input with skip feedback.

Already started:

- Context prompts can show `A / E / X`.
- Cinematic input can reveal a hold-to-skip prompt.

## 3. Feedback And Praise

The game should reward correct action with visible and emotional response, not only inventory changes.

Implementation rules:

- Completed tasks can blink briefly before leaving the stack.
- Restored tiles should animate, brighten, or emit particles.
- Robots can react to completed work.
- Use small notices for direct confirmation.
- Prefer feedback that appears in the world, not only in HUD.

Good feedback targets:

- Watering a tile.
- Growing tall grass.
- Placing furniture.
- Crafting at the Workbench.
- Completing a habitat.

## 4. Attention Without A Minimap

The player should not need to play from a minimap. Direction should come from the scene, HUD, and world cues.

Implementation rules:

- Use world markers only for active or useful targets.
- Let NPCs and robots point, face, or move toward objectives.
- Use environmental signals such as smoke, shimmer, rustling grass, speech bubbles, or highlighted tiles.
- Quest tracker should explain the current intent without becoming GPS.
- Avoid adding a minimap until world cues have been exhausted.

Potential tasks:

- Active objective marker pass.
- Robot points toward next target.
- Workbench guide marker only while relevant.
- Rustling or animated environment cues for hidden/important targets.

## 5. Risk And Return

Every ability should have a benefit and a limit. This creates decision-making without making the early game harsh.

Ability template:

- Ability:
- Required robot:
- Benefit:
- Limit or cost:
- First safe use:
- Feedback:
- Failure message:

Current examples:

- Hydro Jet: restores dry ground, but requires marking a target and waiting for Hydro Bot.
- Bio-Grow: creates tall grass, but only on valid restored ground.
- Workbench crafting: creates useful objects, but requires materials and recipes.

Design rule:

- Do not create an ability that solves every nearby problem without choice.
- Early risk should be low; mastery and constraints can grow later.

## 5.1. Restorative Work Can Be Fun Without Risk

Risk and return are useful, but they are not the only source of game feel. Sandbots can also be satisfying through calm, repeated work: cleaning, repairing, scanning, planting, sorting, powering, and watching a damaged place become usable again.

Implementation rules:

- Give repeated work a concrete real-world motif: repair a generator, wash dust off solar panels, clear dead brush, rebuild soil, route water, calibrate a habitat.
- Make the end state readable before or during the work so the player can imagine what "done" looks like.
- Replace money with useful yield: viability logged, power restored, water routed, soil stabilized, materials recovered, robot efficiency improved, habitat readiness increased.
- Preserve the loop: work in the world -> get useful output -> unlock a tool, bot help, shortcut, or cleaner workflow -> do the next work with less friction.
- Let low-risk tasks be tactile and quiet, but not empty. Every repeated action should show progress through sound, animation, changed ground, filled meters, bot comments, or object cleanup.
- If a loop has no hard ending, make the next horizon far but legible: better tools, wider radius, faster helpers, new terrain response, or visible colony readiness.
- Avoid turning calm work into busywork. If the task does not change the world, improve a tool, reveal information, or say something about the colony, cut or compress it.

Sandbots examples:

- Clearing dry brush should not only remove obstacles; it can reveal soil health, recover material, and make the planet look less abandoned.
- Solar Station maintenance can become satisfying if dust, charge, light, and nearby habitat power visibly improve.
- Helper bot upgrades should reduce repeated labor in a visible way: wider watering arc, faster scan, longer carry range, better cleanup radius.

## 6. Friendly Difficulty

The early game should be welcoming. The target is closer to "learn safely, then deepen" than "fail hard immediately."

Implementation rules:

- Do not punish early mistakes heavily.
- Avoid blocking progress behind precise or complex input.
- Let the player recover from confusion through prompts and feedback.
- Add complexity after the player has used the mechanic successfully.

## 7. Simple Commands, Optional Mastery

Basic progress should use simple inputs. More expressive controls may exist later, but should not be mandatory for core progression.

Implementation rules:

- One-button interaction should be enough for required actions.
- Advanced timing, flick input, dash, or precision variants can be optional.
- Never require complex commands for early abilities.

## 8. Motion With Life

Mechanical movement feels flat. Effects and objects should have small irregularities that make them feel alive.

Implementation rules:

- Particles should vary in position, opacity, scale, and timing.
- Falling or thrown objects can wobble, rotate off-center, or drift slightly.
- Grass and plants can react to nearby movement.
- Avoid perfectly straight, perfectly uniform motion for natural effects.

Already started:

- Grass reacts when the player crosses it.
- Ship crash uses smoke, dust, flash, and shake.

Potential tasks:

- Wobble for ability particles.
- Slight uneven rotation for falling resources.
- More expressive smoke/fade behavior.

## 9. Randomness Must Be Safe

Randomness can add freshness, but it should not break quests or make progress feel unfair.

Implementation rules:

- Critical quest drops should be deterministic.
- Random patrols must stay within clear bounds.
- Cosmetic particles can be random.
- Resource variation can be light, but not required for progression.
- Prefer seeded or bounded randomness for repeatable testing.
- Inject random sources for effects that need tests or stable replay.
- Never let luck decide whether a required tutorial or quest can complete.

Small Island examples:

- Restoration sparks may vary, but the restored tile itself must be deterministic.
- A snowstorm can use seeded particles so it feels alive while remaining testable.
- Resource spawns near the base should be authored or bounded, not pure luck.

## 10. Progress Should Feel Additive

The player should feel the island improving through repeated work.

Implementation rules:

- Restored areas should stay visibly changed.
- Construction should add persistent objects.
- Habitat completion should be reflected in the world.
- Rewards should support the next action.

Core loop:

1. Work in the world.
2. Get material, ability progress, or restoration.
3. Build or unlock something.
4. The island visibly improves.
5. A new small goal appears.

Potential future metrics:

- Island vitality.
- Habitats restored.
- Robots awakened.
- Homes built.
- Plants revived.

## 10.1. Care Economy / Planetary Viability

Sandbots should not use money, shops, prices, or currency as the main progression language. The world is devastated, there is no local civilization, and the bots are there to restore conditions for a future human colony.

Implementation rules:

- Treat progress as planetary viability, not purchasing power.
- The Colony Terminal validates restoration reports and unlocks protocols.
- Rewards should feel like authorization, diagnostics, tools, materials, or construction readiness.
- If legacy currency data exists in saves, keep it compatible but hidden from the player-facing flow.
- Use material logistics for crafting, but avoid shop framing for required story progression.

Example:

- Completing a habitat check logs viability and authorizes a House Kit.
- The House Kit is issued by colony protocol, not bought.
- Materials are still gathered because construction needs matter, not because bots are trading.

## 11. Rewards Without Humiliation

If the game later uses scores, challenges, or ranks, they should motivate without making the player feel small.

Implementation rules:

- Prefer positive progress numbers over global rank.
- Do not show huge low rankings such as "#98432".
- Use challenge completion, island vitality, or unlocked improvements.
- Compare the player mainly to their own progress.

## 12. Four Types Of Play

Useful lens for future mechanics:

- Agon: challenge, mastery, competition.
- Alea: chance, variation, surprise.
- Mimicry: role-play, fantasy, simulation.
- Ilinx: physical sensation, speed, vertigo, impact.

Small Island emphasis:

- Agon: light ability challenges and PC challenges.
- Alea: safe variation in patrols, effects, and optional resources.
- Mimicry: repairing, restoring, crafting, robots with personality.
- Ilinx: crash impact, dust, shake, movement feel.

## 13. Character And Ability Identity

Mechanics should match the identity of the robot or character that grants them.

Implementation rules:

- Hydro Bot / Robot-1 should feel tied to water and restoration.
- Grow Bot / Robot-2 should feel tied to plants and habitats.
- Chopper should remain guide, comic relief, and technical mentor.
- Future robots should have a clear material, verb, and personality.

Do not add a mechanic that contradicts the character just because it is mechanically convenient.

## 14. Tuning And Stability

Gameplay should not depend accidentally on frame rate, optimization, or machine speed.

Implementation rules:

- Keep important timings in named constants.
- Use delta time for runtime movement.
- Add tests for interaction ranges and critical timers.
- When changing speed or duration, test the related flow.
- Avoid hidden coupling between rendering performance and gameplay difficulty.

Important areas:

- Opening cinematic and ship crash timing.
- Robot ability travel and cast timing.
- Quest transition delays.
- Interaction ranges.
- Smoke and particle durations.

## 15. Effects Must Read At The Right Scale

Visual effects are gameplay feedback. They should be readable, cheap enough, and scaled to the world.

Implementation rules:

- Use billboards for smoke, dust, sparkles, impact puffs, and other effects without solid volume.
- Prefer short-lived particles with strong motion over slow particles that linger too long.
- Stagger timing and position so particles do not stack on top of each other.
- Use fewer larger particles when the game cannot afford many small ones.
- Fade opacity as smoke, dust, and particles rise or dissipate.
- Keep effect scale matched to the object: a ship crash should not look like a candle flame; a small item sparkle should not look like an explosion.
- Make fire, smoke, dust, and water feel rough, moving, and alive rather than perfectly uniform.

Small Island examples:

- Ship crash smoke should be large, dark, and persistent.
- Impact dust should rise around the crashed module and fade/rotate out.
- Hydro Jet particles can use billboards and staggered timing.
- Bio-Grow growth should have plant-scale particles, not explosion-scale particles.
- Workbench/crafting feedback should be small but satisfying.

## 16. Trails And Impact Readability

Fast motion often needs a trail or flash to read well. Without it, the player may not feel the action.

Implementation rules:

- Fast abilities can use short-lived trails, arcs, or afterimages.
- Trails should match the identity of the ability: water arcs for Hydro Jet, leaf/green streaks for Bio-Grow, sparks for metal/repair.
- For very fast actions, a single billboard/quad flash can work better than trying to show every frame of motion.
- Trails should not obscure the player or target.
- Effects should be tuned with the camera distance used in actual gameplay.

Potential tasks:

- Hydro Jet spray arc polish.
- Bio-Grow cast trail/leaf burst.
- Future Cut ability slash trail.
- Crafting/repair spark burst.

## 17. Flashing And State Feedback

Flashing can create strong impact, but it must be controlled and readable.

Implementation rules:

- Use short flashes for impact, completion, state changes, and learning abilities.
- Avoid large repeated full-screen flashes.
- Prefer object-local flashes where possible.
- Combine bright and dark contrast if a white flash disappears against a bright background.
- Scale flash strength by camera distance and event importance.
- Be careful with accessibility: do not create rapid strobing patterns.

Good use cases:

- Ship impact flash.
- Ability learned.
- Habitat completed.
- Quest task completed.
- Object repaired or revived.

## 18. Effect Performance Budget

Effects should feel rich without becoming wasteful.

Implementation rules:

- Keep particle lifetimes short by default.
- Reuse billboard textures where possible.
- Avoid spawning many overlapping particles in the same position.
- Use grouped textures when many tiny particles would be too expensive.
- Prefer deterministic or bounded random variation for testability.
- Add constants for particle count, lifetime, speed, and scale.

Review checklist for any new effect:

- What event does it communicate?
- Is it visible from the gameplay camera?
- Is the scale right for the world?
- Does it fade out cleanly?
- Can it run many times without filling the screen?
- Is it tied to gameplay timing, or only visual timing?

## 19. Assistance Without Humiliation

The game should avoid hard failure walls. If the player cannot clear a task, the game should offer a way forward without making the player feel punished or embarrassed.

Implementation rules:

- Prefer gentle help over "you failed" messaging.
- Give hints before offering skips.
- Let players retry quickly.
- If a task is optional, let the player leave and return later.
- If a task is required, add a fallback path that preserves the fantasy.
- Avoid difficulty changes that require restarting the whole game.

Small Island examples:

- If the player repeatedly uses the wrong button near a target, show the valid input.
- If the player cannot find a target, strengthen world cues before adding UI clutter.
- If a robot ability target is invalid, explain why and point to a valid nearby target.
- Critical story progress should not depend on precision execution.

## 20. Freedom Of Solution

Some games are satisfying because they provide a clear intended solution. Others are satisfying because the player can solve problems their own way. Small Island should lean toward guided freedom.

Implementation rules:

- Use clear first-use guidance when introducing a mechanic.
- After the first use, allow multiple valid placements or routes where possible.
- Avoid making every puzzle a single exact answer unless the story requires it.
- If a solution is constrained, make the constraint visible in-world.
- Prefer "this works here because..." over invisible restrictions.

Examples:

- Bio-Grow should teach a valid tile first, then allow player choice on restored ground.
- Habitat composition can require categories, but should allow flexible layout.
- Workbench recipes can be fixed, while placed objects can be player-directed.

## 21. Strengths, Weaknesses, And Synergy

Abilities, robots, and future systems should have clear strengths and weaknesses. Differences create choice; flattening everything makes the game dull.

Implementation rules:

- Preserve identity even when balancing.
- If something is strong, adjust cost, range, timing, setup, or recovery before removing its personality.
- Prefer complementary abilities over universal abilities.
- Let one robot solve problems another cannot.
- Make synergies visible: Hydro Jet restores, Bio-Grow grows, future Cut harvests or clears.

Ability balancing levers:

- Range.
- Setup time.
- Robot travel time.
- Valid target type.
- Material cost.
- Cooldown or queue limit.
- Feedback strength.

## 22. Reward Should Match The Deed

The result should feel proportional to what the player accomplished. If the player took a bigger risk, spent more resources, or solved a more specific problem, the reward should feel bigger.

Implementation rules:

- Bigger tasks get bigger visual/audio/UI feedback.
- Harder-to-complete actions should create stronger progress.
- Do not over-penalize small mistakes.
- Do not under-reward meaningful restoration/building.
- If the player did something clever, acknowledge it through world change or notice.

Small Island examples:

- Restoring one tile gets a small effect.
- Completing a habitat gets a stronger celebration.
- Crafting a first Campfire gets a special confirmation.
- Reviving a dead tree should feel more important than watering ordinary ground.

## 23. Balance For Real Players

Developers become too good at their own game. Balance should account for players who are new, distracted, or not action-game experts.

Implementation rules:

- Do not tune only against expert developer play.
- Test early tasks with generous interaction ranges.
- Keep required early actions slower and clearer than developer instinct suggests.
- Add debug/test coverage for timings and ranges that can break progression.
- Preserve challenge for optional or later content.

Small Island target:

- Main story path: friendly and recoverable.
- Optional challenges: sharper timing, higher risk, better reward.
- Exploration/building: low pressure, satisfying repetition.

## 24. Build On Existing Systems

Existing systems are valuable because they already carry solved problems: input, camera, quest flow, rendering, ability targeting, and UI feedback. Future work should build on them instead of restarting patterns from scratch.

Implementation rules:

- Reuse existing systems when they make a new task safer and faster.
- Do not repeat the same content with a new skin unless it adds new value.
- Each new chapter, robot, or mechanic should add a clear upgrade: new verb, new constraint, new reward, new world state, or new emotional beat.
- When extending a system, state what must remain stable before changing it.
- Do not let continuity become stagnation. The player should feel the game is growing.

Small Island examples:

- New robot abilities should use the existing ability structure, but each robot needs a distinct verb and personality.
- New restoration tasks should preserve the quest/HUD language, but introduce different world consequences.
- Future islands or chapters should carry forward the crash/restoration fantasy while adding new problems.

## 25. Standard Controls And Key Config

Controls should use familiar conventions when that reduces explanation. Originality should come from the game, not from making common actions harder to discover.

Implementation rules:

- Use standard-feeling defaults for movement, interaction, camera, and action buttons.
- Do not repeatedly explain controls that players already expect from the genre.
- Show context prompts only when they help the immediate situation.
- Support key/button remapping where feasible.
- Do not promise impossible mappings: analog movement and digital buttons are not equivalent.
- Keep prompts connected to real bindings whenever the input system supports it.

Current control intent:

- `A / E / X`: interact with nearby context targets.
- `RT`: use the selected field move.
- Movement input should return the camera from dialogue framing to gameplay framing.
- Cinematic input should produce skip feedback instead of feeling dead.

## 26. Customization Should Be Play

If the game adds loadouts, robot modules, furniture sets, habitat parts, or ability upgrades, the customization screen and workflow must be enjoyable by itself.

Implementation rules:

- Make effects understandable before commitment: preview range, target type, cost, or visual result.
- Give choices clear merits and drawbacks.
- Avoid long unsorted lists of similar-looking items.
- Add sorting, grouping, filters, or quick categories once the list grows.
- Provide a reasonable auto-pick option for players who do not want to optimize.
- Let the player test or preview changes quickly.
- Visual identity matters. Cute, cool, strange, or funny options can be valid even when they are cosmetic.

Small Island examples:

- Future habitat parts should be grouped by function and visual mood.
- Robot ability upgrades should show what they change: range, speed, target type, cooldown, or output.
- Cosmetic robot parts can be worth having if they make companions feel more personal.

## 27. Inspiration Must Become Original Value

It is fine to learn from existing games, but Small Island should not remain only "like another game." Borrowed patterns need to become part of this game's own identity.

Implementation rules:

- When using a familiar pattern, define what Small Island adds to it.
- Avoid copying a mechanic without adapting it to robots, restoration, crafting, and island change.
- A reference can guide feel, but the final implementation must serve this world.
- Prefer a few distinctive systems over many generic borrowed systems.

Good Small Island differentiators:

- Companion robots grant and perform abilities.
- The island visibly heals through player work.
- Quests are practical jobs, not abstract checklist tasks.
- Comedy and melancholy can coexist through Chopper, Bill, and the crash setup.

## 28. Scores Must Mean Something

Do not add score just because games often have score. If the game measures progress, the number should mean something in the fiction or player goal.

Implementation rules:

- Prefer meaningful metrics over abstract points.
- Name progress in a way that reinforces the fantasy.
- Use fast, satisfying count-up animation when showing gains.
- Do not turn cozy progress into humiliating rankings.
- If a metric is visible, make it actionable.

Possible Small Island metrics:

- Island vitality.
- Habitats restored.
- Plants revived.
- Robots awakened.
- Homes or stations built.
- Pollution/dryness reduced.
- Bots gathered or supported.

## 29. Peaky Characters And Special Rules

Characters, robots, enemies, and abilities should not become average versions of each other. Strong identity often requires a special rule.

Implementation rules:

- Each important robot should have a one-sentence mechanical identity.
- Give characters clear strengths and weaknesses.
- If a character needs a unique behavior, implement it deliberately instead of flattening it into a generic system.
- Preserve personality during balance passes.
- Fix problems by adjusting cost, timing, range, recovery, or setup before removing identity.

Examples:

- Hydro Bot / Robot-1: restores dry ground and damaged plants through water.
- Grow Bot / Robot-2: grows plant life and habitat structure.
- Chopper: guide, technician, comic narrator, and early-game anchor.

## 30. Color And Readability Accessibility

Gameplay information cannot rely on color alone. Tiles, markers, UI, resources, ability highlights, and interaction prompts need readable shape, value, icon, or motion differences.

Implementation rules:

- Use shape, outline, icon, pattern, text, or animation in addition to color.
- Check important screens in grayscale when possible.
- Use colorblind simulation/filter checks for mechanics that depend on color.
- Increase brightness/value contrast when two gameplay states look too similar.
- Avoid hiding important foreground objects inside visually similar terrain.

Small Island watchlist:

- Dry ground versus restored ground.
- Dead grass versus green grass.
- Valid ability target versus invalid target.
- Selected ability versus unavailable ability.
- Quest completion state.
- Resource type icons.

## 31. Helper AI Must Feel Fair

Computer-controlled characters should feel helpful, readable, and limited. They should not feel like they are cheating or teleporting knowledge into the world.

Implementation rules:

- Give NPCs and helper robots human-readable reaction delays.
- Avoid impossible instant response unless the fiction clearly supports it.
- Keep behavior state rules simple enough to avoid contradictions.
- If behavior changes by state, make the state visible: idle, patrolling, helping, talking, blocked.
- Strong or skilled AI should be active and readable, not perfect at defense.
- Friendly helpers should need target markers, line of intent, or travel time so their actions feel grounded.

Small Island examples:

- Robot ability helpers should visibly travel or prepare before acting.
- Patrols should stay bounded and avoid hiding critical characters.
- Dialogue framing should make NPC attention clear without freezing normal recovery flow.

## 32. Cinematics Must Respect Control

Cinematics can create emotion, comedy, and pacing, but they should not make the player feel trapped. Long non-interactive scenes are expensive because the player came to play.

Implementation rules:

- Keep non-essential cinematics short.
- Make cinematics skippable, including on first play.
- If a cinematic cannot be skipped immediately, show clear hold-to-skip feedback.
- Prefer dialogue scenes that advance line-by-line when the player controls the pace.
- Avoid QTE-style inputs inside cinematics unless the interaction is essential and clearly telegraphed.
- Use cinematics as reward, setup, or punchline, not as a replacement for gameplay.

Small Island examples:

- The ship crash opening can be cinematic because it establishes the premise, but it still needs skip feedback.
- Chopper's Bill cutaway works because it is short, comedic, and connected to dialogue.
- Future story beats should return control quickly unless player agency is part of the scene.

## 33. Start With A Hook

The opening should wake the player up quickly. If the game has a strong premise, threat, joke, crash, mystery, or objective, show it early instead of spending too long on ordinary setup.

Implementation rules:

- Get the player into the world quickly.
- Show the core fantasy early: crash, damage, robot help, restoration.
- Let the player operate soon after the opening beat.
- Backstory can arrive later through dialogue, objects, and world context.
- Avoid slow introductions that explain before the player has a reason to care.

Small Island opening target:

- The crash establishes urgency and tone.
- Chopper establishes comedy and guidance.
- The first robot/ability establishes the restoration loop.
- The first playable task should happen before the player feels like they are waiting for the real game.

## 34. Onboarding Should Be Gentle, Not Controlling

The first contact with the game should lower friction without making the player feel dragged by the hand. Beginners need safety; experienced players need room to move.

Implementation rules:

- Early tasks should be easy to understand and hard to break.
- Do not punish players for experimenting with buttons or walking around.
- Give enough freedom for the player to feel they entered the situation voluntarily.
- Avoid crushing new players with expert-level timing, density, or precision.
- If the player is failing, improve cues before taking over control.
- Use friendly framing: help, hint, redirect, confirm.

Small Island examples:

- First movement, first interaction, first Hydro Jet use, and first Bio-Grow use should be generous.
- NPC prompts should appear for all dialogue-capable characters, not only Chopper.
- Player input near valid targets should produce action or useful feedback.

## 35. Player Time Is A Cost

Playtime is not automatically a selling point. The game should earn the player's time by giving control, progress, and satisfying work.

Implementation rules:

- Prefer more meaningful playable time over longer runtime.
- Avoid padding with repeated instructions, slow fades, or long waits.
- Keep transitions fast unless the delay has a gameplay or emotional purpose.
- Make repeated actions pleasant through feedback, not just longer.
- Do not advertise or design around huge completion time as if time alone is value.
- When adding a system, ask what it gives back for the time it asks.

Small Island examples:

- Restoration loops should stay tactile and quick.
- Quest tracker updates should clarify the next action without over-explaining.
- Crafting/building should be efficient once understood.
- Cinematics, camera moves, and UI transitions should be reviewed for avoidable waiting.

## 36. Design For The Actual Platform

The game should be designed around the real strengths and limits of its target platform, renderer, input devices, and screen size. A feature is only good if it works well in the actual play context.

Implementation rules:

- Check whether a feature serves this game's camera, input, performance, and visual scale.
- Do not add hardware/platform features just because they exist.
- If a platform limit makes something unreadable or unstable, redesign the feature instead of forcing it.
- Preserve the target performance feel when adding effects, AI, UI, or camera work.
- Tune for the screen where the player actually plays, not only for ideal screenshots.

Small Island examples:

- The fixed game-stage and camera are part of the game's identity.
- Pixel-perfect UI should be checked at gameplay scale.
- Ability targets and characters must remain readable from the default camera.
- Smoke, grass, particles, and helper robots must not obscure the player in normal play.

## 37. Layer Complex Mechanics

When a mechanic asks the player to handle several actions at once, introduce it in pieces. The first use should isolate the simplest useful version before asking for mastery.

Implementation rules:

- Break complex verbs into a guided first step and a freer second step.
- Teach targeting before timing if both are required.
- Teach movement before combining movement with ability use.
- Let one button handle common context actions when precision is not the point.
- Add optional depth after the player has succeeded once.

Small Island examples:

- Hydro Jet first teaches marking dry ground, then later can ask for better tile choice.
- Bio-Grow first teaches valid restored ground, then later can support habitat planning.
- Workbench first teaches one recipe, then later can expand into recipe choice.
- Robot helpers can perform the complex part while the player learns the intent.

## 38. Story Should Happen During Play

Small Island should avoid heavy briefing scenes when the same information can arrive during movement, restoration, crafting, or robot interaction.

Implementation rules:

- Prefer in-game dialogue over separate briefing screens.
- Let Chopper and robots talk while the player is already moving or working.
- Keep tone consistent: practical, funny, lightly strange, with moments of melancholy.
- Tie story lines to the actual system being used.
- Use cutaways only when they create a clear joke, reveal, or emotional beat.

Small Island examples:

- Chopper can explain robot abilities while the player sees the target.
- Bill's cutaway works as comic relief because it is tied to a specific dialogue beat.
- The crash story should be discovered through the damaged module, smoke, robots, and Chopper's comments.

## 39. Readability Beats Realistic Scale

If realistic size makes gameplay hard to read, exaggerate. Important targets, enemies, NPCs, and effects should be sized for clarity from the gameplay camera.

Implementation rules:

- Make active targets large enough to understand quickly.
- Do not make the player aim at tiny details unless precision is the challenge.
- Use outline, marker, motion, or staging when size alone is not enough.
- Keep important actors clear of foreground clutter.
- Test readability with HUD visible, not only in clean scene captures.

Small Island examples:

- Marked ability tiles need strong ground-plane readability.
- Dialogue-capable NPCs should not be hidden by grass or props.
- Ship smoke and dust can be large, but must not hide the first playable objective.
- Robot miniatures in HUD should be recognizable at their actual displayed size.

## 40. Variety Needs Cost And Shape

Weapons, abilities, robots, items, and future upgrades should feel like different characters. Variety should change behavior, cost, range, movement, timing, or role, not only raw power.

Implementation rules:

- Give each option a visible reason to exist.
- Avoid one obvious best choice unless it is a temporary reward or tutorial simplification.
- Use cost, setup, range, cooldown, valid targets, travel time, or inventory shape to create choice.
- Let strong options ask for stronger commitment.
- Collection systems should create curiosity, not mandatory grind.

Small Island examples:

- Robot abilities should differ by verb and world effect.
- Future upgrades can trade speed for range, area for precision, or power for material cost.
- Habitat parts can have function, category, and visual identity.
- If loadouts exist later, limited slots or shapes can create meaningful choices.

## 41. Tuning Should Not Be A Bottleneck

As the game grows, parameter tuning should become easier to inspect, compare, and test. Critical balance should not depend on one person remembering hidden numbers.

Implementation rules:

- Put important timings, ranges, speeds, and counts in named constants or data.
- Add tests for progression-critical values.
- Prefer data tables for ability definitions once the list grows.
- Keep debug overlays focused on current systems, not permanent clutter.
- Record why a value exists when changing it would break feel or progression.

Small Island watchlist:

- Interaction ranges.
- Robot patrol radius and travel speed.
- Ability cast timing and target radius.
- Cinematic durations and skip timing.
- Camera zoom/framing transitions.
- Particle count, lifetime, and opacity.

## 42. Updates And Scope Have A Cost

Live updates, DLC-style additions, and long support can improve the game, but they consume real development time. Scope should be planned before promising ongoing expansion.

Implementation rules:

- Treat every new robot, ability, biome, or chapter as a scoped feature, not a small content drop.
- Prefer completing the core loop before expanding horizontally.
- Keep future hooks lightweight until the current path is solid.
- Add content in a way that reuses stable systems without flattening identity.
- Do not let support work delay fixing core early-game friction.

Small Island examples:

- Finish crash, first robot, first restoration loop, Workbench, and habitat basics before broad new biomes.
- New robots should plug into existing ability/HUD/dialogue patterns, but still receive distinct behavior.
- Future content plans should be tracked as backlog seeds until implementation is intentionally selected.

## 43. Errands Need a Reason to Exist

Collection, delivery, repair, scan, and activation tasks are allowed, but they must not feel like empty travel. A small errand should still create curiosity, show progress, and leave the world changed.

Implementation rules:

- Give every errand a hook: a contradiction, risk, joke, mystery, or useful promise.
- Include at least three anti-busywork elements: visible reward, micro-event, player choice, fast resolution, or narrative hook.
- Prefer radio completion, shortcut unlocks, fade returns, or immediate next beats over forcing a walk back through cleared space.
- Let the Pokedesk, Chopper, helper bots, sound, inventory flyouts, or environmental reactions carry micro-rewards during the route.
- Validate errand data in development so weak fetch quests warn before they become content debt.

Small Island examples:

- "Wake Up Hydro" completes when Hydro Jet is received; any warm wood/charge scan is setup flavor, not the completion condition.
- A safe approach can scan deposits first; a fast approach can collect immediately and let Chopper interpret the odd readings.
- Completion should show a base/system result and tease the next question instead of asking for a dead return trip.

## 44. Every Line Must Work

Games have fewer words per minute than film, television, or books because the player spends most of the time acting. Every prompt, bark, menu label, objective, and traversal line should either teach the action, reveal the world, show character, clarify relationships, move the plot, or be strong enough as a joke or image to justify itself.

Implementation rules:

- Avoid throwaway lines that only fill silence.
- Instructional text should do double duty whenever possible.
- Prompts can name the fiction of the system, not only the input.
- Traversal dialogue should use the player's attention to reveal character or world state.
- UI copy should reinforce Sandbots: helper bots, damaged colony systems, care, repair, viability, and planetary restoration.

Small Island examples:

- "Colony log online. LB/RB tabs" is better than a bare "LB/RB Tabs" because the menu becomes part of the world.
- "Rewire the pilot console" gives the Controls tab a fiction, while still explaining remapping.
- A placement notice should prefer "House Kit needs Solar Station power" over a generic "Blocked."

## 45. Camera Target Is Not The Character

The camera's look target should be treated as a design tool, not a point glued to the player. A character can remain centered horizontally while jumps, slopes, drifts, or action beats use reduced vertical tracking, lead, or offset to make motion readable.

Implementation rules:

- Do not blindly attach camera target Y to character Y.
- Use reduced vertical follow when height should be felt.
- Keep horizontal lead when it helps the player see where they are moving.
- Preserve explicit camera poses for dialogue, cutaways, and scripted focus.
- Test camera feel from the actual gameplay stage with HUD visible.

Small Island examples:

- Gameplay follow can track only part of the player's vertical offset so jumps or slopes read as motion.
- Ability targets should remain visible ahead of the bot/player instead of hiding under a perfectly centered character.
- Dialogue camera focus can still use exact scripted targets because it serves a different purpose.

## Current Priority List

1. Finish input response polish.
2. Create first-use guidance for each unlocked ability.
3. Improve attention without minimap.
4. Add assistance without humiliation for wrong/early inputs.
5. Add more satisfying world feedback for restoration/building.
6. Audit effect scale for crash, Hydro Jet, Bio-Grow, crafting, and habitat completion.
7. Add safe motion variation to existing effects.
8. Add readability checks for tile states, ability targets, and quest completion.
9. Review opening pacing and cinematic skip behavior.
10. Add ability/robot data table before the move list grows further.
11. Add tuning tests for critical timings/ranges.

## Backlog Seeds

- Feedback when the player presses an action too early near a valid target.
- Gentle hint escalation for repeated failed actions.
- Ability definition table with benefit, limit, first use, and feedback.
- World marker audit for active objectives.
- Workbench first-use guidance.
- Habitat completion celebration.
- Seeded particle variation helper.
- Interaction range regression tests.
- Billboard particle helper for smoke/dust/spark effects.
- Effect scale audit for world objects.
- Hydro Jet spray arc polish.
- Bio-Grow trail and growth burst.
- Object-local flash helper for success/state changes.
- Ability balance table with strengths, weaknesses, and synergy.
- Optional challenge reward rules.
- Input remapping plan for keyboard and controller.
- Ability and robot identity table with one-sentence mechanical roles.
- Island vitality or habitat progress metric proposal.
- Accessibility pass for color-only gameplay signals.
- Robot helper behavior state checklist.
- Customization preview rules for future robot parts, furniture, and habitat pieces.
- Cinematic skip/hold prompt regression tests.
- Opening pacing audit from crash to first playable task.
- Dialogue line pacing review for comedic beats and player control.
- Transition duration audit for menus, cinematics, and gameplay recovery.
- Platform readability audit for default camera and HUD scale.
- First-use flow checklist for every unlocked ability.
- Story-during-play pass for Chopper and robot guidance lines.
- Data-driven tuning table for ability ranges, cast times, and helper travel.
- Scope gate checklist before adding new robots, biomes, or chapters.
