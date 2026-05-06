# Design: Finalize Act 2A Water/Beach Biome

## Scope

This promotion freezes the content contract for Act 2A without changing runtime
gameplay behavior. It must not touch camera, stage, render frame, scene flow,
input ownership or global game systems.

## Region Entry

Tidefall Coast opens after the Root Signal handoff from Act 1. The current
region anchors remain `east-palm-coast`, `south-marsh` and
`outer-south-marsh`, with Granite running as a parallel later macro-biome
instead of a prerequisite for this entry.

## Characters

Nami is the Tidefall guide and local mentor. Her arc owns the practical
restoration read of the coast: cleanup, water routing and light restoration.
Kelp is the local conflict/request character that makes flooded homes and
blocked infrastructure personal.

Existing bridge, Bufo and Squirtle content remains source-compatible while this
slice is promoted. A later implementation slice can rename or replace proxy
content only with focused migration tests.

## Broken Infrastructure

The first hard route objective is the South Bridge. The player must craft a
`bridgeKit` at the workbench from Wood x4 and Flax Fiber x2, then deliver one
`bridgeKit` to the bridge through `repairBridge`. The repaired route enables the
`meetBufo` marsh follow-up.

## Important Requests

The regional environmental restoration request is the Tidefall cleanup route:
clear flooded or blocked flow, restore usable paths and bring the water route
back online.

The hub recovery request is the local coast and marsh community recovery:
restore usable home, habitat, light and service spaces after the route cleanup
has made them reachable.

The major region request completes Tidefall Coast and grants `tide-signal`.

## General Requests

The Act 2A request pack covers:

- Cleanup of flooded, blocked or dry coastal spots.
- Lighting, energy or guidance restoration for the dim route.
- Delivery tasks that support the bridge and local service recovery.
- Habitat and home requests tied to water-adjacent spaces.
- Water traversal or cleanup support, currently anchored by Water Gun.

## Recipes And Materials

The recipe pack is anchored by `tidefall-coast-cleanup-recipes` and the current
`bridgeKit` recipe. The material tier is `coast-clay-glass`.

Allowed Act 2A recipe families are water cleanup utilities, beach/clay/glass
props, lights, planters, bridge or walkway pieces and local coast decor.
Allowed material families are beach resources, clay, glass, shells,
light/energy components and local water-route materials.

## Mechanics

Flood, blockage and infrastructure cleanup should be explicit quest progress or
delivery/install progress. Repeating an already completed cleanup must not grant
duplicate progress or rewards.

Water Gun is the current cleanup ability anchor for Tidefall. Future water
traversal behavior must be added as a separate focused slice unless it already
fits the same tested ability contract.

## Habitats

Local habitats are water-adjacent and flower/wetland-adjacent spaces already
represented by the habitat catalog, such as fresh-water, ocean-water and
hydrated flower or field habitats. This slice does not add new habitat runtime
behavior.

## Completion And Next Gate

Tidefall completion sets the `tide-signal` handoff token through the final
readiness data. This contributes to Skyforge readiness. It does not make Granite
depend on Tidefall unless a later progression slice explicitly changes that
gate.
