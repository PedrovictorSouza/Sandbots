import { ACT_TWO_MONSTER_POSITION } from "./actTwoSceneConfig.js";
import { ACT_TWO_SQUIRTLE_POSITION } from "./rendering/worldAssets.js";
import { CRAFTED_ITEM_DEFS } from "./studies/typescript/crafted-items.ts";
import { MATERIAL_DEFS } from "./studies/typescript/materials.ts";
import { RECIPE_DEFS } from "./studies/typescript/recipes.ts";
import {
  SANDBOTS_BOT_NAMES,
  SANDBOTS_ITEM_NAMES,
  SANDBOTS_WORLD_TERMS
} from "./app/story/sandbotsLexicon.js";

export const WATER_GUN_POWER_ITEM_ID = "waterGunTotem";
export const LEPPA_BERRY_ITEM_ID = "leppaBerry";
export const LOG_CHAIR_ITEM_ID = "logChair";
export const SIMPLE_WOODEN_DIY_RECIPES_ITEM_ID = "simpleWoodenDiyRecipes";
export const CAMPFIRE_ITEM_ID = "campfire";
export const LIFE_COINS_ITEM_ID = "lifeCoins";
export const LEAVES_ITEM_ID = "leaves";
export const CARBON_ITEM_ID = "carbon";
export const NITROGEN_ITEM_ID = "nitrogen";
export const PHOSPHORUS_ITEM_ID = "phosphorus";
export const POTASSIUM_ITEM_ID = "potassium";
export const STRAW_BED_RECIPE_ITEM_ID = "strawBedRecipe";
export const STRAW_BED_ITEM_ID = "strawBed";
export const LEAF_DEN_KIT_ITEM_ID = "leafDenKit";
export const DITTO_FLAG_ITEM_ID = "dittoFlag";
export const LEAF_DEN_BUILD_REQUIREMENTS = Object.freeze({
  wood: 3,
  [LEAVES_ITEM_ID]: 3
});
export const LEAF_DEN_BUILD_DURATION_MS = 15 * 1000;
export const PRETTY_FLOWER_BED_HABITAT_LABEL = "Pretty flower bed";
export const BUILDING_KIT_ITEM_KIND = "BuildingKit";
export const CREATURE_SPECIALTY = Object.freeze({
  BUILD: "build",
  BURN: "burn"
});

export const CREATURE_DEFS = Object.freeze({
  squirtle: Object.freeze({
    id: "squirtle",
    label: SANDBOTS_BOT_NAMES.hydro,
    currentHomeId: null,
    idealHabitat: "waterside",
    specialties: Object.freeze([])
  }),
  bulbasaur: Object.freeze({
    id: "bulbasaur",
    label: SANDBOTS_BOT_NAMES.grow,
    currentHomeId: null,
    idealHabitat: "leafy",
    specialties: Object.freeze([])
  }),
  charmander: Object.freeze({
    id: "charmander",
    label: SANDBOTS_BOT_NAMES.thermal,
    currentHomeId: null,
    idealHabitat: "warm",
    specialties: Object.freeze([
      CREATURE_SPECIALTY.BURN
    ])
  }),
  timburr: Object.freeze({
    id: "timburr",
    label: SANDBOTS_BOT_NAMES.builder,
    currentHomeId: null,
    idealHabitat: "workshop",
    specialties: Object.freeze([
      CREATURE_SPECIALTY.BUILD
    ])
  })
});

const CREATURE_LIST = Object.freeze(Object.values(CREATURE_DEFS));

export function listCreatures() {
  return CREATURE_LIST;
}

export function getCreatureById(creatureId) {
  return CREATURE_DEFS[creatureId] || null;
}

export const HOME_DEFS = Object.freeze({
  leafDen: Object.freeze({
    id: "leafDen",
    label: "House",
    habitatType: "leafy"
  })
});

const HOME_LIST = Object.freeze(Object.values(HOME_DEFS));

export function listHomes() {
  return HOME_LIST;
}

export function getHomeById(homeId) {
  return HOME_DEFS[homeId] || null;
}

export const ITEM_DEFS = {
  [WATER_GUN_POWER_ITEM_ID]: {
    id: WATER_GUN_POWER_ITEM_ID,
    label: SANDBOTS_ITEM_NAMES.hydroTotem,
    bagLabel: SANDBOTS_ITEM_NAMES.hydroTotem,
    shortLabel: "Totem",
    glyph: "T",
    color: "#65c7ff",
    ink: "#081f33",
    slotRole: "key",
    description: `A compact tool core that resonates with the water systems ${SANDBOTS_BOT_NAMES.hydro} restored.`
  },
  wood: {
    ...MATERIAL_DEFS.wood,
    bagDetailsEligible: true,
    shortLabel: "Wood",
    glyph: "W",
    color: "#8c5a34",
    ink: "#fff1e8",
    slotRole: "material",
    description: "A branch that fell off a tree somewhere. Perfect for making various toys and everyday items."
  },
  [LEPPA_BERRY_ITEM_ID]: {
    id: LEPPA_BERRY_ITEM_ID,
    label: "Pulse Berry",
    bagLabel: "Pulse Berry",
    bagDetailsEligible: true,
    shortLabel: "Pulse",
    glyph: "L",
    color: "#e85e50",
    ink: "#fff7de",
    slotRole: "gift",
    description: `A vivid red berry with a warm, restorative scent. ${SANDBOTS_BOT_NAMES.grow} keeps scanning it.`
  },
  [LOG_CHAIR_ITEM_ID]: {
    id: LOG_CHAIR_ITEM_ID,
    label: "Log Chair",
    bagLabel: "Log chair",
    bagDetailsEligible: true,
    shortLabel: "Chair",
    glyph: "C",
    color: "#9a6842",
    ink: "#fff2d6",
    slotRole: "placeable",
    description: "A sturdy little chair carved from a log. Chopper says every habitat needs a place to rest."
  },
  [SIMPLE_WOODEN_DIY_RECIPES_ITEM_ID]: {
    id: SIMPLE_WOODEN_DIY_RECIPES_ITEM_ID,
    label: "Starter Wood Plans",
    bagLabel: "Wood plans",
    bagDetailsEligible: true,
    shortLabel: "Plan",
    glyph: "D",
    color: "#d2a36a",
    ink: "#2a1809",
    slotRole: "recipe",
    description: `A starter bundle of Workbench instructions. The ${SANDBOTS_ITEM_NAMES.thermalCabin} plan is circled in the corner.`
  },
  [CAMPFIRE_ITEM_ID]: {
    ...CRAFTED_ITEM_DEFS[CAMPFIRE_ITEM_ID],
    bagDetailsEligible: true,
    shortLabel: "Home",
    glyph: "H",
    color: "#f07d38",
    ink: "#2a1205",
    slotRole: "placeable",
    description: `${SANDBOTS_BOT_NAMES.thermal}'s compact shelter. It gives the work zone a warm place to gather.`
  },
  [LIFE_COINS_ITEM_ID]: {
    id: LIFE_COINS_ITEM_ID,
    label: "Legacy Viability Log",
    bagLabel: "Viability log",
    shortLabel: "Log",
    glyph: "V",
    color: "#7bc7ff",
    ink: "#0b1f32",
    slotRole: "key",
    hiddenFromInventory: true,
    description: `Legacy save data for habitat viability reports recorded by the ${SANDBOTS_WORLD_TERMS.terminal}.`
  },
  [LEAVES_ITEM_ID]: {
    ...MATERIAL_DEFS[LEAVES_ITEM_ID],
    bagDetailsEligible: true,
    shortLabel: "Leaf",
    glyph: "L",
    color: "#72b95a",
    ink: "#10220c",
    slotRole: "material",
    description: "Fresh leaves gathered near restored tall grass. Useful for simple habitat projects."
  },
  [CARBON_ITEM_ID]: {
    ...MATERIAL_DEFS[CARBON_ITEM_ID],
    bagDetailsEligible: true,
    shortLabel: "Carbon",
    glyph: "C",
    color: "#2f343d",
    ink: "#f2f7ff",
    slotRole: "material",
    description: `A dark mineral ${SANDBOTS_BOT_NAMES.thermal} burns to power the ${SANDBOTS_ITEM_NAMES.thermalTool}.`
  },
  [NITROGEN_ITEM_ID]: {
    ...MATERIAL_DEFS[NITROGEN_ITEM_ID],
    bagDetailsEligible: true,
    shortLabel: "Nitrogen",
    glyph: "N",
    color: "#87d9ff",
    ink: "#092134",
    slotRole: "material",
    description: `A soil nutrient ${SANDBOTS_WORLD_TERMS.bots} can process to help restore water flow and plant growth.`
  },
  [PHOSPHORUS_ITEM_ID]: {
    ...MATERIAL_DEFS[PHOSPHORUS_ITEM_ID],
    bagDetailsEligible: true,
    shortLabel: "Phosphorus",
    glyph: "P",
    color: "#d8a8ff",
    ink: "#251038",
    slotRole: "material",
    description: `A reactive nutrient used by bot tools that revive weakened soil.`
  },
  [POTASSIUM_ITEM_ID]: {
    ...MATERIAL_DEFS[POTASSIUM_ITEM_ID],
    bagDetailsEligible: true,
    shortLabel: "Potassium",
    glyph: "K",
    color: "#ffd76a",
    ink: "#352808",
    slotRole: "material",
    description: `A mineral nutrient that helps ${SANDBOTS_WORLD_TERMS.bots} sustain soil-restoration tools.`
  },
  [STRAW_BED_RECIPE_ITEM_ID]: {
    id: STRAW_BED_RECIPE_ITEM_ID,
    label: "Solar Station Plans",
    bagLabel: "Solar Station plans",
    bagDetailsEligible: true,
    shortLabel: "Plan",
    glyph: "R",
    color: "#f0cf77",
    ink: "#342309",
    slotRole: "recipe",
    description: `${SANDBOTS_BOT_NAMES.grow}'s notes for assembling a compact ${SANDBOTS_ITEM_NAMES.solarStation} from leaves and plant fiber.`
  },
  [STRAW_BED_ITEM_ID]: {
    ...CRAFTED_ITEM_DEFS[STRAW_BED_ITEM_ID],
    bagDetailsEligible: true,
    shortLabel: "Station",
    glyph: "S",
    color: "#d7b65a",
    ink: "#2d2108",
    slotRole: "placeable",
    description: "A compact Solar Station that helps grassy habitats feel more alive."
  },
  [LEAF_DEN_KIT_ITEM_ID]: {
    ...CRAFTED_ITEM_DEFS[LEAF_DEN_KIT_ITEM_ID],
    bagDetailsEligible: true,
    shortLabel: "House",
    glyph: "D",
    color: "#6fc46d",
    ink: "#10240d",
    slotRole: "placeable",
    itemKind: BUILDING_KIT_ITEM_KIND,
    buildingKitId: LEAF_DEN_KIT_ITEM_ID,
    description: `A leafy habitat kit prepared at the ${SANDBOTS_WORLD_TERMS.terminal}. ${SANDBOTS_BOT_NAMES.overseer} says it is the first step toward proper human homes.`
  },
  [DITTO_FLAG_ITEM_ID]: {
    id: DITTO_FLAG_ITEM_ID,
    label: SANDBOTS_ITEM_NAMES.colonyFlag,
    bagLabel: SANDBOTS_ITEM_NAMES.colonyFlag,
    bagDetailsEligible: true,
    shortLabel: "Flag",
    glyph: "F",
    color: "#d98bd8",
    ink: "#2b1230",
    slotRole: "placeable",
    description: `A celebratory flag from ${SANDBOTS_BOT_NAMES.overseer}. It marks the first home prepared for the future colony.`
  },
  flaxFiber: {
    ...MATERIAL_DEFS.flaxFiber,
    bagDetailsEligible: true,
    shortLabel: "Flax",
    glyph: "F",
    color: "#6f9f61",
    ink: "#0f1710",
    slotRole: "material",
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
    slotRole: "food",
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
    slotRole: "food",
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
    slotRole: "food",
    description: `A cluster of deep berries that stains your hands. ${SANDBOTS_BOT_NAMES.overseer} says older field bots logged them as high-value rations.`
  },
  granite: {
    ...MATERIAL_DEFS.granite,
    bagDetailsEligible: true,
    shortLabel: "Granite",
    glyph: "G",
    color: "#7f848d",
    ink: "#16181d",
    slotRole: "material",
    description: "Just a normal stone you can find anywhere. It can be used as a material for a lot of different things."
  },
  woolYarn: {
    ...MATERIAL_DEFS.woolYarn,
    bagDetailsEligible: true,
    shortLabel: "Wool",
    glyph: "Y",
    color: "#d8d3ca",
    ink: "#25231f",
    slotRole: "material",
    description: "A warm roll of yarn spun from wool. Good for soft repairs and village crafts."
  },
  silkYarn: {
    ...MATERIAL_DEFS.silkYarn,
    bagDetailsEligible: true,
    shortLabel: "Silk",
    glyph: "S",
    color: "#8fd0d6",
    ink: "#102326",
    slotRole: "material",
    description: "A glossy thread bundle with a light shimmer. Rare, delicate, and surprisingly strong."
  },
  bridgeKit: {
    ...CRAFTED_ITEM_DEFS.bridgeKit,
    shortLabel: "Bridge",
    glyph: "K",
    color: "#c89c66",
    ink: "#20140c",
    slotRole: "placeable",
    slotRoleLabel: "Repair",
    description: "A compact repair kit packed for mending old crossings and broken supports."
  },
  marshPie: {
    ...CRAFTED_ITEM_DEFS.marshPie,
    label: "Marsh Ration",
    bagLabel: "Marsh ration",
    shortLabel: "Ration",
    glyph: "P",
    color: "#d58a52",
    ink: "#281108",
    slotRole: "food",
    description: "A compact field ration made from marsh berries. Dense enough to support a long survey route."
  },
  granitePickaxe: {
    ...CRAFTED_ITEM_DEFS.granitePickaxe,
    shortLabel: "Pickaxe",
    glyph: "T",
    color: "#7398b7",
    ink: "#101a22",
    slotRole: "tool",
    description: "A sturdy pickaxe fitted for breaking hard stone and old barriers."
  },
  burrowRepairKit: {
    ...CRAFTED_ITEM_DEFS.burrowRepairKit,
    label: "Hub Repair Kit",
    bagLabel: "Hub repair kit",
    shortLabel: "Repair",
    glyph: "H",
    color: "#9b7c55",
    ink: "#18120c",
    slotRole: "placeable",
    slotRoleLabel: "Repair",
    description: "A field kit with everything needed to patch the old colony hub back together."
  },
};

export const INVENTORY_ORDER = [
  WATER_GUN_POWER_ITEM_ID,
  "wood",
  LEPPA_BERRY_ITEM_ID,
  LOG_CHAIR_ITEM_ID,
  SIMPLE_WOODEN_DIY_RECIPES_ITEM_ID,
  CAMPFIRE_ITEM_ID,
  LEAVES_ITEM_ID,
  CARBON_ITEM_ID,
  NITROGEN_ITEM_ID,
  PHOSPHORUS_ITEM_ID,
  POTASSIUM_ITEM_ID,
  STRAW_BED_RECIPE_ITEM_ID,
  STRAW_BED_ITEM_ID,
  LEAF_DEN_KIT_ITEM_ID,
  DITTO_FLAG_ITEM_ID,
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

export const BUILDING_KIT_DEFS = Object.freeze({
  [LEAF_DEN_KIT_ITEM_ID]: Object.freeze({
    id: LEAF_DEN_KIT_ITEM_ID,
    itemId: LEAF_DEN_KIT_ITEM_ID,
    name: "House Kit",
    previewModelId: "leafDenKit",
    completedModelId: "leafDen",
    requiredMaterials: Object.freeze([
      Object.freeze({ itemId: "wood", quantity: LEAF_DEN_BUILD_REQUIREMENTS.wood }),
      Object.freeze({ itemId: LEAVES_ITEM_ID, quantity: LEAF_DEN_BUILD_REQUIREMENTS[LEAVES_ITEM_ID] })
    ]),
    requiredSpecialties: Object.freeze([
      CREATURE_SPECIALTY.BUILD,
      CREATURE_SPECIALTY.BURN
    ]),
    buildDurationSeconds: LEAF_DEN_BUILD_DURATION_MS / 1000,
    minFurnitureRequired: 3,
    validPlacementRules: Object.freeze([
      "unoccupied-ground"
    ])
  })
});

const BUILDING_KIT_LIST = Object.freeze(Object.values(BUILDING_KIT_DEFS));

export function listBuildingKits() {
  return BUILDING_KIT_LIST;
}

export function getBuildingKitByItemId(itemId) {
  return BUILDING_KIT_DEFS[itemId] || null;
}

export const WORLD_LIMIT = 144;

const HABITAT_TILE_STEP = 1.425;
const FLOWER_FIELD_TILE_STEP = HABITAT_TILE_STEP * 1.08;

function createFourTileHabitatLayout(id, center, patchKind) {
  const halfStep = HABITAT_TILE_STEP * 0.5;
  const [centerX, centerY, centerZ] = center;
  const offsets = [
    [-halfStep, -halfStep],
    [halfStep, -halfStep],
    [-halfStep, halfStep],
    [halfStep, halfStep]
  ];

  return offsets.map(([offsetX, offsetZ], index) => ({
    id: `${id}-${patchKind}-${index}`,
    habitatGroupId: id,
    position: [
      centerX + offsetX,
      centerY,
      centerZ + offsetZ
    ]
  }));
}

function createGridHabitatLayout(id, center, patchKind, {
  columns = 7,
  rows = 7,
  step = HABITAT_TILE_STEP
} = {}) {
  const [centerX, centerY, centerZ] = center;
  const halfColumns = (columns - 1) * 0.5;
  const halfRows = (rows - 1) * 0.5;
  const layout = [];

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const jitterSeed = row * columns + column;
      const jitterX = ((jitterSeed % 3) - 1) * 0.08;
      const jitterZ = (((jitterSeed + row) % 3) - 1) * 0.08;

      layout.push({
        id: `${id}-${patchKind}-${row}-${column}`,
        habitatGroupId: id,
        position: [
          centerX + (column - halfColumns) * step + jitterX,
          centerY,
          centerZ + (row - halfRows) * step + jitterZ
        ]
      });
    }
  }

  return layout;
}

export const GROUND_GRASS_LAYOUT = [
  ...createFourTileHabitatLayout("tall-grass-habitat-0", [8.55, 0, -5.7], "grass"),
  ...createFourTileHabitatLayout("tall-grass-habitat-1", [17.1, 0, -9.98], "grass"),
  ...createFourTileHabitatLayout("tall-grass-habitat-2", [25.65, 0, -5.7], "grass")
];

export const GROUND_FLOWER_LAYOUT = [
  ...createFourTileHabitatLayout("pretty-flower-bed-habitat-0", [12.825, 0, -7.425], "flower"),
  ...createGridHabitatLayout("water-gun-flower-field-0", [96, 0, 76], "flower", {
    columns: 9,
    rows: 7,
    step: FLOWER_FIELD_TILE_STEP
  })
];

export const LEPPA_TREE_POSITION = [29.6, 0.02, -10.8];
export const LEPPA_TREE_DROP_OFFSET = [0.82, 0.02, 0.48];
export const WORKBENCH_POSITION = [38.0, 0.02, -17.0];
export const WORKBENCH_INTERACT_DISTANCE = 5.4;
export const COLONY_CACHE_POSITION = [34.6, 0.02, -14.0];
export const TANGROWTH_CAMPFIRE_ANCHOR_POSITION = [12.4, 0.02, -8.4];
export const TANGROWTH_CAMPFIRE_ANCHOR_READY_DISTANCE = 0.42;
export const POKEMON_TALK_INTERACT_DISTANCE = 3.1;
export const RUINED_POKEMON_CENTER_POSITION = [25.4, 0, 12.6];
export const RUINED_POKEMON_CENTER_INTERACT_DISTANCE = 5.4;
export const RUINED_POKEMON_CENTER_GUIDE_POSITION = [20.95, 0.02, 10.2];
export const POKEMON_CENTER_PC_POSITION = [30.35, 0.02, 13.65];
export const COLONY_TERMINAL_INTERACT_DISTANCE = 4.4;
export const BOULDER_SHADED_TALL_GRASS_BOULDER_POSITION = [32.3, 0.02, 9.98];
export const BOULDER_SHADED_TALL_GRASS_RADIUS = 4.6;

export const WORLD_REGIONS = [
  {
    id: "hearth-hollow",
    label: "Core Hollow",
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
    label: "Old Colony Hub Ruins",
    minX: -72,
    maxX: -40,
    minZ: 30,
    maxZ: 72,
  },
  {
    id: "outer-north-ridge",
    label: "Outer North Ridge",
    minX: -144,
    maxX: 144,
    minZ: -144,
    maxZ: -72,
  },
  {
    id: "outer-east-steppe",
    label: "Outer East Steppe",
    minX: 72,
    maxX: 144,
    minZ: -72,
    maxZ: 144,
  },
  {
    id: "outer-south-marsh",
    label: "Outer South Marsh",
    minX: -144,
    maxX: 72,
    minZ: 72,
    maxZ: 144,
  },
  {
    id: "outer-west-plateau",
    label: "Outer West Plateau",
    minX: -144,
    maxX: -72,
    minZ: -72,
    maxZ: 72,
  },
];

export const CARBON_ORE_ATMOSPHERE_COVERAGE_RATIO = 0.3;
const CARBON_ORE_GRID_SPACING = 18;
const CARBON_ORE_RESPAWN_DURATION = 24;
const CARBON_ORE_PICKUP_RADIUS = 1.48;

function hashUnit(value) {
  const hashed = Math.sin(value * 12.9898 + 78.233) * 43758.5453;
  return hashed - Math.floor(hashed);
}

function getCarbonOreHash(regionIndex, x, z, salt = 0) {
  return hashUnit(
    (regionIndex + 1) * 9176.23 +
    (Math.round(x * 10) + 1440) * 12.17 +
    (Math.round(z * 10) + 1440) * 37.61 +
    salt * 101.3
  );
}

function createCarbonOreResourceNode(id, position, regionIndex, x, z) {
  const scale = 0.74 + getCarbonOreHash(regionIndex, x, z, 2) * 0.28;
  const yaw = getCarbonOreHash(regionIndex, x, z, 3) * Math.PI * 2;

  return {
    id,
    label: "Carbon Ore",
    itemId: CARBON_ITEM_ID,
    markerKey: CARBON_ITEM_ID,
    position,
    offset: [...position],
    scale,
    yaw,
    active: true,
    usesModelInstance: true,
    yield: 1,
    respawnDuration: CARBON_ORE_RESPAWN_DURATION,
    interactDistance: CARBON_ORE_PICKUP_RADIUS,
    activeWhen: () => true,
  };
}

function createCarbonOreResourceNodes() {
  const nodes = [];
  const occupied = new Set();

  for (const [regionIndex, region] of WORLD_REGIONS.entries()) {
    for (
      let x = region.minX + CARBON_ORE_GRID_SPACING * 0.5;
      x <= region.maxX - CARBON_ORE_GRID_SPACING * 0.5;
      x += CARBON_ORE_GRID_SPACING
    ) {
      for (
        let z = region.minZ + CARBON_ORE_GRID_SPACING * 0.5;
        z <= region.maxZ - CARBON_ORE_GRID_SPACING * 0.5;
        z += CARBON_ORE_GRID_SPACING
      ) {
        if (getCarbonOreHash(regionIndex, x, z, 1) >= CARBON_ORE_ATMOSPHERE_COVERAGE_RATIO) {
          continue;
        }

        const jitterX = (getCarbonOreHash(regionIndex, x, z, 4) - 0.5) * 5.2;
        const jitterZ = (getCarbonOreHash(regionIndex, x, z, 5) - 0.5) * 5.2;
        const carbonX = Number((x + jitterX).toFixed(2));
        const carbonZ = Number((z + jitterZ).toFixed(2));
        const key = `${Math.round(carbonX)}:${Math.round(carbonZ)}`;
        if (occupied.has(key)) {
          continue;
        }

        occupied.add(key);
        nodes.push(createCarbonOreResourceNode(
          `carbon-ore-${nodes.length + 1}`,
          [carbonX, 0.02, carbonZ],
          regionIndex,
          x,
          z
        ));
      }
    }
  }

  return nodes;
}

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
  { offset: [-118, 0, -92], scale: 0.86, yaw: 0.31 },
  { offset: [-128, 0, -28], scale: 0.9, yaw: -0.2 },
  { offset: [-112, 0, 54], scale: 0.84, yaw: 0.18 },
  { offset: [-86, 0, 118], scale: 0.88, yaw: -0.34 },
  { offset: [-34, 0, 122], scale: 0.83, yaw: 0.26 },
  { offset: [28, 0, 118], scale: 0.87, yaw: -0.16 },
  { offset: [82, 0, 94], scale: 0.92, yaw: 0.23 },
  { offset: [124, 0, 36], scale: 0.85, yaw: -0.3 },
  { offset: [116, 0, -42], scale: 0.89, yaw: 0.14 },
  { offset: [74, 0, -108], scale: 0.86, yaw: -0.24 },
  { offset: [12, 0, -124], scale: 0.88, yaw: 0.33 },
  { offset: [-58, 0, -116], scale: 0.84, yaw: -0.18 },
  { offset: [-28, 0, 82], scale: 0.83, yaw: 0.2 },
  { offset: [34, 0, 78], scale: 0.86, yaw: -0.22 },
  { offset: [58, 0, 58], scale: 0.84, yaw: 0.17 },
  { offset: [-72, 0, 72], scale: 0.88, yaw: -0.28 },
];

export const OUTPOST_INSTANCE_LAYOUT = [
  { id: "north-shed", offset: [-18, 0, -30], scale: 0.72, yaw: 0.08 },
  { id: "marsh-outpost", offset: [16, 0, 32], scale: 0.78, yaw: -0.14 },
  { id: "west-ruin", offset: [-46, 0, 24], scale: 0.74, yaw: 0.12 },
];

export const RUINED_POKEMON_CENTER_LAYOUT = [
  {
    id: "ruined-pokemon-center-shell",
    offset: [...RUINED_POKEMON_CENTER_POSITION],
    scale: 0.86,
    yaw: -0.18
  }
];

export const NPC_PROFILES = {
  tangrowth: {
    id: "tangrowth",
    label: SANDBOTS_BOT_NAMES.overseer,
    role: "Colony Overseer",
    summary:
      "The Overseer Bot is the first sign that the small planet's colony program is still alive. It catches the player at the end of the cinematic and redirects the run toward the Core Keeper and the repair loop.",
    idleLine:
      `${SANDBOTS_BOT_NAMES.overseer}: stay sharp. The Core Keeper keeps the hub steady while the rest of us scout.`,
  },
  aunty: {
    id: "aunty",
    label: "Core Keeper Bot",
    role: "Habitat Core Keeper",
    summary:
      "The Core Keeper Bot kept the first hub alive while the island routes collapsed. It gives the run its repair cadence and keeps the colony logic grounded.",
    idleLine:
      "Core Keeper Bot: hub first. Every safe loop starts and ends with stable systems.",
  },
  bufo: {
    id: "bufo",
    label: "Route Survey Bot",
    role: "Marsh Route Surveyor",
    summary:
      "The Route Survey Bot owns the safest marsh corridor. It turns exploration into planning by requiring a stable field ration before the granite route opens.",
    idleLine:
      "Route Survey Bot: if your supply loop survives the marsh, the granite route can open.",
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
  tangrowth: { glyph: "O", color: "#b26bff", ink: "#24123b" },
  squirtle: { glyph: "H", color: "#75c6ee", ink: "#10253a" },
  aunty: { glyph: "K", color: "#d7869b", ink: "#211015" },
  bufo: { glyph: "R", color: "#81b96b", ink: "#11200f" },
  willow: { glyph: "W", color: "#8b84d4", ink: "#131225" },
  workbench: { glyph: "i", color: "#7bc7ff", ink: "#0b1f32", shape: "circle" },
  colonyCache: { glyph: "C", color: "#f2c66d", ink: "#211608", shape: "circle" },
  stove: { glyph: "S", color: "#db8a59", ink: "#2a1308" },
  bridge: { glyph: "B", color: "#c6a46b", ink: "#23160d" },
  gate: { glyph: "G", color: "#7b8799", ink: "#151a20" },
  burrow: { glyph: "H", color: "#9b7551", ink: "#1a120b" },
  woolNest: { glyph: "Y", color: "#d8d3ca", ink: "#25231f" },
  silkNest: { glyph: "S", color: "#8fd0d6", ink: "#102326" },
  looseGranite: { glyph: "G", color: "#8b9098", ink: "#171a1d" },
  pokemonCenter: { glyph: "+", color: "#d94a5b", ink: "#fff2f4" },
  pokemonCenterPc: { glyph: "i", color: "#7bc7ff", ink: "#0b1f32", shape: "circle" },
  [CARBON_ITEM_ID]: { glyph: "C", color: "#2f343d", ink: "#f2f7ff" },
  challengeBoulder: { glyph: "B", color: "#8f98a3", ink: "#171b1f" },
};

export const PLACEHOLDER_RECIPES = {
  campfire: RECIPE_DEFS.campfire,
  strawBed: RECIPE_DEFS.strawBed,
  bridgeKit: RECIPE_DEFS.bridgeKit,
  marshPie: RECIPE_DEFS.marshPie,
  granitePickaxe: RECIPE_DEFS.granitePickaxe,
  burrowRepairKit: RECIPE_DEFS.burrowRepairKit,
};

export const STORY_QUESTS = [
  {
    id: "meetTangrowth",
    eyebrow: "Opening",
    act: "Act I • First Voice in the Ash",
    difficulty: 1,
    title: "Reach the Overseer Bot",
    body: "Reach the Overseer Bot near the ruins and figure out what it just spotted in the ash.",
    storyBeat:
      "The run does not start with tools or crafting. It starts with the colony overseer catching you in the aftermath and pulling your attention toward another damaged bot.",
    onboarding:
      "Walk up to the Overseer Bot, then press E to interact. This first beat only teaches movement, approach, and the basic talk cadence.",
    leadNpcId: "tangrowth",
    reward: "Bot trail",
    actionLabel: "E / Talk",
    targetId: "tangrowth",
    toolkitHint: "Opening / Route Setup",
    resolveLine:
      `${SANDBOTS_BOT_NAMES.overseer}: ${TANGROWTH_OPENING_LINE} There is another bot out there. Find them before the trail goes cold.`,
  },
  {
    id: "findPokemon",
    eyebrow: "Opening",
    act: "Act I • First Voice in the Ash",
    difficulty: 1,
    title: "Find the Stranded Bot",
    body: "A weak signal is coming from deeper in the ruins. Track down the stranded bot the overseer heard.",
    storyBeat:
      "The first hook is not home. It is the sound of another survivor somewhere out in the dead ground.",
    onboarding:
      "Follow the marker toward the signal, move close to the stranded bot, then press E to interact.",
    leadNpcId: "tangrowth",
    reward: "First contact",
    actionLabel: "E / Talk",
    targetId: "squirtle",
    toolkitHint: "Onboarding / First Cry",
    resolveLine:
      "You found the stranded bot. Try restoring the dead ground nearby and see what systems come back online.",
  },
  {
    id: "makingHabitats",
    eyebrow: "Discovery",
    act: "Act I • Habitat Seeds",
    difficulty: 1,
    title: "Making Habitats!",
    body:
      "Arrange tall grass, trees, rocks, and furniture into the right combinations to create a viable colony zone!",
    storyBeat:
      "Restoration is not only about repairs. Every revived patch teaches how the island becomes livable again.",
    onboarding:
      `Use ${SANDBOTS_ITEM_NAMES.hydroTool} on dead ground and watch for colony-zone clues when plants return. New restoration zones will begin appearing in the world.`,
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
    title: "Find the Core Keeper",
    body: "Talk to the Core Keeper Bot beside the hub to turn the overseer's warning into an actual restoration route.",
    storyBeat:
      "You return to a damaged colony hub held together by emergency routines. The Core Keeper is the only reason the first work loop still responds.",
    onboarding:
      "Follow the overseer's pointer back to the hub, then press E to talk to the Core Keeper and anchor the route at the colony core.",
    leadNpcId: "aunty",
    reward: "Bridge plan",
    actionLabel: "E / Talk",
    targetId: "aunty",
    toolkitHint: "Articles / Walkthrough",
    resolveLine:
      "Core Keeper Bot: gait stable. Now gather the basics and prove this place can still be repaired.",
  },
  {
    id: "craftBridgeKit",
    eyebrow: "Restoration",
    act: "Act I • Embers at Home",
    difficulty: 1,
    title: "Repair the Bridge",
    body: "Gather Wood x4 and Flax Fiber x2, then craft a Bridge Repair Kit at the Workbench.",
    storyBeat:
      "The first repair is small on purpose. The Core Keeper teaches that colony survival begins with tight loops and simple materials.",
    onboarding:
      "Press Enter near palms and flax patches to harvest. Watch the task panel counts, then use E at the Workbench to craft.",
    leadNpcId: "aunty",
    reward: "Bridge Kit",
    actionLabel: "Enter + E",
    requirements: {
      wood: 4,
      flaxFiber: 2,
    },
    recipeId: "bridgeKit",
    stationId: "workbench",
    toolkitHint: `Crafting / ${SANDBOTS_ITEM_NAMES.thermalCabin} Kit`,
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
    reward: "South route signal",
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
    title: "Meet the Route Survey Bot",
    body: "Cross the repaired route and speak to the Route Survey Bot in the marsh pocket.",
    storyBeat:
      "The south corridor is the game's first real excursion. The Route Survey Bot tests whether your supply loop can leave the hub and return intact.",
    onboarding:
      "Use the south bridge marker as your first longer route. The map and world markers now matter more than the house line of sight.",
    leadNpcId: "bufo",
    reward: "Ration request",
    actionLabel: "E / Talk",
    targetId: "bufo",
    toolkitHint: "Articles / Granite Guide",
    resolveLine:
      "Route Survey Bot: no one crosses my marsh on vibes. Prepare a stable ration and I will show you where the stone starts.",
  },
  {
    id: "cookMarshPie",
    eyebrow: "Cooking",
    act: "Act II • Marsh Bargain",
    difficulty: 2,
    title: "Prepare Marsh Rations",
    body: "Gather Blackberry x4, Rowanberry x4, and Elderberry x2. Cook them into a Marsh Ration at the Stove.",
    storyBeat:
      "The marsh raises the demand: now you need multi-node gathering and a cooked item, not just raw stockpiles.",
    onboarding:
      "Collect berry routes with Space, then return home and use E at the Stove. This step teaches route planning and cooking cadence.",
    leadNpcId: "bufo",
    reward: "Marsh Ration",
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
    title: "Deliver the Ration",
    body: "Bring the Marsh Ration back to the Route Survey Bot to unlock the Granite Pickaxe blueprint.",
    storyBeat:
      "The Route Survey Bot is the checkpoint between comfort and competence. Prove the supply loop and it opens the mid-game.",
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
    title: "Assemble the Hub Repair Kit",
    body: "Gather Wood x6, Granite x4, and Silk Yarn x1. Craft a Hub Repair Kit at the Workbench.",
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
    toolkitHint: "Guides / Hub Restoration",
  },
  {
    id: "repairBurrow",
    eyebrow: "Finale",
    act: "Act V • The Last Hub",
    difficulty: 5,
    title: "Repair the Old Colony Hub",
    body: "Carry the Hub Repair Kit to the west hub site and finish the structural repair.",
    storyBeat:
      "The old colony hub is the campaign's physical climax. Once it stands again, the island stops feeling temporary.",
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
    act: "Act V • The Last Hub",
    difficulty: 5,
    title: "Host the Grand Dinner",
    body: "Return to the Core Keeper and close the route with the colony's first shared dinner.",
    storyBeat:
      "The ending is not another fetch quest. It is the proof that every loop, tool, and repair was building toward a shared home.",
    onboarding:
      "Return to the Core Keeper for the final interaction. After this, the island remains open as a post-story sandbox.",
    leadNpcId: "aunty",
    reward: "Story complete",
    actionLabel: "E / Host",
    targetId: "aunty",
    toolkitHint: "Articles / Complete Story Guide",
    resolveLine:
      "Core Keeper Bot: walls fixed, systems stable, everyone accounted for. Sit down. You brought the island back into rhythm.",
  },
  {
    id: "epilogue",
    eyebrow: "Complete",
    act: "Epilogue • Free Roam",
    difficulty: 1,
    title: "Grand Dinner Complete",
    body: "The first colony route is complete. Free-roam, gather supplies, and use the handbook as a live codex.",
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
    label: SANDBOTS_BOT_NAMES.overseer,
    position: [...ACT_TWO_MONSTER_POSITION],
    facing: "down",
    markerKey: null,
    renderCharacter: false,
    role: NPC_PROFILES.tangrowth.role,
    summary: NPC_PROFILES.tangrowth.summary,
    activeWhen: () => true,
  },
  {
    id: "aunty",
    label: "Core Keeper Bot",
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
    label: "Route Survey Bot",
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

export function canClaimBoulderChallengeReward(state = {}) {
  const flags = state.flags || {};

  return Boolean(
    !flags.boulderChallengeRewardClaimed &&
    (
      flags.boulderChallengeRewardReady ||
      flags.timburrRevealed
    )
  );
}

export const INTERACTABLE_DEFS = [
  {
    id: "workbench",
    label: "Workbench",
    type: "station",
    position: [...WORKBENCH_POSITION],
    markerKey: "workbench",
    markerHeight: 1.25,
    interactDistance: WORKBENCH_INTERACT_DISTANCE,
    activeWhen: () => true,
  },
  {
    id: "colonyCache",
    label: "Colony Cache",
    type: "site",
    position: [...COLONY_CACHE_POSITION],
    markerKey: "colonyCache",
    markerHeight: 1.1,
    interactDistance: 2.1,
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
    label: "Stranded Bot",
    type: "site",
    position: [...ACT_TWO_SQUIRTLE_POSITION],
    markerKey: null,
    interactDistance: POKEMON_TALK_INTERACT_DISTANCE,
    activeWhen: (state) => {
      return (
        state.questIndex === 1 ||
        (
          state.flags?.squirtleLeppaRequestAvailable &&
          !state.flags?.leppaBerryGiftComplete
        )
      );
    },
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
    label: "Old Colony Hub",
    type: "site",
    position: [-58.5, 0.02, 38.5],
    markerKey: "burrow",
    interactDistance: 1.8,
    activeWhen: (state) => state.flags.graniteGateOpened,
  },
  {
    id: "ruinedPokemonCenter",
    label: SANDBOTS_WORLD_TERMS.terminalRuins,
    type: "site",
    position: [...RUINED_POKEMON_CENTER_POSITION],
    markerKey: "pokemonCenter",
    interactDistance: RUINED_POKEMON_CENTER_INTERACT_DISTANCE,
    activeWhen: (state) => {
      return Boolean(
        state.flags?.pokemonCenterGuideStarted &&
        !state.flags?.ruinedPokemonCenterInspected
      );
    },
  },
  {
    id: "pokemonCenterPc",
    label: SANDBOTS_WORLD_TERMS.terminal,
    type: "site",
    position: [...POKEMON_CENTER_PC_POSITION],
    markerKey: "pokemonCenterPc",
    markerHeight: 1.28,
    interactDistance: COLONY_TERMINAL_INTERACT_DISTANCE,
    activeWhen: (state) => {
      return Boolean(state.flags?.ruinedPokemonCenterInspected);
    },
  },
];

function isCraftingLeafPileActive(state) {
  return Boolean(
    (state.flags.strawBedRecipeUnlocked && !state.flags.strawBedCrafted) ||
    (state.flags.leafDenBuildAvailable && !state.flags.leafDenConstructionStarted && !state.flags.leafDenBuilt)
  );
}

function isLeafDenBuildLeafPileActive(state) {
  return Boolean(
    state.flags.leafDenBuildAvailable &&
    !state.flags.leafDenConstructionStarted &&
    !state.flags.leafDenBuilt
  );
}

function createLeafPileResourceNode(id, position, activeWhen = isCraftingLeafPileActive) {
  return {
    id,
    label: "Leaf Pile",
    itemId: LEAVES_ITEM_ID,
    markerKey: LEAVES_ITEM_ID,
    position,
    yield: 1,
    respawnDuration: 6,
    interactDistance: 1.45,
    activeWhen,
  };
}

export const RESOURCE_NODE_DEFS = [
  ...createCarbonOreResourceNodes(),
  createLeafPileResourceNode("leaf-pile-1", [7.7, 0.02, -5.1]),
  createLeafPileResourceNode("leaf-pile-2", [9.4, 0.02, -6.7]),
  createLeafPileResourceNode("leaf-pile-3", [6.3, 0.02, -6.8], isLeafDenBuildLeafPileActive),
  createLeafPileResourceNode("leaf-pile-4", [15.2, 0.02, -12.4]),
  createLeafPileResourceNode("leaf-pile-5", [24.6, 0.02, 7.8]),
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
