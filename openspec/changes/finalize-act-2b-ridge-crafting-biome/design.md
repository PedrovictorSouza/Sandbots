# Design: Finalize Act 2B Ridge/Crafting Biome

## Scope

This promotion freezes the Granite Ridge content contract without changing
runtime gameplay behavior. It must not touch camera, stage, render frame, input,
scene flow, world breaking handlers or global crafting architecture.

## Region Entry

Granite Ridge opens after the Root Signal handoff from Act 1. It is parallel to
Tidefall Coast and must not require `tide-signal` unless a later progression
slice explicitly changes that gate.

The current internal region anchors are `north-wool-ridge`, `granite-ford` and
`outer-north-ridge`.

## Characters

Mica is the required ridge specialist. Her arc owns material mastery, rescue
pressure and the practical knowledge that turns heavy terrain into repair
progress.

Riff is the required celebration lead. His arc turns tools, food and crafted
objects into community morale, proving that repair is becoming culture rather
than only survival.

Existing Bufo, Willow, marsh pie and granite gate content remains
source-compatible while this slice is promoted. A later implementation slice can
rename proxy quest ids or replace proxy characters only with focused migration
tests.

## Hub And Important Request

The local hub restoration is the ridge workshop or forge-camp recovery loop:
rescue the specialist, re-open the tool/cooking workflow and restore the local
place where stronger repairs can be prepared.

The Act 2B important request is the regional celebration and mood goal. It
requires enough cooking, crafting and route repair proof for the ridge residents
to treat the area as livable again.

Completing the major Granite Ridge request grants `forge-signal`.

## General Requests

The Act 2B general request pack covers:

- Cooking and delivery support.
- Powered-up action practice.
- Specialist rescue.
- Heavy-object movement.
- Cave or collapsed-route investigation.
- Party setup and morale requests.

## Recipes And Materials

The recipe pack is anchored by `granite-ridge-crafting-recipes`, with current
source anchors `marshPie` and `granitePickaxe`.

Allowed Act 2B recipe families are cutting or cooking tools, oven/furnace
pieces, party items, stage/decor pieces, stronger construction pieces and
ridge-style blocks.

The material tier is `ridge-ore-cooking`. Allowed material families are ore,
ingots, volcanic or stone materials, cooking ingredients and party materials.

## Mechanics

The current hard-rock blocker is the Granite Gate. The existing chain is:
`cookMarshPie`, `feedBufo`, `craftPickaxe`, `breakGate`, then `meetWillow`.

Rock Smash is the planned hard-rock ability slot for terrain blocks and stone
material sources. Strength is the planned heavy-object slot for push, pull and
placement puzzles. Until those runtime interactions are explicitly implemented,
the `granitePickaxe` and `breakGate` flow remains the source-compatible anchor.

Repeated hard-rock or heavy-object completion must not duplicate rewards,
materials or route-completion progress.

## Completion

Granite Ridge completion sets the `forge-signal` handoff token through final
readiness data. Skyforge Spires remains locked until both `tide-signal` and
`forge-signal` are present.
