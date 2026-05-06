# Act 1 Starting Biome And First Repair Decisions

## Scope

These decisions finalize the current starting-biome repair slice without changing
runtime boot, camera, input, stage, render frame, scene flow, renderer logic or
asset loading. The slice uses existing source-facing IDs and leaves any copy or
ID rename to the naming migration spec.

## Damaged Hub And Board

- Destroyed hub/center location: the damaged shared center is the current
  `ruinedPokemonCenter` site at `RUINED_POKEMON_CENTER_POSITION`.
- Discovery interaction: Professor Tangrowth guides the player to the ruined
  Pokemon Center after Charmander lights the Campfire; inspecting the building
  sets `ruinedPokemonCenterInspected`.
- Challenge/request board equivalent: the `pokemonCenterPc` site is the first
  board equivalent. It becomes usable after the ruined center is inspected and
  owns the first challenge and shop handoffs.
- Route unlock guard: inspecting the ruined center or checking the PC must not
  directly open later macro-biome routes.

## Important Act 1 Repair

- First shared hub repair: the playable repair for this slice is the Leaf Den
  construction chain. It turns the restored starting area into a usable community
  home instead of rebuilding the entire Pokemon Center structure in this pass.
- Initiation challenge: the Boulder-Shaded Tall Grass challenge is the first
  challenge objective unlocked from the PC.
- Helper unlock: Timburr is revealed through the Boulder-Shaded Tall Grass
  challenge and becomes the construction specialist for the Leaf Den repair.
- Helper-character request: Timburr's follow-up request is the Leaf Den
  furniture request, tracked by `leaf-den-furniture`.

## General Request Pack

- Habitat invite: Boulder-Shaded Tall Grass creates the local habitat clue that
  reveals Timburr.
- Comfort raise: Bulbasaur's Straw Bed and the Leaf Den furniture request prove
  that habitat quality matters, not only raw repair completion.
- Helper material conversion: Timburr and Charmander are required helpers for
  Leaf Den construction, turning gathered materials into a collaborative repair.
- Blocked-wall route: the later Granite Ridge wall remains a separate Act 2B
  blocker and is not repaired in this slice.

## Recipe And Material Pack

- Hub repair kit: `leafDenKit` is the first repair kit equivalent.
- Simple building pieces: Leaf Den construction uses the placed kit, gathered
  Wood and Leaves, and helpers.
- Storage/community utility: the Pokemon Center PC owns challenge and shop
  utility for this slice.
- Shop/environment-level unlocks: PC shop availability grants the Leaf Den Kit
  purchase path after Tangrowth explains houses.
- Material tier: Act 1 stays in natural and first processed building materials.
  Wood, Leaves, Life Coins and placed kits are valid; ore, ingots, granite tools,
  advanced concrete and rare machine parts are out of scope here.
- Required materials: `LEAF_DEN_BUILD_REQUIREMENTS` is the repair material
  contract: 3 Wood and 3 Leaves.

## Repair Completion And Handoff

- Repair action: place the Leaf Den Kit, gather the required materials, bring
  Timburr and Charmander, then inspect the kit to start construction.
- Repair confirmation: `LEAF_DEN_COMPLETE` sets `leafDenBuilt` and opens the
  `leaf-den-furniture` helper request.
- Repaired visual/dialogue state: `leafDenBuilt` switches the Leaf Den from kit
  construction to completed den/entrance state, and the request log reports
  "The Leaf Den is complete."
- Next route/gate unlock: `root-signal` is the starting-biome completion token
  that allows Tidefall Coast and Granite Ridge in the macro-biome gate catalog.
- Completion handoff: this slice finalizes `root-signal` as the catalog handoff;
  the exact runtime grant point can be implemented in a later focused source
  slice if needed.
