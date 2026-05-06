# Change: Define story bible

## Why

The game needs an original story spine before final characters, quests, biomes and
credits are implemented. The reference material gives a useful structure, but the
project needs its own names, stakes, characters and emotional through-line.

This change defines the story bible for a complete beginning, middle and end while
keeping the final-game roadmap scoped to four macro-biomes.

## What Changes

- Define the original campaign premise.
- Define the four macro-biomes and stable ids for future data work.
- Define the required story arc for each macro-biome.
- Define the required character roles without copying reference-game characters,
  quest names, item names or dialogue.
- Define the ending and post-story sandbox fiction.
- Define how existing provisional names should be treated until a migration spec
  updates code.

## Non-Goals

- Do not change gameplay code in this story-bible change.
- Do not rename existing source ids or dialogue yet.
- Do not implement new quests, NPCs, regions, recipes, gates or credits.
- Do not copy reference-game text, names, characters, locations or exact request
  chains.

## Preflight

- Objective: create a story contract for future TDD implementation slices.
- Existing context: current source has a provisional ash/home arc, placeholder
  recipes, planned habitats/moves and a roadmap already constrained to four
  macro-biomes.
- Smallest safe change: add OpenSpec documentation only.
- Files not to touch: gameplay source, tests, runtime, camera, input, renderer,
  stage and scene flow.
- Risk: implementing final content before this bible would scatter story decisions
  across quests, dialogue, items and UI.
- Size: small as a docs-only change.

## Campaign Premise

The player wakes on a small island after a quiet ecological collapse has drained
color, water, warmth and signal from its communities. The island is not saved by
combat or collection alone; it is saved by making places livable again.

The player restores habitats, earns trust, repairs shared structures and brings
isolated communities back into one route network. Each macro-biome teaches one
larger lesson:

- Restoration makes life return.
- Infrastructure lets communities reconnect.
- Craft and food turn survival into culture.
- The final rebuilt beacon proves the island can guide itself after the credits.

## Four Macro-Biomes

These ids are the target product-facing macro-biome ids for future data work.
Current internal map zones may be mapped into them later.

| Stable Id | Display Name | Story Role | Completion Token |
| --- | --- | --- | --- |
| `ash-wilds` | Ash Wilds | Starting wasteland/tutorial biome. Teaches restoration, habitats, requests, crafting, home building and first hub repair. | `root-signal` |
| `tidefall-coast` | Tidefall Coast | Water/beach biome. Flooded paths, blocked flow and dim infrastructure are restored through cleanup, water routing and light. | `tide-signal` |
| `granite-ridge` | Granite Ridge | Ridge/crafting biome. Collapsed workshops, hard stone and community fatigue are repaired through tools, cooking and celebration. | `forge-signal` |
| `skyforge-spires` | Skyforge Spires | Final traversal biome. Elevated ruins test prior systems through lifts, glide-like traversal and staged large-building repair. | `sky-signal` |

## Main Character Roles

Names are product-facing targets for future implementation. Existing provisional
source names can remain until a migration spec changes them safely.

| Role | Target Name | Function |
| --- | --- | --- |
| Player | The Shaper | Customizable protagonist who restores terrain, learns companion actions and rebuilds homes. |
| Mentor | Chopper | Guides early restoration, explains next required goals and frames the island-wide repair. |
| Hearth keeper | Aunty | Grounds the starting biome emotionally; the first repaired home/hub matters because it protects her community. |
| First companion | Sprig | Teaches the player that restored habitats attract help. |
| Water guide | Nami | Leads Tidefall Coast cleanup and teaches flow/light restoration logic. |
| Coast conflict character | Kelp | Represents the flooded homes and blocked infrastructure of Tidefall Coast. |
| Ridge specialist | Mica | Opens Granite Ridge's material/crafting loop and rescue chain. |
| Celebration lead | Riff | Turns repair into community morale and marks the ridge as more than a resource biome. |
| Sky traversal mentor | Aero | Teaches elevated traversal and tests whether the player mastered route planning. |
| Final builder | Tova | Owns the staged Skyforge repair and final beacon readiness. |

## Story Arc

### Beginning: Ash Wilds

The player starts with no certainty that the island can recover. Chopper hears a
survivor signal and sends the player into dead ground. The first restored habitat
reveals Sprig, proving that repair attracts help. Aunty anchors the home loop:
crafting, placing, comfort and the first shared hub repair. Completing Ash Wilds
opens two parallel routes.

### Middle A: Tidefall Coast

Tidefall Coast is damaged by water in the wrong places and darkness where people
need guidance. Nami teaches the player to redirect flow and clean blocked spaces.
Kelp's home and local infrastructure become the emotional proof that cleanup is not
busywork. Completing the coast grants `tide-signal`.

### Middle B: Granite Ridge

Granite Ridge is heavy, blocked and tired. Mica's rescue introduces stronger
materials and more deliberate crafting. Riff reframes the biome from extraction to
community: tools and food culminate in a celebration goal. Completing the ridge
grants `forge-signal`.

### End: Skyforge Spires

Skyforge Spires only opens after both intermediate signals are earned. Aero tests
late traversal, while Tova asks the player to rebuild the island's beacon in stages.
The large repair requires lessons from every previous macro-biome: habitats,
materials, movement, light, comfort and community help. Completing the repair grants
`sky-signal`.

### Credits And Post-Story

Credits trigger when the final beacon is restored and the required macro-biome
signals are present. The island remains playable because restoration is now a
practice, not a crisis. Optional requests, catalog completion, decor, comfort,
habitat mastery and post-story discoveries continue after the ending.

## Story Rules For Future Slices

- Every required quest must belong to one macro-biome and one character arc.
- Every new ability must solve a visible story problem before it becomes a tool.
- Every required repair must change how the world, UI or dialogue describes the
  macro-biome.
- Optional requests may deepen characters but must not silently block credits.
- Placeholder content must follow `define-placeholder-policy`.
- Existing implemented behavior remains a contract until a future spec explicitly
  changes it with tests.
