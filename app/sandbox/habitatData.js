import {
  FLOWER_BED_POKEDEX_ENTRY_ID,
  TALL_GRASS_POKEDEX_ENTRY_ID
} from "../../pokedexEntries.js";

export const HABITAT_EVENT = Object.freeze({
  RESTORE_HABITAT: "RESTORE_HABITAT",
  REVIVE_PATCH: "REVIVE_PATCH"
});

export const HABITAT_STATUS = Object.freeze({
  ACTIVE: "active",
  PLANNED: "planned"
});

export const SMALL_ISLAND_HABITATS = Object.freeze([
  {
    id: "tall-grass",
    index: "001",
    label: "Tall Grass",
    category: "grass",
    biomeId: "ash-wilds",
    status: HABITAT_STATUS.ACTIVE,
    requiredObjects: [
      { objectId: "tall-grass", count: 4 }
    ],
    requirements: [
      { type: HABITAT_EVENT.RESTORE_HABITAT, targetId: "tall-grass", required: 1 }
    ],
    pokedexEntryId: TALL_GRASS_POKEDEX_ENTRY_ID,
    helperArchetypes: ["leaf-helper", "ember-helper", "water-helper", "stone-helper"],
    reveals: {
      npcId: "leaf-helper",
      flag: "tallGrassDiscovered"
    },
    notes: "First basic grass habitat; reveals the first plant helper."
  },
  {
    id: "tree-shaded-tall-grass",
    index: "002",
    label: "Tree-shaded Tall Grass",
    category: "grass",
    biomeId: "ash-wilds",
    status: HABITAT_STATUS.PLANNED,
    requiredObjects: [
      { objectId: "tall-grass", count: 4 },
      { objectId: "large-tree", count: 1 }
    ],
    helperArchetypes: ["vine-helper", "woodcutter-helper", "beetle-helper"],
    notes: "Grass habitat variant for tree shade and future woodcutting helpers."
  },
  {
    id: "boulder-shaded-tall-grass",
    index: "003",
    label: "Boulder-shaded Tall Grass",
    category: "grass",
    biomeId: "ash-wilds",
    status: HABITAT_STATUS.ACTIVE,
    requiredObjects: [
      { objectId: "tall-grass", count: 4 },
      { objectId: "large-boulder", count: 1 }
    ],
    requirements: [
      { type: HABITAT_EVENT.RESTORE_HABITAT, targetId: "boulder-shaded-tall-grass", required: 1 }
    ],
    reveals: {
      flag: "boulderShadedTallGrassDiscovered"
    },
    helperArchetypes: ["builder-helper", "stone-helper"],
    notes: "Early bridge toward rock, building, and strength mechanics."
  },
  {
    id: "hydrated-tall-grass",
    index: "004",
    label: "Hydrated Tall Grass",
    category: "grass",
    biomeId: "ash-wilds",
    status: HABITAT_STATUS.PLANNED,
    requiredObjects: [
      { objectId: "tall-grass", count: 4 },
      { objectId: "fresh-water", count: 2 }
    ],
    helperArchetypes: ["water-helper", "rain-helper"],
    notes: "Water-adjacent grass habitat for moisture-based helpers."
  },
  {
    id: "seaside-tall-grass",
    index: "005",
    label: "Seaside Tall Grass",
    category: "grass",
    biomeId: "bleak-shore",
    status: HABITAT_STATUS.PLANNED,
    requiredObjects: [
      { objectId: "tall-grass", count: 4 },
      { objectId: "ocean-water", count: 2 }
    ],
    helperArchetypes: ["slow-tide-helper"],
    notes: "Beach-side grass habitat for future shoreline progression."
  },
  {
    id: "elevated-tall-grass",
    index: "006",
    label: "Elevated Tall Grass",
    category: "grass",
    biomeId: "ash-wilds",
    status: HABITAT_STATUS.PLANNED,
    requiredObjects: [
      { objectId: "tall-grass", count: 4 },
      { objectId: "high-up-location", count: 1 }
    ],
    helperArchetypes: ["wing-helper"],
    notes: "Grass habitat on terrain height; should wait until jump/climb reads well."
  },
  {
    id: "illuminated-tall-grass",
    index: "007",
    label: "Illuminated Tall Grass",
    category: "grass",
    biomeId: "ash-wilds",
    status: HABITAT_STATUS.PLANNED,
    requiredObjects: [
      { objectId: "tall-grass-any", count: 4 },
      { objectId: "lighting-any", count: 1 }
    ],
    helperArchetypes: ["night-bug-helper"],
    notes: "Lighting variant for night/insect helpers."
  },
  {
    id: "pretty-flower-bed",
    index: "008",
    label: "Pretty Flower Bed",
    category: "flower",
    biomeId: "ash-wilds",
    status: HABITAT_STATUS.ACTIVE,
    requiredObjects: [
      { objectId: "wildflowers", count: 4 }
    ],
    requirements: [
      { type: HABITAT_EVENT.RESTORE_HABITAT, targetId: "pretty-flower-bed", required: 1 }
    ],
    pokedexEntryId: FLOWER_BED_POKEDEX_ENTRY_ID,
    helperArchetypes: ["wing-helper", "honey-helper", "ember-helper"],
    notes: "First flower discovery after Water Gun restores life."
  },
  {
    id: "tree-shaded-flower-bed",
    index: "009",
    label: "Tree-shaded Flower Bed",
    category: "flower",
    biomeId: "ash-wilds",
    status: HABITAT_STATUS.PLANNED,
    requiredObjects: [
      { objectId: "wildflowers", count: 4 },
      { objectId: "berry-tree", count: 1 }
    ],
    helperArchetypes: ["desert-bloom-helper", "sap-helper", "spark-bug-helper"],
    notes: "Flower habitat variant using berry trees."
  },
  {
    id: "hydrated-flower-bed",
    index: "010",
    label: "Hydrated Flower Bed",
    category: "flower",
    biomeId: "ash-wilds",
    status: HABITAT_STATUS.PLANNED,
    requiredObjects: [
      { objectId: "wildflowers", count: 4 },
      { objectId: "fresh-water", count: 2 }
    ],
    helperArchetypes: ["glow-bug-helper"],
    notes: "Water-adjacent flower habitat."
  },
  {
    id: "field-of-flowers",
    index: "011",
    label: "Field of Flowers",
    category: "flower",
    biomeId: "ash-wilds",
    status: HABITAT_STATUS.PLANNED,
    requiredObjects: [
      { objectId: "wildflowers", count: 8 }
    ],
    helperArchetypes: ["big-leaf-helper", "honey-queen-helper"],
    notes: "Larger flower habitat for humidity and environment-level progression."
  }
]);
