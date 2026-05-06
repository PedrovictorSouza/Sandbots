# Change: Map game architecture patterns

## Why

The final game will add more quests, regions, characters, recipes, abilities and UI
states. Without explicit architecture ownership, content work can leak into input,
runtime loops, scene flow or rendering. The project needs a pattern map that tells
future slices where behavior belongs.

## What Changes

- Define the major game systems and their pattern responsibilities.
- Define boundaries between content catalogs, quest state, scenario gates, input,
  rendering and UI presentation.
- Define which systems are high-risk and require separate specs before changes.
- Provide a data-first architecture reference for future TDD slices.

## Non-Goals

- Do not refactor existing systems in this change.
- Do not move files or rename modules.
- Do not change runtime behavior.
- Do not change camera, input, render frame, stage or scene flow.

## Preflight

- Objective: document architecture ownership before final content integration.
- Existing context: architecture graph reports no cycles but identifies hub-risk
  modules; roadmap already names systems and patterns.
- Smallest safe change: OpenSpec documentation only, followed by optional pure data
  reference if needed.
- Risk: broad refactors would violate the small-slice rule and may break gameplay.
- Size: small.

## Pattern Map

| System | Pattern | Owns | Must Not Own |
| --- | --- | --- | --- |
| Input System | Command / Intent Adapter | Keyboard/gamepad/browser input converted into gameplay intents. | Quest state, story flags, recipes, rendering decisions. |
| Scenario System | State Machine / Gatekeeper | Macro-biome entry, route gates, act transitions and scenario setup. | Low-level input polling or render drawing. |
| Quest State Machine | State Machine | Request availability, progress, completion, rewards and next-step guidance. | Camera, mesh setup or direct input handling. |
| Flyweight Catalogs | Flyweight | Immutable data for biomes, character arcs, requests, recipes, habitats, moves and placeholders. | Runtime mutation. |
| Factory / Builder | Factory / Builder | Creation of placeables, repaired structures, habitats, NPC instances and UI view models. | Global orchestration. |
| Strategy | Strategy | Variants of actions such as traversal, powered moves, crafting processors and repair handlers. | Data catalog ownership. |
| Observer / Event Queue | Observer | Quest/UI/story reactions to gameplay events without direct coupling. | Persistent canonical state by itself. |
| Repository / Registry | Registry | Stable lookup by ids across catalogs. | Business rules that belong to quest/scenario systems. |
| UI Presenter | Presenter | HUD, request log, codex and feedback copy derived from state. | Gameplay rules or progression decisions. |
| Rendering System | Renderer | Drawing world, characters, UI overlays and frame output. | Story progression, input policy or quest rewards. |

## High-Risk Boundaries

The following systems require separate specs before behavior changes:

- camera
- render frame
- stage
- input
- scene flow
- runtime boot
- broad game loop interactions

Content-only slices should prefer catalogs, pure helpers and tests first.
