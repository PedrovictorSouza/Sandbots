# Change: Apply Artificial Intelligence for Games behavior lenses

## Why

Sandbots already has useful systems: bots, interaction triggers, placement,
quests, sound feedback, camera beats and HUD panels. The weak point is that some
world objects and bot behaviors still feel accidental: the player sees something,
infers a purpose, and the game does not always pay that inference off clearly.

`Artificial Intelligence for Games` is useful here because it argues for simple,
observable behavior over complex hidden intelligence. Sandbots does not need
large AI systems in this slice. It needs a small, data-driven contract that tells
objects, bots, quests, sound and camera what a world event means.

## What Changes

- Define object affordances as the first source of truth for what a world object
  blocks, allows, teaches, triggers or rewards.
- Define concrete actions that connect an input to prerequisites, target types,
  world effects and feedback.
- Keep bot behavior simple and explicit through small state machines.
- Route important state changes through events so sound, HUD, quest and camera
  feedback stay coherent.
- Add validation tasks that prevent invisible or disconnected behavior.
- Protect frame rate by scheduling nonessential bot behavior at lower frequency.

## Non-Goals

- Do not add learning AI, neural networks, GOAP, fuzzy logic or broad planners.
- Do not rewrite pathfinding, movement, camera, render frame, scene flow or input.
- Do not change story copy in this spec.
- Do not redesign the first 30 seconds in this spec; this only prepares behavior
  contracts that future opening work can use.
- Do not rename internal ids unless a future slice maps all references first.

## Preflight

- Objective: turn the AI book into small implementation tasks for observable bot
  and world behavior.
- Likely future files: object/buildable catalogs, robot catalog/state helpers,
  quest/progression tests, sound event runtime, placement validation and focused
  HUD/debug presenters.
- Smallest safe change now: OpenSpec documentation only.
- Files not to touch now: camera base, stage, render frame, input mapping,
  scene flow, game loop and broad session builders.
- Risk: object affordances can become a global abstraction if implemented too
  broadly. Each future task must start with one object family or one bot state.
- Size: small for this spec; medium for implementation if split correctly.

## Source Notes

- Complexity fallacy: a simple visible rule often reads as intelligence; complex
  hidden logic often reads as broken.
- Perception window: the player judges behavior from a short visible slice, so
  behavior changes need context, feedback and readable cause.
- Decision making model: external knowledge plus internal state should generate
  an action request.
- Events and polling: events help when multiple systems need the same knowledge;
  polling remains acceptable for small local checks.
- Object/action knowledge: objects need to describe their significance and
  actions need to describe prerequisites, effects and timing.
- Scope of one game: use one or two strong behavior techniques sparingly; keep
  the rest rock-solid.
