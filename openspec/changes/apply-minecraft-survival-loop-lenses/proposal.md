# Change: Apply Minecraft Survival Loop Lenses

## Why

Sandbots needs to move from isolated tutorial objectives toward a readable world
loop: stabilize the outpost, gather useful resources, protect progress, expand
range, restore systems, and build a viable colony.

The local reference `material/minecraft.pdf` is useful because its complete
extractable chapter focuses on the post-opening foundation loop: HUD, tools,
storage, risk, scouting, resources, and choosing a building site. The goal is
not to copy Minecraft. The goal is to translate those proven player-orientation
patterns into Sandbots' colony-restoration fantasy.

## Source Notes From Current Reading

The current PDF extraction contains the introduction, table of contents,
Chapter 3 "Gathering Resources", and index. The useful actionable observations
from the available pages are:

- The HUD communicates status and capability, not just instructions.
- Better tools are not decoration; they reduce friction and expand what the
  player can do.
- Storage protects progress and makes the base feel useful.
- Risk makes preparation meaningful before leaving the safe area.
- Resource scouting is a mission with multiple useful discoveries, not a
  single fetch objective.
- Choosing a building site is a spatial decision with criteria: visibility,
  flatness, safety, nearby resources and room to grow.
- Landmarks help players return without needing abstract instructions.
- Categories in inventory/building mode create a mental model of the world.

## Source Notes From Minecraft Code Reading

The local folder `material/minecraft-source-code` appears to contain a Minecraft
1.12 MCP-style decompiled workspace with runtime scripts, assets and Java source.
It is too large to read broadly in one pass, so the first safe reading sampled
only high-level structure and a few representative systems.

Useful architecture observations:

- Content is organized through central registries and catalogs such as blocks,
  items, biomes and sounds.
- Recipes are largely data-driven through JSON assets, with runtime code parsing
  and registering them.
- Advancement/progression triggers are data-driven JSON definitions tied to
  events such as inventory changes.
- Key bindings are logical actions with categories, default bindings and runtime
  pressed/just-pressed state.
- The workbench/crafting table is not just UI; it is a container contract with
  slots, recipe resolution, close cleanup and interaction validation.
- The in-game HUD is composed from distinct overlays: hotbar, status bars,
  titles, chat, subtitles, debug, boss/player overlays and transient messages.

Modern Sandbots translation:

- Prefer typed/pure catalogs and validation over global static mutable
  registries.
- Prefer small JSON/JS/TS content definitions with tests over scattered runtime
  strings.
- Treat progress triggers as event contracts instead of ad hoc quest mutations.
- Keep logical input actions separate from display labels and devices.
- Treat workbench, cache and terminal interactions as domain containers with
  validation, not merely modal screens.
- Compose HUD panels from state contracts instead of one large UI controller
  owning every concern.

## What Changes

- Define a spec-driven backlog for Sandbots based on the above observations.
- Add requirements that future early-game systems must support status,
  preparation, resource purpose, protected progress, landmarks and spatial
  building decisions.
- Keep each implementation slice small enough to be tested independently.

## Non-Goals

- Do not implement these systems in this change.
- Do not copy Minecraft mechanics such as hunger, hostile mobs, beds, torches,
  mining layers or block-by-block construction.
- Do not redesign the whole HUD, inventory, workbench or quest system at once.
- Do not make Hydro Bot the center of this backlog.

## Preflight

- Objective: create an implementation-ready OpenSpec task list from deeper PDF
  reading.
- Likely files involved: only OpenSpec documentation for this pass.
- Smallest safe change: add a new change with proposal, tasks and spec.
- Files not to touch: runtime, HUD, quest data, world logic, camera, input,
  inventory and workbench code.
- Risk: overgeneralizing from Minecraft instead of translating to Sandbots.
- Size: small documentation slice.

## Translation Principles

| Minecraft Pattern | Sandbots Translation |
| --- | --- |
| Survival status HUD | Colony viability/status HUD |
| First tools | Field tools and bot capabilities |
| Chest protects items | Colony Cache protects gathered progress |
| Food/prep before travel | Energy/tool/bot readiness before expeditions |
| Resource reconnaissance | Short expedition loop with multiple useful finds |
| Building site choice | Habitat/site choice based on colony criteria |
| Torches/towers/coordinates | Beacons, cable trails, ship, terminal and landmarks |
| Creative inventory categories | Workbench/manual categories by colony system |
| Registries/catalogs | Validated Sandbots content catalogs |
| JSON recipes | Data-driven workbench protocol definitions |
| Advancement triggers | Colony milestone trigger contracts |
| Key binding categories | Logical input action registry |
| Crafting container | Workbench/domain interaction contract |
| HUD overlays | Small HUD panels fed by explicit state |

## Recommended Implementation Order

1. Add `Colony Status HUD v1` as a small data-to-HUD slice.
2. Add `Colony Cache v1` as a protected base storage concept.
3. Run a `Resource Purpose Pass` so early resources have clear use and scarcity.
4. Add `Base Landmark Pass` for ship, terminal, workbench and beacon readability.
5. Add `First Habitat Site Choice` with simple visible criteria.
6. Add `Workbench Category Pass` for Power, Water, Soil, Shelter, Bots, Tools and
   Materials.
7. Add `Progress Trigger Contract v1` so milestones are event-driven.
8. Add `Workbench Container Contract v1` before expanding crafting.
9. Add `HUD Panel Composition v1` before a larger UI redesign.
10. Add `Short Expedition Loop v1` after the above pieces are stable.
