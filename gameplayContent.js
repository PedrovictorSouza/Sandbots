import { ACT_TWO_MONSTER_POSITION } from "./actTwoSceneConfig.js";
import { ACT_TWO_SQUIRTLE_POSITION } from "./rendering/worldAssets.js";

export const WATER_GUN_POWER_ITEM_ID = "waterGunTotem";
export const PRETTY_FLOWER_BED_HABITAT_LABEL = "Pretty flower bed";

export const ITEM_DEFS = {
  [WATER_GUN_POWER_ITEM_ID]: {
    id: WATER_GUN_POWER_ITEM_ID,
    label: "Water Gun Totem",
    bagLabel: "Water Gun Totem",
    shortLabel: "Totem",
    glyph: "T",
    color: "#65c7ff",
    ink: "#081f33",
    description: "A strange relic that resonates with the water power Squirtle shared with you."
  },
  wood: {
    id: "wood",
    label: "Wood",
    bagLabel: "Sturdy stick",
    bagDetailsEligible: true,
    shortLabel: "Wood",
    glyph: "W",
    color: "#8c5a34",
    ink: "#fff1e8",
    description: "A branch that fell off a tree somewhere. Perfect for making various toys and everyday items."
  },
  flaxFiber: {
    id: "flaxFiber",
    label: "Flax Fiber",
    bagLabel: "Flax fiber",
    bagDetailsEligible: true,
    shortLabel: "Flax",
    glyph: "F",
    color: "#6f9f61",
    ink: "#0f1710",
    description: "A soft strand of plant fiber. Useful for weaving cloth and sturdy cords."
  },
  blackberry: {
    id: "blackberry",
    label: "Blackberry",
    bagLabel: "Blackberry",
    bagDetailsEligible: true,
    shortLabel: "Berry",
    glyph: "B",
    color: "#4b2c6f",
    ink: "#fff1e8",
    description: "A dark, sweet berry with a sharp scent. It looks good enough to eat on the spot."
  },
  rowanberry: {
    id: "rowanberry",
    label: "Rowanberry",
    bagLabel: "Rowanberry",
    bagDetailsEligible: true,
    shortLabel: "Rowan",
    glyph: "R",
    color: "#b04642",
    ink: "#fff1e8",
    description: "A bright berry with a tart skin. Handy for field rations and simple recipes."
  },
  elderberry: {
    id: "elderberry",
    label: "Elderberry",
    bagLabel: "Elderberry",
    bagDetailsEligible: true,
    shortLabel: "Elder",
    glyph: "E",
    color: "#5b3f88",
    ink: "#fff1e8",
    description: "A cluster of deep berries that stains your hands. Tangrowth says Pokemon used to love these."
  },
  granite: {
    id: "granite",
    label: "Granite",
    bagLabel: "Stone",
    bagDetailsEligible: true,
    shortLabel: "Granite",
    glyph: "G",
    color: "#7f848d",
    ink: "#16181d",
    description: "Just a normal stone you can find anywhere. It can be used as a material for a lot of different things."
  },
  woolYarn: {
    id: "woolYarn",
    label: "Wool Yarn",
    bagLabel: "Wool yarn",
    bagDetailsEligible: true,
    shortLabel: "Wool",
    glyph: "Y",
    color: "#d8d3ca",
    ink: "#25231f",
    description: "A warm roll of yarn spun from wool. Good for soft repairs and village crafts."
  },
  silkYarn: {
    id: "silkYarn",
    label: "Silk Yarn",
    bagLabel: "Silk yarn",
    bagDetailsEligible: true,
    shortLabel: "Silk",
    glyph: "S",
    color: "#8fd0d6",
    ink: "#102326",
    description: "A glossy thread bundle with a light shimmer. Rare, delicate, and surprisingly strong."
  },
  bridgeKit: {
    id: "bridgeKit",
    label: "Bridge Repair Kit",
    bagLabel: "Bridge kit",
    shortLabel: "Bridge",
    glyph: "K",
    color: "#c89c66",
    ink: "#20140c",
    description: "A compact repair kit packed for mending old crossings and broken supports."
  },
  marshPie: {
    id: "marshPie",
    label: "Marsh Pie",
    bagLabel: "Marsh pie",
    shortLabel: "Pie",
    glyph: "P",
    color: "#d58a52",
    ink: "#281108",
    description: "A hand-baked pie with a rich marsh aroma. Comfort food with enough heft for a long hike."
  },
  granitePickaxe: {
    id: "granitePickaxe",
    label: "Granite Pickaxe",
    bagLabel: "Granite pickaxe",
    shortLabel: "Pickaxe",
    glyph: "T",
    color: "#7398b7",
    ink: "#101a22",
    description: "A sturdy pickaxe fitted for breaking hard stone and old barriers."
  },
  burrowRepairKit: {
    id: "burrowRepairKit",
    label: "Burrow Repair Kit",
    bagLabel: "Repair kit",
    shortLabel: "Repair",
    glyph: "H",
    color: "#9b7c55",
    ink: "#18120c",
    description: "A field kit with everything needed to patch the old burrow back together."
  },
};

export const INVENTORY_ORDER = [
  WATER_GUN_POWER_ITEM_ID,
  "wood",
  "flaxFiber",
  "blackberry",
  "rowanberry",
  "elderberry",
  "granite",
  "woolYarn",
  "silkYarn",
  "bridgeKit",
  "marshPie",
  "granitePickaxe",
  "burrowRepairKit",
];

export const WORLD_LIMIT = 72;

export const GROUND_GRASS_LAYOUT = [
  { id: "grass-0", position: [6.5, 0, -4.8] },
  { id: "grass-1", position: [9.4, 0, -6.2] },
  { id: "grass-2", position: [11.4, 0, -2.9] },
  { id: "grass-3", position: [13.2, 0, -7.8] },
  { id: "grass-4", position: [15.8, 0, -4.2] },
  { id: "grass-5", position: [18.1, 0, -8.6] },
  { id: "grass-6", position: [4.6, 0, 1.9] },
  { id: "grass-7", position: [21.3, 0, -1.8] }
];

export const GROUND_FLOWER_LAYOUT = [
  { id: "flower-0", position: [7.8, 0, -7.9] },
  { id: "flower-1", position: [10.8, 0, -9.0] },
  { id: "flower-2", position: [14.6, 0, -5.8] },
  { id: "flower-3", position: [17.6, 0, -7.0] }
];

export const WORLD_REGIONS = [
  {
    id: "hearth-hollow",
    label: "Hearth Hollow",
    minX: -18,
    maxX: 18,
    minZ: -18,
    maxZ: 18,
  },
  {
    id: "north-wool-ridge",
    label: "North Wool Ridge",
    minX: -36,
    maxX: 24,
    minZ: -72,
    maxZ: -18,
  },
  {
    id: "east-palm-coast",
    label: "East Palm Coast",
    minX: 18,
    maxX: 72,
    minZ: -28,
    maxZ: 32,
  },
  {
    id: "south-marsh",
    label: "South Marsh",
    minX: -20,
    maxX: 28,
    minZ: 18,
    maxZ: 72,
  },
  {
    id: "granite-ford",
    label: "Granite Ford",
    minX: -48,
    maxX: -12,
    minZ: 8,
    maxZ: 40,
  },
  {
    id: "willow-reach",
    label: "Willow Reach",
    minX: -72,
    maxX: -36,
    minZ: 0,
    maxZ: 44,
  },
  {
    id: "old-burrow-ruins",
    label: "Old Burrow Ruins",
    minX: -72,
    maxX: -40,
    minZ: 30,
    maxZ: 72,
  },
];

export const TANGROWTH_OPENING_LINE = "CHOPPER";

export const PALM_INSTANCE_LAYOUT = [
  { offset: [-30, 0, -34], scale: 0.82, yaw: 0.18 },
  { offset: [-22, 0, -28], scale: 0.88, yaw: -0.2 },
  { offset: [-10, 0, -20], scale: 0.84, yaw: 0.27 },
  { offset: [10, 0, -18], scale: 0.87, yaw: -0.12 },
  { offset: [22, 0, -16], scale: 0.9, yaw: 0.22 },
  { offset: [36, 0, -22], scale: 0.86, yaw: -0.35 },
  { offset: [48, 0, -10], scale: 0.84, yaw: 0.28 },
  { offset: [54, 0, 4], scale: 0.88, yaw: -0.18 },
  { offset: [50, 0, 20], scale: 0.92, yaw: 0.3 },
  { offset: [34, 0, 26], scale: 0.86, yaw: -0.24 },
  { offset: [18, 0, 14], scale: 0.83, yaw: 0.16 },
  { offset: [12, 0, 4], scale: 0.81, yaw: -0.28 },
  { offset: [-12, 0, 8], scale: 0.84, yaw: 0.11 },
  { offset: [-22, 0, 18], scale: 0.9, yaw: -0.15 },
  { offset: [-34, 0, 10], scale: 0.88, yaw: 0.2 },
  { offset: [-44, 0, 18], scale: 0.86, yaw: -0.32 },
  { offset: [-52, 0, 10], scale: 0.88, yaw: 0.24 },
  { offset: [-58, 0, 28], scale: 0.83, yaw: -0.14 },
  { offset: [-42, 0, 36], scale: 0.86, yaw: 0.34 },
  { offset: [-20, 0, 42], scale: 0.89, yaw: -0.12 },
  { offset: [-2, 0, 52], scale: 0.84, yaw: 0.18 },
  { offset: [16, 0, 46], scale: 0.91, yaw: -0.27 },
  { offset: [6, 0, 30], scale: 0.85, yaw: 0.21 },
  { offset: [-6, 0, 24], scale: 0.82, yaw: -0.18 },
];

export const OUTPOST_INSTANCE_LAYOUT = [
  { id: "north-shed", offset: [-18, 0, -30], scale: 0.72, yaw: 0.08 },
  { id: "marsh-outpost", offset: [16, 0, 32], scale: 0.78, yaw: -0.14 },
  { id: "west-ruin", offset: [-46, 0, 24], scale: 0.74, yaw: 0.12 },
];

export const NPC_PROFILES = {
  tangrowth: {
    id: "tangrowth",
    label: "Tangrowth",
    role: "Onboarding Guide",
    summary:
      "Tangrowth is the first living sign that the island still has momentum. He catches the player at the end of the cinematic and redirects the run toward Aunty and the repair loop.",
    idleLine:
      "Tangrowth: hohohoh! Stay sharp. Aunty keeps the burrow steady while the rest of us scout.",
  },
  aunty: {
    id: "aunty",
    label: "Aunty",
    role: "Caretaker",
    summary:
      "Aunty kept the hearth alive while the island routes collapsed. She gives the run its emotional center and teaches the repair cadence.",
    idleLine:
      "Aunty: home first. Every safe loop starts and ends with a warm fire.",
  },
  bufo: {
    id: "bufo",
    label: "Bufo",
    role: "Marsh Broker",
    summary:
      "Bufo owns the safest marsh corridor. He turns survival into planning by forcing the player to cook before earning better tools.",
    idleLine:
      "Bufo: if you can feed yourself on the road, then maybe you deserve better steel.",
  },
  willow: {
    id: "willow",
    label: "Willow",
    role: "Stonewright",
    summary:
      "Willow watches the west ruins and only trusts travelers who can break stone and carry a repair plan to the end.",
    idleLine:
      "Willow: late routes punish panic. Bring the right tool, then move with purpose.",
  },
};

export const WORLD_MARKER_STYLES = {
  tangrowth: { glyph: "T", color: "#b26bff", ink: "#24123b" },
  squirtle: { glyph: "P", color: "#75c6ee", ink: "#10253a" },
  aunty: { glyph: "A", color: "#d7869b", ink: "#211015" },
  bufo: { glyph: "B", color: "#81b96b", ink: "#11200f" },
  willow: { glyph: "W", color: "#8b84d4", ink: "#131225" },
  workbench: { glyph: "W", color: "#b08157", ink: "#1f140c" },
  stove: { glyph: "S", color: "#db8a59", ink: "#2a1308" },
  bridge: { glyph: "B", color: "#c6a46b", ink: "#23160d" },
  gate: { glyph: "G", color: "#7b8799", ink: "#151a20" },
  burrow: { glyph: "H", color: "#9b7551", ink: "#1a120b" },
  woolNest: { glyph: "Y", color: "#d8d3ca", ink: "#25231f" },
  silkNest: { glyph: "S", color: "#8fd0d6", ink: "#102326" },
  looseGranite: { glyph: "G", color: "#8b9098", ink: "#171a1d" },
};

export const PLACEHOLDER_RECIPES = {
  bridgeKit: {
    id: "bridgeKit",
    title: "Bridge Repair Kit",
    stationId: "workbench",
    ingredients: {
      wood: 4,
      flaxFiber: 2,
    },
    output: {
      bridgeKit: 1,
    },
    note: "Placeholder craft for the bridge repair step.",
  },
  marshPie: {
    id: "marshPie",
    title: "Marsh Pie",
    stationId: "stove",
    ingredients: {
      blackberry: 4,
      rowanberry: 4,
      elderberry: 2,
    },
    output: {
      marshPie: 1,
    },
    note: "Placeholder cooking step standing in for Bufo's pie route.",
  },
  granitePickaxe: {
    id: "granitePickaxe",
    title: "Granite Pickaxe",
    stationId: "workbench",
    ingredients: {
      wood: 3,
      granite: 3,
      woolYarn: 1,
    },
    output: {
      granitePickaxe: 1,
    },
    note: "Placeholder tool craft that opens the granite gate route.",
  },
  burrowRepairKit: {
    id: "burrowRepairKit",
    title: "Burrow Repair Kit",
    stationId: "workbench",
    ingredients: {
      wood: 6,
      granite: 4,
      silkYarn: 1,
    },
    output: {
      burrowRepairKit: 1,
    },
    note: "Placeholder restoration bundle for the finale.",
  },
};

export const STORY_QUESTS = [
  {
    id: "meetTangrowth",
    eyebrow: "Opening",
    act: "Act I • First Voice in the Ash",
    difficulty: 1,
    title: "Talk to Tangrowth",
    body: "Reach Tangrowth near the ruins and figure out what he just spotted in the ash.",
    storyBeat:
      "The run does not start with tools or crafting. It starts with Tangrowth catching you in the aftermath and pulling your attention toward another survivor.",
    onboarding:
      "Walk up to Tangrowth, then press E to interact. This first beat only teaches movement, approach, and the basic talk cadence.",
    leadNpcId: "tangrowth",
    reward: "Pokemon trail",
    actionLabel: "E / Talk",
    targetId: "tangrowth",
    toolkitHint: "Opening / Route Setup",
    resolveLine:
      `Tangrowth: ${TANGROWTH_OPENING_LINE} There is another Pokemon out there. Find them before the trail goes cold.`,
  },
  {
    id: "findPokemon",
    eyebrow: "Opening",
    act: "Act I • First Voice in the Ash",
    difficulty: 1,
    title: "Find the Pokemon",
    body: "A weak cry is coming from deeper in the ruins. Track down the stranded Pokemon Tangrowth heard.",
    storyBeat:
      "The first hook is not home. It is the sound of another survivor somewhere out in the dead ground.",
    onboarding:
      "Follow the marker toward the cry, move close to the stranded Pokemon, then press E to talk.",
    leadNpcId: "tangrowth",
    reward: "First contact",
    actionLabel: "E / Talk",
    targetId: "squirtle",
    toolkitHint: "Onboarding / First Cry",
    resolveLine:
      "You found the stranded Pokemon. Try restoring the dead ground nearby and see what returns.",
  },
  {
    id: "makingHabitats",
    eyebrow: "Discovery",
    act: "Act I • Habitat Seeds",
    difficulty: 1,
    title: "Making Habitats!",
    body:
      "Arrange tall grass, trees, rocks, and furniture into the right combinations to create a pokemon habitat!",
    storyBeat:
      "Restoration is not only about repairs. Every revived patch teaches how the island becomes livable again.",
    onboarding:
      "Use Water Gun on dead ground and watch for habitat clues when plants return. New habitats will begin appearing in the world.",
    leadNpcId: "tangrowth",
    reward: PRETTY_FLOWER_BED_HABITAT_LABEL,
    actionLabel: "Space / Restore",
    toolkitHint: "Habitats / Discovery",
  },
  {
    id: "meetAunty",
    eyebrow: "Active",
    act: "Act I • Embers at Home",
    difficulty: 1,
    title: "Find Aunty",
    body: "Talk to Aunty beside the burrow to turn Tangrowth's warning into an actual restoration route.",
    storyBeat:
      "You return to a burrow held together by habit and ash. Aunty is the only reason the hearth still glows.",
    onboarding:
      "Follow Tangrowth's pointer back to the burrow, then press E to talk to Aunty and anchor the route at home.",
    leadNpcId: "aunty",
    reward: "Bridge plan",
    actionLabel: "E / Talk",
    targetId: "aunty",
    toolkitHint: "Articles / Walkthrough",
    resolveLine:
      "Aunty: good, you're steady on your feet. Now gather the basics and prove this place can still be repaired.",
  },
  {
    id: "craftBridgeKit",
    eyebrow: "Restoration",
    act: "Act I • Embers at Home",
    difficulty: 1,
    title: "Repair the Bridge",
    body: "Gather Wood x4 and Flax Fiber x2, then craft a Bridge Repair Kit at the Workbench.",
    storyBeat:
      "The first repair is small on purpose. Aunty teaches that survival begins with tight loops and simple materials.",
    onboarding:
      "Press Space near palms and flax patches to harvest. Watch the mission panel counts, then use E at the Workbench to craft.",
    leadNpcId: "aunty",
    reward: "Bridge Kit",
    actionLabel: "Space + E",
    requirements: {
      wood: 4,
      flaxFiber: 2,
    },
    recipeId: "bridgeKit",
    stationId: "workbench",
    toolkitHint: "Crafting / Campfire Kit",
  },
  {
    id: "repairBridge",
    eyebrow: "Restoration",
    act: "Act I • Embers at Home",
    difficulty: 1,
    title: "Fix the Bridge",
    body: "Carry the Bridge Repair Kit to the south bridge marker and install it.",
    storyBeat:
      "This step teaches delivery and world change: one crafted item reopens an entire route.",
    onboarding:
      "Quest deliveries are contextual. Carry the crafted kit automatically, walk to the highlighted site, and press E.",
    leadNpcId: "aunty",
    reward: "Bufo unlocked",
    actionLabel: "E / Install",
    delivery: {
      bridgeKit: 1,
    },
    targetId: "bridge",
    toolkitHint: "Map / South Route",
  },
  {
    id: "meetBufo",
    eyebrow: "Marsh Route",
    act: "Act II • Marsh Bargain",
    difficulty: 2,
    title: "Meet Bufo",
    body: "Cross the repaired route and speak to Bufo in the marsh pocket.",
    storyBeat:
      "The south corridor is the game's first real excursion. Bufo tests whether you can leave home without losing the rhythm.",
    onboarding:
      "Use the south bridge marker as your first longer route. The map and world markers now matter more than the house line of sight.",
    leadNpcId: "bufo",
    reward: "Pie request",
    actionLabel: "E / Talk",
    targetId: "bufo",
    toolkitHint: "Articles / Granite Guide",
    resolveLine:
      "Bufo: no one crosses my marsh hungry. Bake something deliberate and I'll show you where the stone starts.",
  },
  {
    id: "cookMarshPie",
    eyebrow: "Cooking",
    act: "Act II • Marsh Bargain",
    difficulty: 2,
    title: "Bake Bufo's Pie",
    body: "Gather Blackberry x4, Rowanberry x4, and Elderberry x2. Cook them into a Marsh Pie at the Stove.",
    storyBeat:
      "The marsh raises the demand: now you need multi-node gathering and a cooked item, not just raw stockpiles.",
    onboarding:
      "Collect berry routes with Space, then return home and use E at the Stove. This step teaches route planning and cooking cadence.",
    leadNpcId: "bufo",
    reward: "Marsh Pie",
    actionLabel: "Space + E",
    requirements: {
      blackberry: 4,
      rowanberry: 4,
      elderberry: 2,
    },
    recipeId: "marshPie",
    stationId: "stove",
    toolkitHint: "Cooking / Pie Routes",
  },
  {
    id: "feedBufo",
    eyebrow: "Quest Turn-In",
    act: "Act II • Marsh Bargain",
    difficulty: 2,
    title: "Deliver the Pie",
    body: "Bring the Marsh Pie back to Bufo to unlock the Granite Pickaxe blueprint.",
    storyBeat:
      "Bufo is not comic relief; he is the checkpoint between comfort and competence. Feed him and he opens the mid-game.",
    onboarding:
      "Talk to the same NPC again to turn in cooked quest items. Delivery happens automatically if the item is in your inventory.",
    leadNpcId: "bufo",
    reward: "Pickaxe blueprint",
    actionLabel: "E / Deliver",
    delivery: {
      marshPie: 1,
    },
    targetId: "bufo",
    toolkitHint: "Articles / Pickaxe Guide",
  },
  {
    id: "craftPickaxe",
    eyebrow: "Tool Upgrade",
    act: "Act III • Stone and Wool",
    difficulty: 3,
    title: "Craft the Granite Pickaxe",
    body: "Gather Wood x3, Loose Granite x3, and Wool Yarn x1. Craft the Granite Pickaxe at the Workbench.",
    storyBeat:
      "Mid-game starts here: longer routes, mixed materials, and a tool that changes where you are allowed to go.",
    onboarding:
      "The Workbench now combines items from different loops. Gather deliberately instead of clearing every node you see.",
    leadNpcId: "bufo",
    reward: "Granite Pickaxe",
    actionLabel: "Space + E",
    requirements: {
      wood: 3,
      granite: 3,
      woolYarn: 1,
    },
    recipeId: "granitePickaxe",
    stationId: "workbench",
    toolkitHint: "Guides / Pickaxe Hook",
  },
  {
    id: "breakGate",
    eyebrow: "World Unlock",
    act: "Act III • Stone and Wool",
    difficulty: 3,
    title: "Break the Granite Gate",
    body: "Take the Granite Pickaxe to the west gate and smash it open to reach Willow.",
    storyBeat:
      "The granite wall is the first hard proof that tools define territory. Breaking it shifts the game from errands to expeditions.",
    onboarding:
      "Bring the new pickaxe to the west gate and press E. This is your first explicit gear check and route expansion.",
    reward: "West route open",
    actionLabel: "E / Break",
    targetId: "graniteGate",
    toolkitHint: "Map / Granite Gate",
  },
  {
    id: "meetWillow",
    eyebrow: "Late Game",
    act: "Act IV • West of Stone",
    difficulty: 4,
    title: "Find Willow",
    body: "Head through the opened gate and speak to Willow for the last restoration step.",
    storyBeat:
      "Willow is the keeper of the western ruins. She reframes the journey from mere survival into rebuilding what was lost.",
    onboarding:
      "Late routes ask for cleaner loops. Follow the markers west, interact with Willow, then regroup before overextending.",
    leadNpcId: "willow",
    reward: "Repair request",
    actionLabel: "E / Talk",
    targetId: "willow",
    toolkitHint: "Articles / Story Guide",
    resolveLine:
      "Willow: if you made it through stone, you're ready to carry the last structure back to life.",
  },
  {
    id: "craftRepairKit",
    eyebrow: "Final Prep",
    act: "Act IV • West of Stone",
    difficulty: 4,
    title: "Assemble the Burrow Kit",
    body: "Gather Wood x6, Granite x4, and Silk Yarn x1. Craft a Burrow Repair Kit at the Workbench.",
    storyBeat:
      "The final craft consolidates every lesson so far: local wood, marsh stone, and western silk into one decisive bundle.",
    onboarding:
      "Silk and western granite sit farther from home. Run targeted loops and return once the exact counts are met.",
    leadNpcId: "willow",
    reward: "Repair bundle",
    actionLabel: "Space + E",
    requirements: {
      wood: 6,
      granite: 4,
      silkYarn: 1,
    },
    recipeId: "burrowRepairKit",
    stationId: "workbench",
    toolkitHint: "Guides / Burrow Restoration",
  },
  {
    id: "repairBurrow",
    eyebrow: "Finale",
    act: "Act V • The Last Burrow",
    difficulty: 5,
    title: "Repair Aunty's Old Burrow",
    body: "Carry the Burrow Repair Kit to the west burrow site and finish the structural repair.",
    storyBeat:
      "The old burrow is the campaign's physical climax. Once it stands again, the island stops feeling temporary.",
    onboarding:
      "Final deliveries reuse familiar rules. Carry the repair kit west, press E at the site, and watch the route close cleanly.",
    leadNpcId: "willow",
    reward: "Dinner ready",
    actionLabel: "E / Repair",
    delivery: {
      burrowRepairKit: 1,
    },
    targetId: "burrowSite",
    toolkitHint: "Articles / Walkthrough Finale",
  },
  {
    id: "hostDinner",
    eyebrow: "Finale",
    act: "Act V • The Last Burrow",
    difficulty: 5,
    title: "Host the Grand Dinner",
    body: "Return to Aunty and close the route with the final dinner scene placeholder.",
    storyBeat:
      "The ending is not another fetch quest. It is the proof that every loop, tool, and repair was building toward a shared home.",
    onboarding:
      "Return to Aunty for the final interaction. After this, the island remains open as a post-story sandbox.",
    leadNpcId: "aunty",
    reward: "Story complete",
    actionLabel: "E / Host",
    targetId: "aunty",
    toolkitHint: "Articles / Complete Story Guide",
    resolveLine:
      "Aunty: walls fixed, table warm, everyone accounted for. Sit down. You brought the island back into rhythm.",
  },
  {
    id: "epilogue",
    eyebrow: "Complete",
    act: "Epilogue • Free Roam",
    difficulty: 1,
    title: "Grand Dinner Complete",
    body: "The placeholder campaign is complete. Free-roam, gather supplies, and use the handbook as a live codex.",
    storyBeat:
      "The crisis is over. What remains is maintenance, mastery, and the comfort of knowing the routes now belong to you.",
    onboarding:
      "Use the island as a sandbox now: optimize loops, browse the codex, and treat the UI as an in-world expedition board.",
    leadNpcId: "aunty",
    reward: "Free roam",
    actionLabel: "M / Browse",
    toolkitHint: "Database / Free Browse",
  },
];

export const NPC_DEFS = [
  {
    id: "tangrowth",
    label: "Tangrowth",
    position: [...ACT_TWO_MONSTER_POSITION],
    facing: "down",
    markerKey: "tangrowth",
    renderCharacter: false,
    role: NPC_PROFILES.tangrowth.role,
    summary: NPC_PROFILES.tangrowth.summary,
    activeWhen: () => true,
  },
  {
    id: "aunty",
    label: "Aunty",
    position: [6.5, 0, -4.5],
    facing: "left",
    markerKey: "aunty",
    renderCharacter: false,
    role: NPC_PROFILES.aunty.role,
    summary: NPC_PROFILES.aunty.summary,
    activeWhen: () => true,
  },
  {
    id: "bufo",
    label: "Bufo",
    position: [10.5, 0, 47.5],
    facing: "down",
    markerKey: "bufo",
    role: NPC_PROFILES.bufo.role,
    summary: NPC_PROFILES.bufo.summary,
    activeWhen: (state) => state.flags.bridgeRepaired,
  },
  {
    id: "willow",
    label: "Willow",
    position: [-48.5, 0, 21.5],
    facing: "right",
    markerKey: "willow",
    role: NPC_PROFILES.willow.role,
    summary: NPC_PROFILES.willow.summary,
    activeWhen: (state) => state.flags.graniteGateOpened,
  },
];

export const INTERACTABLE_DEFS = [
  {
    id: "workbench",
    label: "Workbench",
    type: "station",
    position: [9.2, 0.02, 4.8],
    markerKey: "workbench",
    interactDistance: 1.8,
    activeWhen: () => true,
  },
  {
    id: "stove",
    label: "Stove",
    type: "station",
    position: [-6.4, 0.02, 4.4],
    markerKey: "stove",
    interactDistance: 1.8,
    activeWhen: () => true,
  },
  {
    id: "squirtle",
    label: "Stranded Pokemon",
    type: "site",
    position: [...ACT_TWO_SQUIRTLE_POSITION],
    markerKey: "squirtle",
    interactDistance: 1.85,
    activeWhen: (state) => state.questIndex === 1,
  },
  {
    id: "bridge",
    label: "South Bridge",
    type: "site",
    position: [4.5, 0.02, 27.5],
    markerKey: "bridge",
    interactDistance: 1.8,
    activeWhen: (state) => !state.flags.bridgeRepaired,
  },
  {
    id: "graniteGate",
    label: "Granite Gate",
    type: "gate",
    position: [-27.5, 0.02, 14.5],
    markerKey: "gate",
    interactDistance: 1.8,
    activeWhen: (state) => state.flags.bridgeRepaired && !state.flags.graniteGateOpened,
  },
  {
    id: "burrowSite",
    label: "Old Burrow",
    type: "site",
    position: [-58.5, 0.02, 38.5],
    markerKey: "burrow",
    interactDistance: 1.8,
    activeWhen: (state) => state.flags.graniteGateOpened,
  },
];

export const RESOURCE_NODE_DEFS = [
  {
    id: "flax-1",
    label: "Flax Patch",
    itemId: "flaxFiber",
    markerKey: "flaxFiber",
    position: [14.8, 0.02, -8.0],
    yield: 1,
    respawnDuration: 8,
    interactDistance: 1.5,
    activeWhen: () => true,
  },
  {
    id: "flax-2",
    label: "Flax Patch",
    itemId: "flaxFiber",
    markerKey: "flaxFiber",
    position: [10.4, 0.02, -11.2],
    yield: 1,
    respawnDuration: 8,
    interactDistance: 1.5,
    activeWhen: () => true,
  },
  {
    id: "flax-3",
    label: "Flax Patch",
    itemId: "flaxFiber",
    markerKey: "flaxFiber",
    position: [4.8, 0.02, -10.5],
    yield: 1,
    respawnDuration: 8,
    interactDistance: 1.5,
    activeWhen: () => true,
  },
  {
    id: "flax-4",
    label: "Flax Patch",
    itemId: "flaxFiber",
    markerKey: "flaxFiber",
    position: [-2.2, 0.02, -7.6],
    yield: 1,
    respawnDuration: 8,
    interactDistance: 1.5,
    activeWhen: () => true,
  },
  {
    id: "berry-black-1",
    label: "Blackberry Bush",
    itemId: "blackberry",
    markerKey: "blackberry",
    position: [8.2, 0.02, 35.8],
    yield: 1,
    respawnDuration: 9,
    interactDistance: 1.5,
    activeWhen: (state) => state.flags.bridgeRepaired,
  },
  {
    id: "berry-black-2",
    label: "Blackberry Bush",
    itemId: "blackberry",
    markerKey: "blackberry",
    position: [15.8, 0.02, 38.4],
    yield: 1,
    respawnDuration: 9,
    interactDistance: 1.5,
    activeWhen: (state) => state.flags.bridgeRepaired,
  },
  {
    id: "berry-black-3",
    label: "Blackberry Bush",
    itemId: "blackberry",
    markerKey: "blackberry",
    position: [20.5, 0.02, 43.2],
    yield: 1,
    respawnDuration: 9,
    interactDistance: 1.5,
    activeWhen: (state) => state.flags.bridgeRepaired,
  },
  {
    id: "berry-rowan-1",
    label: "Rowanberry Shrub",
    itemId: "rowanberry",
    markerKey: "rowanberry",
    position: [4.2, 0.02, 41.5],
    yield: 1,
    respawnDuration: 9,
    interactDistance: 1.5,
    activeWhen: (state) => state.flags.bridgeRepaired,
  },
  {
    id: "berry-rowan-2",
    label: "Rowanberry Shrub",
    itemId: "rowanberry",
    markerKey: "rowanberry",
    position: [12.4, 0.02, 46.1],
    yield: 1,
    respawnDuration: 9,
    interactDistance: 1.5,
    activeWhen: (state) => state.flags.bridgeRepaired,
  },
  {
    id: "berry-rowan-3",
    label: "Rowanberry Shrub",
    itemId: "rowanberry",
    markerKey: "rowanberry",
    position: [18.6, 0.02, 49.4],
    yield: 1,
    respawnDuration: 9,
    interactDistance: 1.5,
    activeWhen: (state) => state.flags.bridgeRepaired,
  },
  {
    id: "berry-elder-1",
    label: "Elderberry Bush",
    itemId: "elderberry",
    markerKey: "elderberry",
    position: [-4.4, 0.02, 39.8],
    yield: 1,
    respawnDuration: 9,
    interactDistance: 1.5,
    activeWhen: (state) => state.flags.bridgeRepaired,
  },
  {
    id: "berry-elder-2",
    label: "Elderberry Bush",
    itemId: "elderberry",
    markerKey: "elderberry",
    position: [0.4, 0.02, 45.2],
    yield: 1,
    respawnDuration: 9,
    interactDistance: 1.5,
    activeWhen: (state) => state.flags.bridgeRepaired,
  },
  {
    id: "wool-nest",
    label: "Wool Nest",
    itemId: "woolYarn",
    markerKey: "woolNest",
    position: [-24.5, 0.02, -28.4],
    yield: 1,
    respawnDuration: 12,
    interactDistance: 1.5,
    activeWhen: () => true,
  },
  {
    id: "wool-nest-2",
    label: "Wool Nest",
    itemId: "woolYarn",
    markerKey: "woolNest",
    position: [-14.2, 0.02, -34.6],
    yield: 1,
    respawnDuration: 12,
    interactDistance: 1.5,
    activeWhen: () => true,
  },
  {
    id: "granite-loose-1",
    label: "Loose Granite",
    itemId: "granite",
    markerKey: "looseGranite",
    position: [2.8, 0.02, 33.6],
    yield: 1,
    respawnDuration: 12,
    interactDistance: 1.5,
    activeWhen: (state) => state.flags.bridgeRepaired,
  },
  {
    id: "granite-loose-2",
    label: "Loose Granite",
    itemId: "granite",
    markerKey: "looseGranite",
    position: [10.2, 0.02, 42.8],
    yield: 1,
    respawnDuration: 12,
    interactDistance: 1.5,
    activeWhen: (state) => state.flags.bridgeRepaired,
  },
  {
    id: "granite-loose-3",
    label: "Loose Granite",
    itemId: "granite",
    markerKey: "looseGranite",
    position: [-2.6, 0.02, 45.4],
    yield: 1,
    respawnDuration: 12,
    interactDistance: 1.5,
    activeWhen: (state) => state.flags.bridgeRepaired,
  },
  {
    id: "granite-west-1",
    label: "Granite Cluster",
    itemId: "granite",
    markerKey: "granite",
    position: [-42.5, 0.02, 17.8],
    yield: 2,
    respawnDuration: 14,
    interactDistance: 1.5,
    activeWhen: (state) => state.flags.graniteGateOpened && state.flags.pickaxeCrafted,
  },
  {
    id: "granite-west-2",
    label: "Granite Cluster",
    itemId: "granite",
    markerKey: "granite",
    position: [-48.2, 0.02, 27.4],
    yield: 2,
    respawnDuration: 14,
    interactDistance: 1.5,
    activeWhen: (state) => state.flags.graniteGateOpened && state.flags.pickaxeCrafted,
  },
  {
    id: "granite-west-3",
    label: "Granite Cluster",
    itemId: "granite",
    markerKey: "granite",
    position: [-54.8, 0.02, 21.6],
    yield: 2,
    respawnDuration: 14,
    interactDistance: 1.5,
    activeWhen: (state) => state.flags.graniteGateOpened && state.flags.pickaxeCrafted,
  },
  {
    id: "silk-nest",
    label: "Silk Nest",
    itemId: "silkYarn",
    markerKey: "silkNest",
    position: [-56.4, 0.02, 10.2],
    yield: 1,
    respawnDuration: 14,
    interactDistance: 1.5,
    activeWhen: (state) => state.flags.graniteGateOpened,
  },
  {
    id: "silk-nest-2",
    label: "Silk Nest",
    itemId: "silkYarn",
    markerKey: "silkNest",
    position: [-60.8, 0.02, 18.4],
    yield: 1,
    respawnDuration: 14,
    interactDistance: 1.5,
    activeWhen: (state) => state.flags.graniteGateOpened,
  },
];

export const DYNAMIC_BARRIERS = [
  {
    id: "granite-wall-1",
    position: [-22.4, 0, 5.4],
    radius: 2.2,
    activeWhen: (state) => !state.flags.graniteGateOpened,
  },
  {
    id: "granite-wall-2",
    position: [-24.8, 0, 9.2],
    radius: 2.2,
    activeWhen: (state) => !state.flags.graniteGateOpened,
  },
  {
    id: "granite-wall-3",
    position: [-27.1, 0, 13.1],
    radius: 2.2,
    activeWhen: (state) => !state.flags.graniteGateOpened,
  },
  {
    id: "granite-wall-4",
    position: [-29.5, 0, 17.0],
    radius: 2.2,
    activeWhen: (state) => !state.flags.graniteGateOpened,
  },
  {
    id: "granite-wall-5",
    position: [-31.8, 0, 20.6],
    radius: 2.2,
    activeWhen: (state) => !state.flags.graniteGateOpened,
  },
  {
    id: "granite-wall-6",
    position: [-34.2, 0, 24.0],
    radius: 2.2,
    activeWhen: (state) => !state.flags.graniteGateOpened,
  },
];

export function getQuestById(questId) {
  return STORY_QUESTS.find((quest) => quest.id === questId) || STORY_QUESTS[0];
}

export function getRecipeById(recipeId) {
  return PLACEHOLDER_RECIPES[recipeId] || null;
}

export function createInitialInventory() {
  return Object.fromEntries(INVENTORY_ORDER.map((itemId) => [itemId, 0]));
}

export function getItemLabel(itemId) {
  return ITEM_DEFS[itemId]?.label || itemId;
}
