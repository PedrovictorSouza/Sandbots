# Current Game Inventory

This inventory was built from targeted catalog imports and `rg` searches. It is
not a full project read and does not change gameplay, runtime, tests or assets.

## Story Files And Owners

| Area | File(s) | Owner |
| --- | --- | --- |
| Story state defaults and placeholder campaign helpers | `story/progression.js`, `gameplayContent.js` | State Factory / Quest State Machine |
| Tutorial quest state machine | `app/quest/questData.js`, `app/quest/createQuestSystem.js` | Quest State Machine |
| Story beats and dialogue-driven flags | `app/story/storyBeatData.js`, `app/story/createStoryBeatSystem.js`, `app/dialogue/dialogueData.js` | Quest State Machine / Dialogue System |
| Final readiness | `app/story/finalReadinessData.js`, `app/story/biomeProgressionData.js` | Quest State Machine / Scenario System |
| Request, recipe and placeholder taxonomy | `app/story/*TaxonomyData.js`, `app/story/placeholderPolicyData.js` | Flyweight Data Catalog |
| Request log and HUD presentation | `app/ui/createQuestLog.js`, `app/ui/gameHudController.js` | UI Presenter |

## Quest Catalogs

There are two current quest tracks:

- `SMALL_ISLAND_QUESTS` is the focused tutorial/Act 1 quest state-machine track.
- `STORY_QUESTS` in `gameplayContent.js` is the placeholder campaign route used by
  the mission-card style content.

### SMALL_ISLAND_QUESTS

| Id | Label | Status | Completion | Reward/unlock | Taxonomy |
| --- | --- | --- | --- | --- | --- |
| `learn-to-move` | Take Your First Steps | active | MOVE `player` x1 | `basic-movement` | tutorial / initiation-challenge |
| `wake-guide` | Talk to Chopper | locked | TALK `tangrowth` x1 | `ash-trail` | tutorial / escort-follow |
| `gather-first-supplies` | Gather First Supplies | locked | COLLECT `wood` x3 | `basic-crafting-note` | tutorial / collection |
| `shape-a-living-patch` | Shape a Living Patch | locked | BUILD `revived-habitat` x1 | `habitat-notes` | tutorial / environmental-restoration |
| `record-a-memory` | Record a Memory | locked | PHOTO `first-memory` x1 | `memory-log` | optional / collection |
| `open-the-water-route` | Open the Water Route | locked | UNLOCK `waterGun` x1 | `water-restoration` | tutorial / ability-unlock |
| `water-dry-grass` | Water dry grass! | locked | BUILD `revived-grass` x10 | `dry-grass-request-complete` | general / environmental-restoration |
| `inspect-rustling-grass` | Talk to Bulbasaur | locked | TALK `leaf-helper` x1 | `leafage` | general / ability-unlock |
| `grow-a-home-patch` | Plant Leafage for Bulbasaur | locked | PLACE `leafy-home-patch` x1 | `first-helper-home` | general / habitat-home |
| `chopper-first-habitat-report` | Tell Chopper | locked | TALK `chopper-first-habitat-report` x1 | `first-habitat-path` | general / escort-follow |

### STORY_QUESTS

| Id | Label | Act | Completion | Reward |
| --- | --- | --- | --- | --- |
| `meetTangrowth` | Talk to Tangrowth | Act I | target `tangrowth` | Pokemon trail |
| `findPokemon` | Find the Pokemon | Act I | target `squirtle` | First contact |
| `makingHabitats` | Making Habitats! | Act I | habitat progress | Pretty flower bed |
| `meetAunty` | Find Aunty | Act I | target `aunty` | Bridge plan |
| `craftBridgeKit` | Repair the Bridge | Act I | Wood x4, Flax Fiber x2, recipe `bridgeKit` | Bridge Kit |
| `repairBridge` | Fix the Bridge | Act I | deliver `bridgeKit` x1 to `bridge` | Bufo unlocked |
| `meetBufo` | Meet Bufo | Act II | target `bufo` | Pie request |
| `cookMarshPie` | Bake Bufo's Pie | Act II | Blackberry x4, Rowanberry x4, Elderberry x2, recipe `marshPie` | Marsh Pie |
| `feedBufo` | Deliver the Pie | Act II | deliver `marshPie` x1 to `bufo` | Pickaxe blueprint |
| `craftPickaxe` | Craft the Granite Pickaxe | Act III | Wood x3, Granite x3, Wool Yarn x1, recipe `granitePickaxe` | Granite Pickaxe |
| `breakGate` | Break the Granite Gate | Act III | target `graniteGate` | West route open |
| `meetWillow` | Find Willow | Act IV | target `willow` | Repair request |
| `craftRepairKit` | Assemble the Burrow Kit | Act IV | Wood x6, Granite x4, Silk Yarn x1, recipe `burrowRepairKit` | Repair bundle |
| `repairBurrow` | Repair Aunty's Old Burrow | Act V | deliver `burrowRepairKit` x1 to `burrowSite` | Dinner ready |
| `hostDinner` | Host the Grand Dinner | Act V | target `aunty` | Story complete |
| `epilogue` | Grand Dinner Complete | Epilogue | free roam state | Free roam |

## Story Flags

`createStoryState()` initializes `questIndex: 0` and a large `flags` object. The
main groups are:

- Route/story flags: `bridgeRepaired`, `bufoFed`, `pickaxeCrafted`,
  `graniteGateOpened`, `burrowFixed`, `dinnerHosted`.
- Restoration/habitat counters: `firstGrassRestored`, `restoredGrassCount`,
  `restoredFlowerCount`, `leafageTallGrassCount`, `boulderShadedTallGrassCount`,
  `wateredTreeCount`, `sturdySticksGatheredForChallenge`.
- Companion/request flags: Squirtle Leppa request, Bulbasaur straw bed request,
  Charmander campfire and celebration request, Timburr/boulder challenge rewards.
- Hub/PC flags: `ruinedPokemonCenterInspected`, `challengesUnlocked`,
  `newPcChallengesAvailable`, `newPcChallengesChecked`.
- Leaf Den flags: `leafDenKitPurchased`, `leafDenKitPlaced`,
  `leafDenConstructionStarted`, `leafDenBuilt`, `leafDenFurnitureRequestComplete`.
- Onboarding/global flags: `bagOnboardingSeen`, `chopperSecondTalkApproachSeen`.

Most flags are Act 1 or early hub specific. Global/final signals now live in
dedicated catalog data as macro-biome completion tokens and `creditsComplete`.

## Dialogue, Quest Log And Persistence

- Mentor/reminder dialogue is split between `storyBeatData`, `dialogueData`,
  `finalReadinessData` feedback text and runtime handlers in
  `createApplicationRuntime`.
- Quest progress UI is owned by `createQuestLog` and `gameHudController`.
- Duplicate reward protections are covered by `questSystem.test.js`,
  `progression.test.js`, story beat tests and focused slice tests.
- Quest persistence exists in `createQuestSystem` when storage is provided; runtime
  uses localStorage only when quest persistence is enabled.

## Biomes, Zones And Gates

Macro-biome entry is data-owned:

- Ash Wilds: entry allowed by default, grants `root-signal`.
- Tidefall Coast: requires `root-signal`, grants `tide-signal`.
- Granite Ridge: requires `root-signal`, grants `forge-signal`.
- Skyforge Spires: requires both `tide-signal` and `forge-signal`, grants
  `sky-signal`.

Current internal region labels are spatial, not final biome gates:

- Hearth/root: `hearth-hollow`.
- Tidefall candidates: `east-palm-coast`, `south-marsh`, `outer-south-marsh`.
- Granite candidates: `north-wool-ridge`, `granite-ford`, `outer-north-ridge`.
- Sky/final candidate: `outer-east-steppe`.
- West/finale placeholders: `willow-reach`, `old-burrow-ruins`,
  `outer-west-plateau`.

Current route gates are `bridgeRepaired`, `graniteGateOpened` and
`pickaxeCrafted` checks around bridge, marsh, granite and west-route content. No
trainer-rank runtime exists yet; final rank is represented by
`skyforge-beacon-restorer` in Skyforge repair data. Environment-level support is
taxonomy/design-level only and does not block credits.

## Characters, Models And Assets

Runtime NPC definitions currently expose four placeholder campaign NPCs:
`tangrowth`, `aunty`, `bufo` and `willow`.

Required final story arcs are cataloged separately: Shaper, Chopper, Aunty, Sprig,
Nami, Kelp, Mica, Riff, Aero and Tova. Several of those arcs do not yet have
runtime NPC definitions or final model assets.

Known local assets from targeted search:

- `app/characters/player/player.gltf`
- `app/characters/player/player.png`
- `app/characters/Robot-2/robot-2.gltf`
- `app/characters/Robot-2/robot-2.png`
- `app/characters/bill/bill.png`
- UI and environment images under `app/ui/images/` and `public/assets/sky.png`

No centralized model yaw-offset catalog was found. Future 3D asset integration
must define explicit per-model facing offsets instead of changing global camera,
input or renderer behavior.

Current NPCs can be used as interaction targets. Follow, facing, dialogue and
reward behavior is mostly wired through runtime handlers, story beat data and the
quest system rather than through a single NPC capability table.

## Habitats And World Objects

Current habitat catalog:

- Active: `tall-grass`, `boulder-shaded-tall-grass`, `pretty-flower-bed`.
- Planned: `tree-shaded-tall-grass`, `hydrated-tall-grass`,
  `seaside-tall-grass`, `elevated-tall-grass`, `illuminated-tall-grass`,
  `tree-shaded-flower-bed`, `hydrated-flower-bed`, `field-of-flowers`.

Habitat discovery is protected by `habitatSystem.test.js`,
`gameplayInteractions.test.js` and quest-log tests for tall grass and pretty
flower bed restoration events.

Current interactables are `workbench`, `stove`, `squirtle`, `bridge`,
`graniteGate`, `burrowSite`, `ruinedPokemonCenter` and `pokemonCenterPc`.
Repair/break/place targets include `bridge`, `graniteGate`, `burrowSite`,
`revived-grass`, `leafy-home-patch`, `leafDenKit`, `strawBed`, `campfire`,
`logChair` and `dittoFlag`.

Resource loops include leaves, flax, blackberries, rowanberries, elderberries,
wool yarn, loose/west granite and silk yarn. Dynamic barriers are six granite
walls keyed to the granite gate route.

Reusable world/habitat creation patterns live in session builders, habitat data,
world interaction handlers and focused factories/builders already mapped by the
architecture pattern docs.

## Inventory, Recipes And Rewards

Current inventory has 23 item ids: `waterGunTotem`, `wood`, `leppaBerry`,
`logChair`, `simpleWoodenDiyRecipes`, `campfire`, `lifeCoins`, `leaves`,
`strawBedRecipe`, `strawBed`, `leafDenKit`, `dittoFlag`, `flaxFiber`,
`blackberry`, `rowanberry`, `elderberry`, `granite`, `woolYarn`, `silkYarn`,
`bridgeKit`, `marshPie`, `granitePickaxe` and `burrowRepairKit`.

Current recipes:

| Recipe | Station | Ingredients | Role |
| --- | --- | --- | --- |
| `campfire` | workbench | Wood x3 | comfort-item / starter-natural |
| `strawBed` | workbench | Leaves x2 | comfort-item / starter-natural |
| `bridgeKit` | workbench | Wood x4, Flax Fiber x2 | required-story-item / starter-natural |
| `marshPie` | stove | Blackberry x4, Rowanberry x4, Elderberry x2 | required-story-item / starter-natural prototype |
| `granitePickaxe` | workbench | Wood x3, Granite x3, Wool Yarn x1 | traversal-utility / ridge-ore-cooking prototype |
| `burrowRepairKit` | workbench | Wood x6, Granite x4, Silk Yarn x1 | habitat-ingredient / sky-concrete-advanced planned |

Item turn-in and delivery mechanics are currently quest `delivery` objects plus
runtime handlers that consume inventory for bridge, pie, repair kit and early
home/habitat requests. Transactional material consumption is protected by focused
progression and gameplay interaction tests.

Rewards affect unlocks, inventory items, recipes, comfort/habitat state, route
gates, building state and final readiness tokens. Final readiness only considers
required macro-biome signals; optional, general and decorative content remains out
of credits blockers.

Tests currently protecting inventory and reward behavior include
`questSystem.test.js`, `questLog.test.js`, `progression.test.js`,
`storyBeatSystem.test.js`, `gameplayInteractions.test.js`,
`currentRecipeTaxonomyData.test.js`, `requestTaxonomyData.test.js`,
`finalReadinessData.test.js` and the act-specific OpenSpec tests added for the
promotion slices.
